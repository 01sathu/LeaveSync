# TASKS.md

# Implementation Task List — Leave Management System

This task list is sequential and phase-based, intended to be followed by a developer or an AI coding agent (Antigravity) without needing to consult the reviewer for missing decisions. Every task references the requirement(s) it satisfies (from PRD.md) where applicable.

Task ID format: `T-<phase>.<n>`

## Phase 1 — Project Setup

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-1.1 | Create GitHub repository (`leave-management-system`) | — | — | Empty repo with `main` branch | Repo exists, accessible |
| T-1.2 | Initialize backend (`backend/`) with `npm init` + Express, Mongoose, jsonwebtoken, bcryptjs, cors, dotenv, morgan | NFR-010 | T-1.1 | `backend/package.json` with dependencies | `npm install` succeeds |
| T-1.3 | Initialize frontend (`frontend/`) with Vite React template | — | T-1.1 | `frontend/package.json`, working Vite dev server | `npm run dev` renders default page |
| T-1.4 | Create `.env.example` files for both backend and frontend listing variable names only (see TRD.md §21) | — | T-1.2, T-1.3 | `.env.example` committed, `.env` gitignored | Files present, no secrets in git |
| T-1.5 | Configure `.gitignore` (`node_modules`, `.env`, `dist`) | — | T-1.1 | `.gitignore` at repo root | Verified via `git status` |
| T-1.6 | Set up folder structure per ARCHITECTURE.md §13 | — | T-1.2, T-1.3 | Folders created (empty placeholders where needed) | Matches documented structure |

## Phase 2 — Database

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-2.1 | Create MongoDB Atlas project + free-tier cluster | NFR-006 | — | Cluster reachable, connection string obtained | Can connect via `mongosh` or Compass |
| T-2.2 | Implement `config/db.js` — Mongoose connection using `MONGO_URI`, exit process on failure | NFR-006 | T-1.2, T-2.1 | Backend connects on startup | Console confirms connection; failure path tested by using a bad URI |
| T-2.3 | Implement `models/User.js` per Backend Schema.md §1 | FR-001–FR-003 | T-2.2 | Mongoose schema + model exported | Schema matches documented fields/validation |
| T-2.4 | Implement `models/LeaveRequest.js` per Backend Schema.md §2 | FR-004–FR-020 | T-2.2 | Mongoose schema + model exported | Schema matches documented fields/validation, incl. `endDate >= startDate` validator |
| T-2.5 | Add indexes: `users.email` (unique), `leaveRequests.employeeId`, `leaveRequests.status` | Backend Schema.md §1.3, §2.2 | T-2.3, T-2.4 | Indexes created | Verified via `db.collection.getIndexes()` |
| T-2.6 | Write a one-off seed script (`scripts/seed.js`) to create at least one Admin and 2–3 Employee accounts with sample leave balances (PRD.md A-02) | A-04 | T-2.3 | Seed script runnable via `node scripts/seed.js` | Accounts appear in Atlas with hashed passwords |

## Phase 3 — Authentication

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-3.1 | Implement `POST /api/auth/login` controller + route | FR-001, FR-002 | T-2.3 | Endpoint returns JWT + user on valid credentials | Tested in Postman: 200 with token; 401 on bad password |
| T-3.2 | Implement password hashing on account creation (seed script and/or future registration) | NFR-001 | T-2.3 | Passwords stored as bcrypt hashes only | Verified: no plain-text password in DB |
| T-3.3 | Implement JWT generation utility (`utils/generateToken.js`) | FR-002 | T-3.1 | Reusable signing function | Token decodes to `{ id, role, iat, exp }` |
| T-3.4 | Implement `middleware/authMiddleware.js` | NFR-002 | T-3.3 | Protects routes, attaches `req.user` | Tested: missing/invalid token → 401; valid token → passes through |
| T-3.5 | Implement `middleware/roleMiddleware.js` | NFR-003 | T-3.4 | Restricts admin-only routes | Tested: employee token on admin route → 403 |
| T-3.6 | Implement centralized `errorHandler` + `AppError` + `asyncHandler` | NFR-005 | T-1.2 | Consistent error envelope across all routes | Tested: triggering each error type returns correct shape/status |

**Critical path note:** T-3.4/T-3.5/T-3.6 must exist before any Phase 4/5 route is wired up with real middleware (they can be stubbed temporarily, but should not ship stubbed).

## Phase 4 — Employee APIs

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-4.1 | Implement `GET /api/employee/profile` | FR-023 | T-3.4 | Returns caller's profile | 200 with correct fields, no password |
| T-4.2 | Implement `GET /api/employee/leave-balance` | FR-003 | T-3.4 | Returns balance with derived `remaining` | 200; values match DB; `remaining = total - used` |
| T-4.3 | Implement `leaveService.calculateDays()` | FR-005 | T-2.4 | Pure function, inclusive calendar-day count | Unit-verified against known date pairs |
| T-4.4 | Implement `leaveService.validateBalance()` | FR-006 | T-4.2, T-4.3 | Throws `AppError(400, INSUFFICIENT_BALANCE)` when over budget | Tested with over-limit and exact-limit requests |
| T-4.5 | Implement `POST /api/leaves` (apply leave) | FR-004, FR-006–FR-009, FR-025 | T-4.3, T-4.4, T-3.4 | Creates `Pending` request; balance untouched | 201 on valid; 400 on each validation failure (see PRD.md Edge Cases 4–7) |
| T-4.6 | Implement `GET /api/leaves/my` (+ `status` filter) | FR-010 | T-3.4 | Returns caller's own requests only | Tested: employee A never sees employee B's requests |
| T-4.7 | Implement `GET /api/leaves/:id` with ownership check | FR-011, FR-012 | T-3.4 | 404 for non-owned/nonexistent id; 200 for own | Tested against both cases + invalid ObjectId → 400 |

## Phase 5 — Admin APIs

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-5.1 | Implement `statsService.getDashboardStats()` | FR-022 | T-2.4 | Aggregate counts by status + employee total | Counts match manual DB query |
| T-5.2 | Implement `GET /api/admin/dashboard` | FR-022 | T-3.5, T-5.1 | Returns stats object | 200 for admin; 403 for employee token |
| T-5.3 | Implement `GET /api/admin/employees` | FR-021 | T-3.5 | Returns all employees + balances, no passwords | 200; password field absent |
| T-5.4 | Implement `GET /api/admin/leaves` (+ `status` filter, populated employee info) | FR-013 | T-3.5 | Returns all/filtered requests with employee name/email | 200; populate verified |
| T-5.5 | Implement `GET /api/admin/leaves/:id` | FR-014 | T-3.5 | Full request detail | 200; 404 on bad id |
| T-5.6 | Implement `leaveService.approve(requestId, adminId)` — status guard, defensive balance re-check, balance increment, status update (transaction where available) | FR-015, FR-016, FR-019, FR-020 | T-4.4, T-2.4 | Approve is atomic and idempotent-safe | Tested: double-approve → second call gets 409, balance unchanged by the second call |
| T-5.7 | Implement `PATCH /api/admin/leaves/:id/approve` | FR-015, FR-016 | T-5.6, T-3.5 | Endpoint wired to service | 200 with updated request + balance change verified via T-4.2 |
| T-5.8 | Implement `leaveService.reject(requestId, adminId, reason)` — status guard, status/reviewer update only | FR-017, FR-018, FR-019, FR-020 | T-2.4 | No balance change on reject | Tested: balance identical before/after |
| T-5.9 | Implement `PATCH /api/admin/leaves/:id/reject` | FR-017 | T-5.8, T-3.5 | Endpoint wired to service | 200; 409 on already-processed request |

**Critical path note:** T-5.6 and T-5.8 are the highest-risk tasks in the project (balance consistency). They must be implemented and manually tested (including the double-approve edge case) before Phase 8 sign-off.

## Phase 6 — Frontend

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-6.1 | Build `AuthContext` + `authService.js` (login, logout, token persistence) | FR-001, FR-024 | T-3.1 | Login state available app-wide | Login persists across refresh (until logout) |
| T-6.2 | Build `Login` page | FR-001 | T-6.1 | Form posts to `/api/auth/login`, redirects by role | Manual test: wrong creds show error; correct creds redirect |
| T-6.3 | Build `ProtectedRoute` (role-aware) | NFR-003 | T-6.1 | Blocks unauthenticated/wrong-role access client-side | Manual test: employee cannot reach `/admin/*` |
| T-6.4 | Build `Employee Dashboard` page (balance + counts) | FR-003, FR-023 | T-4.2, T-4.6 | Shows correct balance and counts | Cross-checked against DB values |
| T-6.5 | Build `Apply Leave` form | FR-004, FR-025 | T-4.5 | Submits and shows success/error | Manual test of each validation error from PRD.md Edge Cases |
| T-6.6 | Build `Leave History` page (status badges) | FR-010, FR-011 | T-4.6, T-4.7 | Lists all requests with status | Verified against seeded data |
| T-6.7 | Build `Admin Dashboard` page (stats cards) | FR-022 | T-5.2 | Shows correct aggregate numbers | Cross-checked against DB |
| T-6.8 | Build `Employee List` (admin) page | FR-021 | T-5.3 | Lists employees + balances | Verified against seeded data |
| T-6.9 | Build `Leave Requests` list + detail (admin), with Approve/Reject actions | FR-013–FR-020 | T-5.4, T-5.5, T-5.7, T-5.9 | Admin can filter, view, approve, reject | Manual test of full approve/reject cycle from UI |

## Phase 7 — Integration

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-7.1 | Configure `VITE_API_URL` and API service base URL | NFR-006 | T-6.1 | Frontend calls correct backend in dev and prod | Verified in both environments |
| T-7.2 | Wire JWT attachment on all authenticated requests (axios interceptor or fetch wrapper) | FR-002 | T-6.1 | Every protected call includes `Authorization` header | Verified via network inspection |
| T-7.3 | Implement global error handling on the frontend (toast/inline messages mapped from the API error envelope) | NFR-004, NFR-005 | T-6.1 | User-facing errors for every backend error case | Manual test of each error scenario in PRD.md Edge Cases |
| T-7.4 | Implement loading states for all data-fetching pages | NFR-007 | T-6.4–T-6.9 | No blank/broken UI during fetch | Manual visual check |
| T-7.5 | Configure backend CORS to allow the frontend origin | Security Requirements | T-1.2 | Cross-origin requests succeed in dev and prod | Verified: browser console has no CORS errors |

## Phase 8 — Testing

Each item below should be manually verified via Postman and/or the UI, directly mapping to PRD.md §29 Edge Cases:

| ID | Description | Related Req/Edge Case |
|---|---|---|
| T-8.1 | Invalid login (wrong password, nonexistent email) → 401 | Edge Case 1 |
| T-8.2 | Duplicate email at account creation → rejected (unique index) | Edge Case 2 |
| T-8.3 | Missing required fields on leave application → 400 | Edge Case 3 |
| T-8.4 | Invalid/unparseable dates → 400 | Edge Case 4 |
| T-8.5 | `endDate` before `startDate` → 400 | Edge Case 5 |
| T-8.6 | Leave balance insufficient → 400 `INSUFFICIENT_BALANCE` | Edge Case 6 |
| T-8.7 | Invalid `leaveType` value → 400 | Edge Case 7 |
| T-8.8 | Overlapping leave requests → allowed but documented as a known v1 limitation (A-07) | Edge Case 8 |
| T-8.9 | Approve an already-approved request → 409 | Edge Case 9 |
| T-8.10 | Reject an already-rejected request → 409 | Edge Case 10 |
| T-8.11 | Employee token calling an admin-only route → 403 | Edge Case 11 |
| T-8.12 | Admin accessing an employee-only "my requests" view for themselves — N/A (admin has no leave data by design); verify admin cannot be tricked into seeing it as an "employee view" | Edge Case 12 |
| T-8.13 | Malformed/invalid JWT → 401 | Edge Case 13 |
| T-8.14 | Expired JWT → 401 | Edge Case 14 |
| T-8.15 | Simulated DB failure (stop connection) → 500, no crash, clear message | Edge Case 15 |
| T-8.16 | Simulated server error (throw in a controller) → 500 via `errorHandler`, no stack trace leaked | Edge Case 16 |
| T-8.17 | Invalid ObjectId in any `:id` route → 400, not a server crash | Edge Case 17 |
| T-8.18 | Employee A attempts to view/approve Employee B's request (or any request as non-admin) → 403/404 | Edge Case 18 |
| T-8.19 | Confirm balance can never go negative under normal and defensive-recheck paths | Edge Case 19 |
| T-8.20 | Double-click / duplicate approve request (race condition) → second call gets 409, no double deduction | FR-016, FR-019 |

## Phase 9 — Deployment

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-9.1 | Push final code to GitHub `main` branch | NFR-006 | All prior phases | Repo up to date | `git log` shows latest commit on GitHub |
| T-9.2 | Confirm MongoDB Atlas cluster is production-ready (IP allow-list or 0.0.0.0/0 for assessment simplicity, dedicated DB user) | NFR-006 | T-2.1 | Reachable from backend host | Connection succeeds from deployed backend |
| T-9.3 | Deploy backend to chosen Node host; set `MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL` env vars | NFR-006 | T-9.1, T-9.2 | Backend reachable at public URL | `GET` to a public health-check or `/api/auth/login` responds |
| T-9.4 | Deploy frontend to Vercel; set `VITE_API_URL` to the deployed backend URL | NFR-006 | T-9.3 | Frontend reachable at public URL, talking to live backend | Manual full-flow test against production URLs |
| T-9.5 | Run the full Phase 8 test matrix against the deployed (production) URLs | AC-09 | T-9.3, T-9.4 | All edge cases behave identically to local | Sign-off checklist complete |
| T-9.6 | Record final live URLs (frontend, backend) and GitHub repo link for the README | AC-10 | T-9.4 | URLs available to insert into README.md | URLs verified reachable |

## Phase 10 — Documentation

| ID | Description | Related Req | Dependencies | Expected Result | Completion Criteria |
|---|---|---|---|---|---|
| T-10.1 | Finalize `README.md` with real (deployed) URLs replacing placeholders | AC-10 | T-9.6 | README complete and accurate | Fresh clone + README instructions succeed end-to-end |
| T-10.2 | Confirm API documentation (TRD.md §8) matches the final implemented endpoints exactly | NFR-004 | All Phase 4/5 tasks | No drift between docs and code | Manual diff check |
| T-10.3 | Confirm ARCHITECTURE.md folder structure matches the actual repository | — | All phases | No drift | Manual diff check |
| T-10.4 | Add a short "Deployment" section confirmation (URLs, env vars used) to README.md | AC-09 | T-10.1 | Deployment section complete | Present in README |

## Critical Path Summary

```
T-1.2/T-1.3 (setup)
   → T-2.2 (DB connect)
   → T-2.3/T-2.4 (models)
   → T-3.4/T-3.5/T-3.6 (auth+authz+error middleware)
   → T-4.3/T-4.4 (day calc + balance validation — core business logic)
   → T-4.5 (apply leave)
   → T-5.6/T-5.8 (approve/reject services — highest-risk logic)
   → T-5.7/T-5.9 (approve/reject endpoints)
   → T-6.* (frontend, can start in parallel once T-3.1/T-3.4 exist)
   → T-7.* (integration)
   → T-8.* (testing, especially T-8.9/T-8.10/T-8.20)
   → T-9.* (deployment)
   → T-10.* (final documentation)
```

## Definition of Done

The project is considered complete when **all** of the following hold:

- Every functional requirement (FR-001–FR-025) and non-functional requirement (NFR-001–NFR-010) in PRD.md is implemented and verifiable.
- Every API endpoint in TRD.md §8 exists, matches its documented contract, and returns the documented response envelope.
- Every edge case in PRD.md §"Edge Cases" has been manually tested against the deployed application with the expected behavior confirmed (Phase 8 + T-9.5).
- The balance-consistency guarantees (never double-deduct, never deduct on Pending/Rejected, never go negative) are verified, including the double-approve race scenario (T-8.20).
- The application is deployed and reachable: frontend on Vercel, backend on a Node-compatible host, database on MongoDB Atlas.
- The GitHub repository contains the full source code, `.env.example` files (no real secrets), and all seven documentation files.
- README.md is complete, accurate, and sufficient for a new developer to clone, configure, run locally, and understand how to redeploy — with real (not placeholder) live URLs.
- No excluded technology (Docker, Kubernetes, microservices, GraphQL, Redis, payments, payroll, notifications) has been introduced without documented justification.
