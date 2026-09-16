# ARCHITECTURE.md

# System Architecture — Leave Management System

## 1. Architecture Overview

The Leave Management System uses a simple three-tier architecture: a React single-page application (frontend), a Node.js/Express REST API (backend), and MongoDB Atlas (database). There is no message queue, cache layer, or microservice split — this is intentional, per the assessment's constraint against over-engineering.

```
┌─────────────────┐        HTTPS/REST (JSON)        ┌───────────────────┐        Mongoose/MongoDB driver        ┌──────────────────┐
│  React Frontend │  ───────────────────────────▶   │  Express Backend  │  ─────────────────────────────────▶   │  MongoDB Atlas   │
│  (Vite, hosted  │  ◀───────────────────────────    │  (Node.js, hosted │  ◀─────────────────────────────────   │  (users,         │
│  on Vercel)     │                                  │  on a Node host)  │                                        │  leaveRequests)  │
└─────────────────┘                                  └───────────────────┘                                        └──────────────────┘
```

## 2. Architecture Style

- **Style:** Monolithic REST API + SPA client (client-server, 3-tier).
- **Rationale:** The problem domain (leave requests, two roles, a handful of screens) does not justify microservices, event queues, or a BFF layer. A monolith keeps the codebase reviewable and fast to build for an assessment while remaining a legitimate, production-viable pattern.

## 3. Frontend Architecture

- **Framework:** React (Vite build tool), JavaScript, HTML/CSS.
- **Responsibilities:**
  - Render Employee and Admin UIs.
  - Manage auth state (JWT storage, current user/role).
  - Call backend REST APIs via a thin API service layer.
  - Client-side route protection (redirect unauthenticated/wrong-role users), enforced additionally on the backend.
- **State management:** React Context (`AuthContext`) for auth/session state; local component state (`useState`) for form and page data. No external state library required (Redux/Zustand not justified at this scale).
- **Routing:** `react-router-dom`, with `ProtectedRoute` wrapper components for Employee-only and Admin-only routes.

## 4. Backend Architecture

- **Framework:** Node.js + Express.
- **Layers:**
  - **Routes** — define endpoints and attach middleware.
  - **Middleware** — `authMiddleware` (JWT verification), `roleMiddleware` (role check), `errorHandler` (centralized error responses), `validate` (request body validation).
  - **Controllers** — handle request/response, call services, shape the response envelope.
  - **Services** — business logic (leave day calculation, balance validation/update, statistics aggregation). Keeping this layer separate from controllers keeps the balance-update logic unit-testable and in one place.
  - **Models** — Mongoose schemas for `User` and `LeaveRequest`.
- **Responsibilities:** Enforce all business rules server-side (never trust the client), regardless of what the frontend already validates.

## 5. Database Architecture

- **Engine:** MongoDB (Atlas in production, local MongoDB or Atlas free tier in development).
- **Collections:** `users`, `leaveRequests` (see Backend Schema.md for full field-level design).
- **Relationship:** `leaveRequests.employeeId` references `users._id` (application-level reference; MongoDB does not enforce foreign keys, so referential integrity is maintained in the service layer).
- **Consistency approach:** The approval operation (status change + balance deduction) is performed as a single database transaction where the deployment target supports MongoDB replica sets (Atlas does by default), using a Mongoose session. If transactions are unavailable in a given environment, the update is performed in a single, minimal-window sequential operation with the status check re-verified immediately before the balance write (see TRD.md §"Leave Balance Calculation" for the exact defensive pattern).

## 6. Authentication Architecture

```
React (Login Form)
   ↓ POST /api/auth/login { email, password }
Express (auth route → auth controller)
   ↓
bcrypt.compare(password, user.passwordHash)
   ↓ (match)
jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1d' })
   ↓
Response: { token, user }
   ↓
React stores token, attaches to future requests:
   Authorization: Bearer <token>
```

- JWT is stateless; no server-side session store.
- Token payload contains only `{ id, role }` (plus standard `iat`/`exp`) — no sensitive data.

## 7. Authorization Architecture

- `authMiddleware`: verifies JWT signature and expiry; on success attaches `req.user = { id, role }`; on failure returns `401`.
- `roleMiddleware(['admin'])`: runs after `authMiddleware`; returns `403` if `req.user.role` is not in the allowed list.
- **Ownership checks:** for employee-scoped resources (e.g., `GET /api/leaves/:id`), the controller additionally verifies `leaveRequest.employeeId.toString() === req.user.id` for non-admin callers.

## 8. API Communication

- All communication is JSON over HTTPS.
- Base URL is configured via `VITE_API_URL` on the frontend.
- CORS on the backend is restricted to the deployed frontend origin (`CLIENT_URL` env var) in production, and `http://localhost:5173` (Vite default) in development.

## 9. Request/Response Flow

```
Browser (React)
   → axios/fetch call to `${VITE_API_URL}/api/...`
   → Express router matches path + method
   → authMiddleware (if protected)
   → roleMiddleware (if role-restricted)
   → controller
       → calls service (business logic)
       → service calls model (Mongoose/MongoDB)
   → controller formats response envelope
   → JSON response returned to browser
```

## 10. Error Handling Architecture

- All thrown errors (validation, not-found, conflict, auth) are passed to a centralized Express `errorHandler` middleware via `next(err)`, or thrown as a custom `AppError` class carrying a `statusCode` and `message`.
- The `errorHandler` is the single place that shapes the error response envelope (see TRD.md), ensuring consistency and preventing accidental leakage of stack traces or internal details in production.

## 11. Security Architecture

- Passwords hashed with bcrypt (cost factor ≥ 10) before storage; never returned in any API response (`select: false` on the Mongoose schema field, or explicit projection).
- JWT secret and Mongo URI stored only in environment variables, never committed to source control.
- Helmet-style basic HTTP header hardening (optional, lightweight — no heavy framework needed).
- CORS restricted to known origins in production.
- Server-side validation on every write endpoint, independent of frontend validation.
- Role and ownership checks enforced server-side on every relevant route (never relying on the frontend to hide a button).
- No sensitive data (passwords, JWT secret, raw Mongo URI) ever appears in logs.

## 12. Deployment Architecture

```
GitHub Repository (source of truth)
   ├── frontend/  →  Vercel (build: `npm run build`, output: `dist/`)
   ├── backend/   →  Node-compatible host (e.g., Render/Railway — see README.md)
   └── (database) →  MongoDB Atlas cluster (independent of both, connected via MONGO_URI)
```

- Frontend and backend are deployed independently and communicate purely over HTTPS via the public backend URL, configured into the frontend via `VITE_API_URL` at build time.
- Backend connects to MongoDB Atlas via `MONGO_URI`, independent of where the backend itself is hosted.
- See README.md for the concrete step-by-step deployment procedure.

## 13. Folder Structure

```
frontend/
  src/
    components/     # Reusable UI pieces (Navbar, LeaveCard, StatusBadge, ProtectedRoute, etc.)
    pages/           # Route-level pages (Login, EmployeeDashboard, ApplyLeave, LeaveHistory,
                      #   AdminDashboard, EmployeeList, LeaveRequests, LeaveRequestDetail)
    services/        # API call wrappers (authService.js, leaveService.js, adminService.js)
    context/         # AuthContext (current user, token, login/logout helpers)
    hooks/           # Custom hooks (useAuth, useFetch — only if genuinely reused)
    utils/           # Helpers (date formatting, day calculation for client-side preview)
  index.html
  vite.config.js
  package.json

backend/
  controllers/       # authController.js, employeeController.js, adminController.js, leaveController.js
  routes/             # authRoutes.js, employeeRoutes.js, adminRoutes.js, leaveRoutes.js
  models/             # User.js, LeaveRequest.js
  middleware/         # authMiddleware.js, roleMiddleware.js, errorHandler.js, validate.js
  services/           # leaveService.js (day calculation, balance validation/update),
                      #   statsService.js (dashboard aggregates)
  utils/               # AppError.js, asyncHandler.js
  config/              # db.js (Mongo connection)
  server.js
  package.json
```

Only folders with an actual, near-term purpose are included — no empty placeholder layers.

## 14. Component Responsibilities

| Component | Responsibility |
|---|---|
| `authMiddleware` | Verify JWT, attach `req.user` |
| `roleMiddleware` | Enforce role-based access |
| `leaveController` | Handle apply/view/history endpoints for employees |
| `adminController` | Handle admin dashboard, employee list, approve/reject endpoints |
| `leaveService` | Calculate `totalDays`, validate balance, perform balance-affecting updates |
| `statsService` | Compute dashboard aggregate counts |
| `User` model | Schema + persistence for accounts and leave balance |
| `LeaveRequest` model | Schema + persistence for individual leave requests |
| `AuthContext` (frontend) | Hold current user/token, expose login/logout, gate protected routes |
| `ProtectedRoute` (frontend) | Redirect unauthenticated or wrong-role users away from a route |

## 15. Data Flow

**Apply Leave (write path):**
```
React form → POST /api/leaves → authMiddleware → leaveController.applyLeave
   → leaveService.calculateDays() → leaveService.validateBalance()
   → LeaveRequest.create() → response → React updates "My Requests" list
```

**Approve Leave (write path affecting two collections logically):**
```
React (Admin) → PATCH /api/admin/leaves/:id/approve
   → authMiddleware → roleMiddleware(['admin']) → adminController.approveLeave
   → leaveService.approve(requestId, adminId):
        - load LeaveRequest, assert status === 'Pending' (else 409)
        - load User, assert sufficient balance still holds (defensive re-check)
        - update User.leaveBalance[type].used += totalDays
        - update LeaveRequest.status = 'Approved', reviewedBy, reviewedAt
   → response → React refreshes request list + (on employee side) balance
```
