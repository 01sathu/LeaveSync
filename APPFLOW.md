# APPFLOW.md

# Application Flow Document — Leave Management System

This document describes every major user flow, the corresponding system behavior, and the text-based flow diagrams for both the Employee and Admin roles. It is consistent with PRD.md (requirement IDs) and TRD.md (API endpoints).

## 1. Employee Flows

### 1.1 Login

- **Starting point:** Employee opens the login page.
- **User action:** Enters email and password, submits.
- **System action:** Backend looks up user by email, compares password hash with bcrypt.
- **Validation:** Email format valid; both fields non-empty.
- **Database interaction:** Read from `users` collection by `email`.
- **API interaction:** `POST /api/auth/login`
- **Result:** On success, JWT returned; frontend stores token and redirects to Employee Dashboard.
- **Error scenario:** Invalid email/password → `401 Unauthorized`, generic "Invalid credentials" message (never reveal whether the email exists).

```
Employee
 → Login Page
 → Enter email + password
 → POST /api/auth/login
 → Backend verifies bcrypt hash
 → JWT generated (role: employee)
 → Token stored client-side
 → Redirect to Employee Dashboard
```

### 1.2 Dashboard

- **Starting point:** Employee lands on dashboard after login.
- **User action:** None (auto-load).
- **System action:** Fetch profile + leave balance + summary counts.
- **API interaction:** `GET /api/employee/profile`, `GET /api/employee/leave-balance`, `GET /api/leaves/my`
- **Database interaction:** Read `users` document for balance; read `leaveRequests` filtered by `employeeId` for counts.
- **Result:** Dashboard shows balance per leave type, pending/approved/rejected counts.
- **Error scenario:** Expired/invalid JWT → `401`, redirect to login.

### 1.3 Leave Balance

- **Starting point:** Employee views balance widget/page.
- **API interaction:** `GET /api/employee/leave-balance`
- **Database interaction:** Read `leaveBalance` field from the employee's `users` document.
- **Result:** Returns `{ casual: { total, used, remaining }, sick: {...}, earned: {...} }`.

### 1.4 Apply Leave

- **Starting point:** Employee clicks "Apply Leave", opens the form.
- **User action:** Selects leave type, start date, end date, enters reason, submits.
- **System action:** Validate → calculate total days → check balance → create request.
- **Validation:** All fields required; `endDate >= startDate`; `leaveType` in enum; balance sufficient (FR-006, FR-007, FR-025).
- **Database interaction:** Insert into `leaveRequests` with `status: "Pending"`.
- **API interaction:** `POST /api/leaves`
- **Result:** `201 Created`, new request returned with status `Pending`.
- **Error scenario:**
  - Missing/invalid fields → `400`.
  - `endDate < startDate` → `400` ("End date cannot be before start date").
  - Insufficient balance → `400` ("Insufficient leave balance").

```
Employee
 → Apply Leave Form
 → Select leaveType, startDate, endDate, reason
 → Client-side validation (basic)
 → POST /api/leaves
 → Server validates dates + leaveType
 → Server calculates totalDays (inclusive calendar days)
 → Server checks remaining balance for leaveType
 → If insufficient → 400 error, no record created
 → If sufficient → Insert leaveRequests document, status = Pending
 → Response 201 with created request
 → Employee sees request in "My Requests" as Pending
```

### 1.5 Leave Validation (detail)

Server-side validation sequence for `POST /api/leaves`:
1. Auth check (valid JWT, role = employee).
2. Required fields present: `leaveType`, `startDate`, `endDate`, `reason`.
3. Dates are valid, parseable dates.
4. `endDate >= startDate`.
5. `leaveType` is one of `Casual`, `Sick`, `Earned`.
6. Calculate `totalDays = (endDate - startDate in days) + 1`.
7. Load employee's `leaveBalance[leaveType]`; compute `remaining = total - used`.
8. If `totalDays > remaining` → reject with `400`.
9. Else create the request with `status: "Pending"`.

### 1.6 Submit Request / Pending Request

Once created, the request is visible to the Employee (My Requests) and to the Admin (All Requests / Pending Requests) with `status: "Pending"`. No balance change has occurred yet (FR-009).

### 1.7 Leave History

- **Starting point:** Employee opens "Leave History".
- **API interaction:** `GET /api/leaves/my` (optionally with `?status=` filter).
- **Database interaction:** Read `leaveRequests` where `employeeId` = current user, sorted by `createdAt` descending.
- **Result:** List of all past and current requests with status, dates, type, and reviewer info if processed.

### 1.8 Approved Request (Employee view)

- **Trigger:** Admin approves the request (see Admin flow §2.6).
- **Employee-side result:** On next fetch of `GET /api/leaves/my` or `GET /api/leaves/:id`, status shows `Approved`, and `GET /api/employee/leave-balance` reflects the deducted balance.

### 1.9 Rejected Request (Employee view)

- **Trigger:** Admin rejects the request (see Admin flow §2.7).
- **Employee-side result:** Status shows `Rejected`, optional `rejectionReason` visible, balance unchanged.

### 1.10 Logout

- **User action:** Clicks "Logout".
- **System action:** Frontend clears stored JWT and redirects to login. No server-side session exists to invalidate (stateless JWT); this is a client-side action only (FR-024).

## 2. Admin Flows

### 2.1 Login

Identical mechanism to Employee login (§1.1), same endpoint `POST /api/auth/login`. The JWT issued encodes `role: admin`, which routes the frontend to the Admin Dashboard instead of the Employee Dashboard.

```
Admin
 → Login Page
 → Enter email + password
 → POST /api/auth/login
 → Backend verifies bcrypt hash
 → JWT generated (role: admin)
 → Redirect to Admin Dashboard
```

### 2.2 Admin Dashboard

- **API interaction:** `GET /api/admin/dashboard`
- **Database interaction:** Aggregate counts from `users` (total employees) and `leaveRequests` (counts by status).
- **Result:** Summary cards — total employees, pending, approved, rejected.

### 2.3 Employee List

- **API interaction:** `GET /api/admin/employees`
- **Database interaction:** Read all `users` where `role = employee`, projecting out password hash.
- **Result:** List of employees with name, email, and current leave balance per type.

### 2.4 Leave Request List / Pending Requests

- **API interaction:** `GET /api/admin/leaves` (optionally `?status=Pending`)
- **Database interaction:** Read `leaveRequests`, optionally filtered by status, joined/populated with basic employee info (name, email) via `employeeId` reference.
- **Result:** Full list (or filtered pending-only list) for the admin to review.

### 2.5 View Request Details

- **API interaction:** `GET /api/admin/leaves/:id` (or reuse `GET /api/leaves/:id` with admin authorization allowed)
- **Database interaction:** Read single `leaveRequests` document by `_id`, populate employee info.
- **Validation:** `:id` must be a valid ObjectId; must exist → else `404`.
- **Result:** Full detail view: employee, leave type, dates, totalDays, reason, status, reviewer info if processed.

### 2.6 Approve Request

- **Starting point:** Admin viewing a `Pending` request clicks "Approve".
- **System action:** Verify request is currently `Pending` → deduct `totalDays` from the employee's `leaveBalance[leaveType].used` → set `status = Approved`, `reviewedBy`, `reviewedAt`.
- **API interaction:** `PATCH /api/admin/leaves/:id/approve`
- **Database interaction:** Update `leaveRequests` document status/reviewer fields AND update the corresponding `users` document's `leaveBalance` — performed as a single logical operation (see TRD.md §"Leave Balance Calculation" for consistency approach).
- **Result:** `200 OK`, updated request returned; employee's balance is now reduced.
- **Error scenario:** Request not found → `404`. Request not `Pending` (already Approved/Rejected) → `409 Conflict` ("Request has already been processed").

```
Admin
 → Admin Dashboard
 → Get Pending Requests (GET /api/admin/leaves?status=Pending)
 → View Request Details
 → Click Approve
 → PATCH /api/admin/leaves/:id/approve
 → Server checks status === Pending (else 409)
 → Server deducts totalDays from users.leaveBalance[leaveType].used
 → Server sets leaveRequests.status = Approved, reviewedBy, reviewedAt
 → Response 200
 → Employee sees status = Approved, balance reduced
```

### 2.7 Reject Request

- **Starting point:** Admin viewing a `Pending` request clicks "Reject" (optionally enters a reason).
- **System action:** Verify request is currently `Pending` → set `status = Rejected`, `reviewedBy`, `reviewedAt`, optional `rejectionReason`. No balance change.
- **API interaction:** `PATCH /api/admin/leaves/:id/reject`
- **Result:** `200 OK`, updated request returned; employee's balance is unaffected.
- **Error scenario:** Same `404`/`409` rules as Approve.

```
Admin
 → View Request
 → Click Reject (+ optional reason)
 → PATCH /api/admin/leaves/:id/reject
 → Server checks status === Pending (else 409)
 → Server sets leaveRequests.status = Rejected, reviewedBy, reviewedAt, rejectionReason
 → Balance unchanged
 → Response 200
 → Employee sees status = Rejected
```

### 2.8 Leave Statistics

- **API interaction:** Included in `GET /api/admin/dashboard`.
- **Result:** Counts by status across all employees. (No date-range filtering in v1 — Future Enhancement.)

### 2.9 Employee Leave Balance (Admin view)

- **API interaction:** Included in `GET /api/admin/employees` response, or `GET /api/admin/employees/:id` for a single employee's detail if implemented.
- **Result:** Admin can see any employee's current balance by type.

### 2.10 Logout

Identical to Employee logout (§1.10) — client-side token clear and redirect.

## 3. Authentication Flow

```
Client
 → POST /api/auth/login { email, password }
 → Server finds user by email
 → If not found → 401 "Invalid credentials"
 → bcrypt.compare(password, user.passwordHash)
 → If mismatch → 401 "Invalid credentials"
 → jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn })
 → Response 200 { token, user: { id, name, email, role } }
```

## 4. Authorization Flow

```
Client request → Authorization: Bearer <token>
 → authMiddleware: verify JWT signature + expiry
   → invalid/missing → 401
   → valid → attach req.user = { id, role }
 → (if route is role-restricted) roleMiddleware(["admin"])
   → req.user.role not in allowed list → 403
   → else → next()
 → (if route is ownership-restricted, e.g. GET /api/leaves/:id for an employee)
   → controller checks leaveRequest.employeeId === req.user.id
   → mismatch → 403 or 404 (see TRD.md — 404 preferred to avoid leaking existence)
```

## 5. Leave Approval Flow

See §2.6 above (Approve Request). Summary invariant: **balance is only ever decremented at the moment `status` transitions from `Pending` to `Approved`, and that transition can only happen once.**

## 6. Leave Rejection Flow

See §2.7 above (Reject Request). Summary invariant: **rejection never changes balance, and can only happen once from `Pending`.**

## 7. Leave Balance Flow

```
Opening balance (per leave type): total, used = 0, remaining = total
   ↓
Employee applies → server checks remaining >= requestedDays
   ↓ (if insufficient) → 400, no change
   ↓ (if sufficient) → leaveRequests document created, status = Pending
                         (NO balance change yet)
   ↓
Admin approves → used += requestedDays  (remaining decreases)
   ↓
Admin rejects  → no change to used/remaining
```

## 8. Error Flows

| Scenario | HTTP Status | Notes |
|---|---|---|
| Missing/invalid JWT | 401 | See §"Authorization Flow" |
| Valid JWT, wrong role | 403 | e.g., Employee calling an Admin-only route |
| Employee accessing another employee's request | 403 or 404 | Ownership check fails |
| Resource not found (bad `:id`) | 404 | Includes malformed ObjectId, treated as not found |
| Validation failure (bad body) | 400 | Field-level message returned |
| Duplicate processing (approve/reject twice) | 409 | State conflict |
| Unexpected server/database error | 500 | Generic message, no internals leaked |

## 9. Logout Flow

```
User clicks Logout
 → Frontend clears JWT from storage (memory/localStorage per TRD.md)
 → Frontend clears auth context/state
 → Redirect to Login page
 → (No backend call required — JWT is stateless)
```
