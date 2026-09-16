# TRD.md

# Technical Requirements Document — Leave Management System

## 1. Technical Overview

This document specifies exactly how the Leave Management System is to be implemented: stack, routing, API contracts, validation, security, and deployment configuration. It is the primary reference for writing code and should be read alongside Backend Schema.md (data shapes) and APPFLOW.md (behavioral flows).

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), JavaScript, HTML, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (MongoDB Atlas in production) |
| ODM | Mongoose |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcryptjs` or `bcrypt`) |
| HTTP client (frontend) | `axios` or native `fetch` |
| Dev/Test tooling | Git, GitHub, Postman, VS Code |
| Frontend hosting | Vercel |
| Backend hosting | Any Node.js-compatible host (e.g., Render, Railway) |
| Database hosting | MongoDB Atlas |

No deviation from this stack is required; no genuine technical conflict was identified during specification.

## 3. Frontend Requirements

- Built with Vite (`npm create vite@latest -- --template react`).
- Pages: Login, Employee Dashboard, Apply Leave, Leave History, Admin Dashboard, Employee List, Leave Requests (list + detail), plus shared Navbar and ProtectedRoute components.
- All API calls go through a `services/` layer (`authService.js`, `leaveService.js`, `adminService.js`) — no inline `fetch`/`axios` calls scattered through components.
- Forms perform basic client-side validation (required fields, date ordering) purely for UX; this never replaces server-side validation.

## 4. Backend Requirements

- Express app with a clear `routes → controllers → services → models` layering (see ARCHITECTURE.md §4).
- All routes mounted under `/api`.
- `server.js` as the single entry point; `config/db.js` handles the Mongoose connection with a clear error message and process exit on connection failure at startup.

## 5. Database Requirements

- Two collections: `users`, `leaveRequests` (see Backend Schema.md).
- Mongoose schemas with `timestamps: true`.
- Connection string supplied via `MONGO_URI` environment variable; never hardcoded.

## 6. Authentication

- Single login endpoint, shared by both roles: `POST /api/auth/login`.
- JWT signed with `JWT_SECRET`, expiry of 1 day (`expiresIn: '1d'`) — reasonable default for an assessment; documented as configurable.
- JWT payload: `{ id: <userId>, role: <'employee'|'admin'> }`.
- Token sent by the client as `Authorization: Bearer <token>` on every protected request.

## 7. Authorization

- `authMiddleware(req, res, next)`: extracts and verifies the token, attaches `req.user`, or returns `401`.
- `roleMiddleware(...allowedRoles)`: returns `403` if `req.user.role` is not included.
- Ownership check pattern (used in employee-scoped controllers):
  ```js
  if (leaveRequest.employeeId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not found', 404));
  }
  ```

## 8. API Requirements

### 8.1 Response Structure

**Success:**
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Insufficient leave balance",
  "error": "INSUFFICIENT_BALANCE"
}
```

Every endpoint below follows this envelope.

### 8.2 Authentication

#### `POST /api/auth/login`
- **Purpose:** Authenticate a user and issue a JWT.
- **Auth required:** No.
- **Request body:**
  ```json
  { "email": "asha.rao@example.com", "password": "secret123" }
  ```
- **Success response (200):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "<jwt>",
      "user": { "id": "...", "name": "Asha Rao", "email": "...", "role": "employee" }
    }
  }
  ```
- **Error responses:** `400` (missing fields), `401` (invalid credentials).
- **Validation:** `email` and `password` required.
- **Database operation:** Read `users` by `email` (with `password` field explicitly selected for comparison, since it's `select: false` by default).

### 8.3 Employee Endpoints

All require `authMiddleware`; no explicit role check needed beyond "must be authenticated" since these read the caller's own data (role inferred from the JWT).

#### `GET /api/employee/profile`
- **Purpose:** Return the logged-in employee's profile.
- **Success (200):** `data: { id, name, email, role }`.
- **Errors:** `401`.

#### `GET /api/employee/leave-balance`
- **Purpose:** Return the logged-in employee's leave balance.
- **Success (200):**
  ```json
  {
    "success": true,
    "message": "Leave balance fetched",
    "data": {
      "casual": { "total": 12, "used": 2, "remaining": 10 },
      "sick": { "total": 10, "used": 0, "remaining": 10 },
      "earned": { "total": 15, "used": 5, "remaining": 10 }
    }
  }
  ```
- **Database operation:** Read `users` document, derive `remaining` per type.

#### `POST /api/leaves`
- **Purpose:** Submit a new leave request.
- **Required role:** Employee (any authenticated non-admin user; admins are not expected to call this per Assumption A-08, but it is not hard-blocked for admins unless the reviewer wants strict separation — documented choice: **allowed for any authenticated user with a `leaveBalance`**, simplest consistent behavior).
- **Request body:**
  ```json
  { "leaveType": "Casual", "startDate": "2026-06-10", "endDate": "2026-06-12", "reason": "Personal work" }
  ```
- **Success (201):** `data` = created leave request document.
- **Error responses:**
  - `400` — missing/invalid field, invalid `leaveType`, `endDate < startDate`.
  - `400` — insufficient balance (`error: "INSUFFICIENT_BALANCE"`).
  - `401` — not authenticated.
- **Validation:** See APPFLOW.md §1.5.
- **Database operation:** Read `users.leaveBalance`; insert into `leaveRequests`.

#### `GET /api/leaves/my`
- **Purpose:** List the logged-in employee's own leave requests.
- **Query parameters:** `status` (optional: `Pending` | `Approved` | `Rejected`).
- **Success (200):** `data` = array of leave requests, newest first.
- **Database operation:** Read `leaveRequests` where `employeeId = req.user.id` (+ optional status filter).

#### `GET /api/leaves/:id`
- **Purpose:** View a single leave request the employee owns.
- **Success (200):** `data` = leave request document.
- **Error responses:** `400` (invalid ObjectId), `404` (not found or not owned by caller).
- **Database operation:** Read by `_id`; ownership check against `req.user.id`.

### 8.4 Admin Endpoints

All require `authMiddleware` + `roleMiddleware('admin')`.

#### `GET /api/admin/dashboard`
- **Purpose:** Aggregate statistics for the admin dashboard.
- **Success (200):**
  ```json
  {
    "success": true,
    "message": "Dashboard stats fetched",
    "data": { "totalEmployees": 12, "pending": 3, "approved": 20, "rejected": 4 }
  }
  ```
- **Database operation:** `countDocuments` on `users` (role: employee) and aggregate counts on `leaveRequests` grouped by `status`.

#### `GET /api/admin/employees`
- **Purpose:** List all employees with their current balances.
- **Success (200):** `data` = array of `{ id, name, email, leaveBalance }`.
- **Database operation:** Read `users` where `role: "employee"`, excluding `password`.

#### `GET /api/admin/leaves`
- **Purpose:** List all leave requests, optionally filtered.
- **Query parameters:** `status` (optional).
- **Success (200):** `data` = array of leave requests, each populated with basic employee info (`name`, `email`).
- **Database operation:** Read `leaveRequests` (+ optional status filter), `.populate('employeeId', 'name email')`.

#### `GET /api/admin/leaves/:id`
- **Purpose:** View full detail of any leave request.
- **Success (200):** `data` = leave request document, populated with employee info.
- **Errors:** `400` (invalid id), `404` (not found).

#### `PATCH /api/admin/leaves/:id/approve`
- **Purpose:** Approve a pending leave request.
- **Success (200):** `data` = updated leave request (status: `Approved`).
- **Error responses:** `404` (not found), `409` (not currently `Pending`).
- **Database operation:** Status-guarded update to `leaveRequests` + balance update to `users` (see Backend Schema.md §5).

#### `PATCH /api/admin/leaves/:id/reject`
- **Purpose:** Reject a pending leave request.
- **Request body (optional):** `{ "rejectionReason": "Insufficient coverage during this period" }`
- **Success (200):** `data` = updated leave request (status: `Rejected`).
- **Error responses:** `404`, `409` (same guard as approve).
- **Database operation:** Status-guarded update to `leaveRequests` only.

## 9. Validation

- Centralized `validate` middleware using a lightweight schema validator (e.g., a small hand-rolled validator, or `express-validator`/`zod` if a dependency is acceptable) applied per-route to request bodies.
- All numeric/date fields parsed and range-checked before use — never passed directly into a Mongo query unvalidated.
- All `:id` route params validated as a well-formed MongoDB ObjectId before querying (`mongoose.Types.ObjectId.isValid(id)`), returning `400` early otherwise, to avoid unhandled cast exceptions.

## 10. Error Handling

- Custom `AppError extends Error` class carrying `statusCode` and a machine-readable `errorCode` string (e.g., `INSUFFICIENT_BALANCE`, `ALREADY_PROCESSED`, `NOT_FOUND`).
- All controllers wrapped in an `asyncHandler` utility to forward rejected promises to Express's error pipeline without repetitive try/catch blocks.
- Centralized `errorHandler` middleware (last in the middleware chain) maps `AppError` instances to the standard error envelope, and maps any unexpected error to a generic `500` without leaking internals.

## 11. Security

- bcrypt hashing with a cost factor of 10–12 for all passwords.
- JWT secret of sufficient length/entropy, stored only in `JWT_SECRET` env var.
- CORS configured with an explicit allow-list (`CLIENT_URL`), not a wildcard, in production.
- No sensitive fields (`password`) ever included in a Mongoose `toJSON`/API response — enforced via `select: false` on the schema plus explicit projection in queries that need the hash (login) only.
- Rate limiting on the login endpoint is a reasonable optional hardening step but not required for assessment scope (documented as a Future Enhancement if time allows).

## 12. Leave Calculation

```
totalDays = floor( (endDate - startDate) / (1000 * 60 * 60 * 24) ) + 1
```
- Both dates normalized to midnight UTC before subtraction to avoid timezone/DST off-by-one errors.
- Inclusive of both `startDate` and `endDate` (PRD.md Assumption A-03).
- Weekends are **included** in the count (not excluded) — explicitly flagged as an assumption, not a hidden behavior.

## 13. Leave Balance Calculation

**At application time (validation only):**
```
remaining = leaveBalance[leaveType].total - leaveBalance[leaveType].used
if (totalDays > remaining) → reject with 400 INSUFFICIENT_BALANCE
```

**At approval time (the only place balance is actually written):**
```
1. Fetch leaveRequest by id.
2. If leaveRequest.status !== 'Pending' → 409 ALREADY_PROCESSED. Stop.
3. Fetch the employee (users document).
4. Re-check: remaining = leaveBalance[leaveType].total - leaveBalance[leaveType].used
   if (leaveRequest.totalDays > remaining) → 400 INSUFFICIENT_BALANCE. Stop.
   (Defensive re-check — covers the edge case where balance shrank due to another
   request approved in the meantime; see PRD.md Assumption A-06.)
5. leaveBalance[leaveType].used += leaveRequest.totalDays
6. leaveRequest.status = 'Approved'; reviewedBy = admin.id; reviewedAt = now.
7. Persist both changes (transaction where available; see Backend Schema.md §5).
```

**At rejection time:** only step 6-equivalent (status/reviewer fields) — no balance touch.

## 14. State Management

- Frontend: React Context (`AuthContext`) holding `{ user, token, login(), logout() }`. No global state library needed at this scale.

## 15. Frontend Routing

| Route | Access | Page |
|---|---|---|
| `/login` | Public | Login |
| `/dashboard` | Employee | Employee Dashboard |
| `/apply-leave` | Employee | Apply Leave form |
| `/leave-history` | Employee | Leave History |
| `/admin/dashboard` | Admin | Admin Dashboard |
| `/admin/employees` | Admin | Employee List |
| `/admin/leaves` | Admin | Leave Requests list |
| `/admin/leaves/:id` | Admin | Leave Request detail |

`ProtectedRoute` components redirect to `/login` if unauthenticated, or to the caller's own dashboard if authenticated but wrong-role.

## 16. Backend Routing

```
/api/auth
  POST   /login

/api/employee
  GET    /profile
  GET    /leave-balance

/api/leaves
  POST   /
  GET    /my
  GET    /:id

/api/admin
  GET    /dashboard
  GET    /employees
  GET    /leaves
  GET    /leaves/:id
  PATCH  /leaves/:id/approve
  PATCH  /leaves/:id/reject
```

## 17. Middleware

`authMiddleware`, `roleMiddleware`, `validate`, `errorHandler`, `asyncHandler` (utility, not strictly middleware but used identically across all controllers).

## 18. Controllers

`authController`, `employeeController`, `leaveController`, `adminController` — one file per resource area, each a thin layer calling into `services/`.

## 19. Models

`User` (Mongoose schema per Backend Schema.md §1), `LeaveRequest` (per §2).

## 20. Services

`leaveService` (day calculation, balance validation, approve/reject business logic), `statsService` (dashboard aggregate queries).

## 21. Environment Variables

**Backend (`backend/.env`):**

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas (or local) connection string. |
| `JWT_SECRET` | Secret used to sign/verify JWTs. |
| `PORT` | Port the Express server listens on (e.g., `5000`). |
| `CLIENT_URL` | The deployed frontend origin, used for CORS allow-listing. |

**Frontend (`frontend/.env`):**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the deployed backend API, e.g. `https://<backend-host>/api`. |

No real values are provided anywhere in this documentation; `.env.example` files (with variable names but no values) should be committed instead of `.env`.

## 22. Logging

- Basic request logging via `morgan` (dev format in development) is sufficient; no structured/centralized logging service needed at this scale.
- Errors handled by `errorHandler` are logged server-side (`console.error`) with enough context (route, message) to debug, without printing sensitive data (passwords, tokens).

## 23. Testing

- Manual API testing via Postman collection covering every endpoint in §8, both success and error cases (see TASKS.md Phase 8 for the specific scenarios to exercise, mirroring PRD.md's Edge Cases).
- Optional automated tests (if time permits): a small Jest/Supertest suite covering auth, leave application validation, and the approve/reject state-guard — these are the highest-value tests given the balance-consistency requirement.

## 24. Deployment

See README.md for the full step-by-step deployment procedure. Summary:
- Database: MongoDB Atlas cluster, connection string as `MONGO_URI`.
- Backend: deployed to a Node-compatible host; build/start via `npm install && npm start`; environment variables configured in the host's dashboard.
- Frontend: deployed to Vercel; build via `npm run build`; `VITE_API_URL` set as a Vercel environment variable pointing at the deployed backend.

## 25. Production Configuration

- `NODE_ENV=production` on the backend host.
- CORS restricted to the exact deployed frontend origin (`CLIENT_URL`), not `*`.
- Frontend built (`vite build`) rather than served via the dev server.
- Database connection uses the Atlas SRV connection string with a database user scoped to least privilege (read/write on the application database only).
