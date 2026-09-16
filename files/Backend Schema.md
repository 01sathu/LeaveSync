# Backend Schema.md

# Backend Database Schema — Leave Management System

MongoDB is used with two collections: `users` and `leaveRequests`. No third collection is introduced — leave balance is embedded in the `users` document rather than tracked separately, since it is always accessed together with the employee record and does not need independent querying at this scale.

## 1. Collection: `users`

**Purpose:** Stores both Employee and Admin accounts, including credentials, role, and (for employees) leave balance.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | auto | auto | Primary key. |
| `name` | String | Yes | — | Full name of the user. |
| `email` | String | Yes | — | Login identifier. Must be unique. |
| `password` | String | Yes | — | bcrypt hash. Never returned in API responses (`select: false`). |
| `role` | String (enum) | Yes | `"employee"` | One of `"employee"`, `"admin"`. |
| `leaveBalance` | Object | Yes | see below | Per-leave-type balance object (embedded, see §1.1). Present for both roles for schema simplicity; only meaningfully used for `role: "employee"` (see PRD.md Assumption A-08). |
| `createdAt` | Date | auto | `Date.now` | Set by Mongoose timestamps. |
| `updatedAt` | Date | auto | `Date.now` | Set by Mongoose timestamps. |

### 1.1 `leaveBalance` sub-object

```json
{
  "casual": { "total": 12, "used": 0 },
  "sick":   { "total": 10, "used": 0 },
  "earned": { "total": 15, "used": 0 }
}
```

- `total` (Number, required): the employee's allotted days for that leave type (assumption default values per PRD.md A-02; configurable per employee at creation time).
- `used` (Number, required, default `0`): days consumed by **Approved** requests only.
- `remaining` is **not stored** — it is always derived as `total - used`, computed on read, to guarantee there is exactly one source of truth and no risk of the two numbers drifting out of sync.

### 1.2 Validation

- `email`: required, unique index, lowercase, valid email format (regex or validator library).
- `password`: required, min length 8 (enforced before hashing, at the request-validation layer — the schema itself just stores the hash).
- `role`: required, enum `["employee", "admin"]`, default `"employee"`.
- `leaveBalance.<type>.total` / `.used`: required Numbers, `min: 0`.

### 1.3 Indexing

- `email`: unique index (`{ email: 1 }, { unique: true }`) — enforces no duplicate accounts and speeds up login lookups.
- `role`: optional secondary index if employee-list-by-role queries become frequent (not required at this scale, but harmless to add: `{ role: 1 }`).

## 2. Collection: `leaveRequests`

**Purpose:** Stores every leave request submitted by an employee, its lifecycle status, and review metadata.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `_id` | ObjectId | auto | auto | Primary key. |
| `employeeId` | ObjectId (ref: `User`) | Yes | — | The employee who submitted the request. |
| `leaveType` | String (enum) | Yes | — | One of `"Casual"`, `"Sick"`, `"Earned"`. |
| `startDate` | Date | Yes | — | First day of leave. |
| `endDate` | Date | Yes | — | Last day of leave (inclusive). |
| `totalDays` | Number | Yes | computed | `(endDate - startDate in days) + 1`, computed server-side at creation — never trusted from the client. |
| `reason` | String | Yes | — | Free-text reason, max 500 characters. |
| `status` | String (enum) | Yes | `"Pending"` | One of `"Pending"`, `"Approved"`, `"Rejected"`. |
| `reviewedBy` | ObjectId (ref: `User`) | No | `null` | The Admin who processed the request. Set only when status leaves `Pending`. |
| `reviewedAt` | Date | No | `null` | Timestamp of approval/rejection. |
| `rejectionReason` | String | No | `null` | Optional note from the Admin, only relevant when `status === "Rejected"`. |
| `createdAt` | Date | auto | `Date.now` | Set by Mongoose timestamps. |
| `updatedAt` | Date | auto | `Date.now` | Set by Mongoose timestamps. |

### 2.1 Validation

- `employeeId`: required, must reference an existing `users` document with `role: "employee"`.
- `leaveType`: required, enum `["Casual", "Sick", "Earned"]`.
- `startDate` / `endDate`: required, valid Dates; schema-level validator enforces `endDate >= startDate`.
- `totalDays`: required, `min: 1`, always recalculated server-side (ignored if sent by the client).
- `reason`: required, `minlength: 1`, `maxlength: 500`.
- `status`: required, enum `["Pending", "Approved", "Rejected"]`, default `"Pending"`.
- `rejectionReason`: only meaningful when `status === "Rejected"`; not enforced as required even then (Admin may reject without a written reason).

### 2.2 Indexing

- `employeeId`: index (`{ employeeId: 1 }`) — supports fast "my requests" lookups.
- `status`: index (`{ status: 1 }`) — supports fast admin filtering (e.g., all Pending requests).
- Compound index `{ employeeId: 1, status: 1 }` — optional optimization if the employee-history-by-status query is common; not required at assessment scale but documented as a sensible addition.

## 3. Relationships

```
users (1) ────────< leaveRequests (many)
  _id                employeeId  (application-level reference, populated via Mongoose .populate())

users (1, admin) ──< leaveRequests (many, as reviewer)
  _id                reviewedBy  (application-level reference)
```

- MongoDB does not enforce foreign-key constraints; referential integrity (i.e., `employeeId` must point to a real user) is enforced in the service layer at creation time.
- `leaveRequests.employeeId` and `leaveRequests.reviewedBy` are both Mongoose `ObjectId` refs to `User`, allowing `.populate('employeeId', 'name email')` for admin views that need to display employee identity alongside a request.

## 4. How Leave Balance Is Stored and Updated

- Balance is stored embedded on the `users` document as `leaveBalance.<type>.{total, used}` (§1.1). It is **not** duplicated or cached anywhere else.
- **At application time** (`POST /api/leaves`): balance is **read only**, to validate `totalDays <= (total - used)`. No write occurs to `users` at this stage.
- **At approval time** (`PATCH /api/admin/leaves/:id/approve`): `users.leaveBalance[leaveType].used` is incremented by `totalDays`, and `leaveRequests.status` is set to `Approved` in the same logical operation.
- **At rejection time** (`PATCH /api/admin/leaves/:id/reject`): only `leaveRequests.status` (and `reviewedBy`/`reviewedAt`/`rejectionReason`) change. `users.leaveBalance` is untouched.

## 5. Preventing Incorrect Balance Updates

To guarantee balance can never be updated incorrectly or more than once for the same request:

1. **Status guard:** the approval/rejection handler first re-fetches the `leaveRequests` document and checks `status === "Pending"`. If not, it immediately returns `409 Conflict` and performs **no** write to either collection. This makes double-approval or approve-after-reject impossible.
2. **Atomicity:** where the deployment environment supports it (MongoDB Atlas replica sets, used in production), the status update and balance update are wrapped in a Mongoose transaction (`session.startTransaction()` / `commitTransaction()`), so a failure partway through rolls back both writes rather than leaving them inconsistent.
3. **Idempotency via status, not via retries:** because the guard in (1) is a hard precondition, even a retried/duplicate approval request (e.g., a double-click or network retry) results in the second call receiving `409` rather than double-deducting balance.
4. **Non-negative invariant:** balance is validated against `remaining = total - used` both at application time and defensively re-checked at approval time (in case balance changed between application and approval due to another approved request in the meantime) — see TRD.md §"Leave Balance Calculation" for the exact defensive check and its documented edge case (PRD.md Assumption A-06).

## 6. Sample Documents

**`users` (employee):**
```json
{
  "_id": "665f1b2c9e1a4a0012345678",
  "name": "Asha Rao",
  "email": "asha.rao@example.com",
  "password": "$2b$10$...(bcrypt hash)...",
  "role": "employee",
  "leaveBalance": {
    "casual": { "total": 12, "used": 2 },
    "sick": { "total": 10, "used": 0 },
    "earned": { "total": 15, "used": 5 }
  },
  "createdAt": "2026-01-10T09:00:00.000Z",
  "updatedAt": "2026-06-01T10:00:00.000Z"
}
```

**`leaveRequests` (approved):**
```json
{
  "_id": "665f2a9c9e1a4a0012349999",
  "employeeId": "665f1b2c9e1a4a0012345678",
  "leaveType": "Earned",
  "startDate": "2026-05-01T00:00:00.000Z",
  "endDate": "2026-05-05T00:00:00.000Z",
  "totalDays": 5,
  "reason": "Family function",
  "status": "Approved",
  "reviewedBy": "665f0a1a9e1a4a0012340001",
  "reviewedAt": "2026-04-20T12:00:00.000Z",
  "rejectionReason": null,
  "createdAt": "2026-04-18T08:30:00.000Z",
  "updatedAt": "2026-04-20T12:00:00.000Z"
}
```
