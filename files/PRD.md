# PRD.md

# Product Requirements Document — Leave Management System

## 1. Document Information

| Field | Value |
|---|---|
| Document | Product Requirements Document (PRD) |
| Product | Leave Management System (LMS) |
| Version | 1.0 |
| Status | Final — for implementation |
| Related Documents | APPFLOW.md, ARCHITECTURE.md, Backend Schema.md, TRD.md, TASKS.md, README.md |
| Audience | Developer / AI coding agent (Antigravity), reviewers |

## 2. Product Name

**Leave Management System (LMS)**

## 3. Product Overview

The Leave Management System is a full-stack web application that allows employees of an organization to apply for leave and track their leave balance, while allowing an admin to review, approve, or reject those requests and monitor leave activity across the organization. The system is intentionally scoped as a focused, single-purpose application suitable for a coding assessment — it is not a full HR platform.

## 4. Problem Statement

Manually tracking employee leave requests (via email, spreadsheets, or verbal requests) is error-prone, hard to audit, and gives employees no visibility into their real-time leave balance or request status. The organization needs a simple, reliable digital system where employees can request leave and see its status, and where a single admin can review and act on requests with an accurate, consistently-updated leave balance.

## 5. Business Objective

Provide a lightweight, reliable, and auditable leave request-and-approval workflow that:
- Removes ambiguity about how much leave an employee has left.
- Creates a single source of truth for leave requests and their status.
- Gives the admin a fast way to review and act on pending requests.

## 6. Product Goals

- G-01: Allow employees to self-serve leave applications without manual intervention.
- G-02: Give employees real-time, accurate visibility into their leave balance.
- G-03: Give the admin a centralized dashboard to review and act on all leave requests.
- G-04: Guarantee that leave balance is only ever adjusted through the approval workflow, never inconsistently.
- G-05: Keep the system simple enough to be fully implemented, tested, and deployed by a single developer in an assessment timeframe.

## 7. Scope

- Employee authentication (login only; no self-registration UI — see Assumptions).
- Employee leave application, leave balance viewing, and leave history viewing.
- Admin authentication, dashboard, employee list, and leave request review (approve/reject).
- Leave balance tracking per employee per leave type.
- Role-based access control (Employee, Admin).
- REST API backend with MongoDB persistence.
- Deployment to remote hosting (frontend, backend, database) with documentation.

## 8. Out of Scope

- Payroll or salary integration.
- Email/SMS notifications (documented only as a Future Enhancement).
- Multi-level approval workflows (e.g., manager → HR → director).
- Employee self-registration UI (accounts are seeded/created directly in the database for this assessment — see Assumptions).
- Multiple organizations / multi-tenancy.
- Mobile app.
- Public holiday calendars or working-day-aware leave calculation (v1 uses calendar days — see Assumptions).
- Leave type configuration UI (leave types are fixed in v1 code but stored so they can be made configurable later).
- Docker, Kubernetes, microservices, GraphQL, Redis, payment functionality — explicitly excluded per assessment constraints.

## 9. Target Users

- Employees of the organization who need to request and track leave.
- One or more Admin users who manage leave approvals across the organization.

## 10. User Roles

| Role | Description |
|---|---|
| Employee | Standard user who applies for leave and views their own balance/history. |
| Admin | Privileged user who reviews all leave requests, approves/rejects them, and views organization-wide statistics. |

Every user has exactly one role, stored on the user record. There is no multi-role or role-escalation mechanism in v1.

## 11. User Stories

### Employee

- US-E-01: As an Employee, I want to log in securely so that I can access my personal dashboard.
- US-E-02: As an Employee, I want to see my current leave balance by leave type so that I know how much leave I can request.
- US-E-03: As an Employee, I want to apply for leave by selecting a leave type, start date, end date, and reason so that my request can be reviewed.
- US-E-04: As an Employee, I want the system to stop me from submitting a request that exceeds my available balance so that I don't submit invalid requests.
- US-E-05: As an Employee, I want to see the status of my submitted requests (Pending/Approved/Rejected) so that I know where things stand.
- US-E-06: As an Employee, I want to view my full leave history so that I can track past requests.
- US-E-07: As an Employee, I want my leave balance to update automatically once a request is approved so that I always see an accurate number.

### Admin

- US-A-01: As an Admin, I want to log in securely so that I can access the admin dashboard.
- US-A-02: As an Admin, I want to see all pending leave requests so that I can act on them quickly.
- US-A-03: As an Admin, I want to approve a leave request so that the employee's balance is updated and they are notified via status change.
- US-A-04: As an Admin, I want to reject a leave request (optionally with a reason) so that the employee knows why it wasn't approved.
- US-A-05: As an Admin, I want to view all employees and their current leave balances so that I have organization-wide visibility.
- US-A-06: As an Admin, I want to see basic leave statistics (counts by status) so that I can gauge overall leave activity.
- US-A-07: As an Admin, I want to be prevented from approving/rejecting a request that has already been processed so that data stays consistent.

## 12. Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | The system shall allow a registered user (Employee or Admin) to log in with email and password. |
| FR-002 | The system shall issue a JWT on successful login and require it for all protected endpoints. |
| FR-003 | The system shall allow an Employee to view their current leave balance broken down by leave type (Casual, Sick, Earned). |
| FR-004 | The system shall allow an Employee to submit a leave request specifying leave type, start date, end date, and reason. |
| FR-005 | The system shall calculate the number of leave days requested from the start and end dates (inclusive, calendar days). |
| FR-006 | The system shall reject a leave request if the requested days exceed the Employee's available balance for that leave type. |
| FR-007 | The system shall reject a leave request if the end date is before the start date. |
| FR-008 | The system shall set a new leave request's status to `Pending` on creation. |
| FR-009 | The system shall NOT deduct leave balance while a request is `Pending`. |
| FR-010 | The system shall allow an Employee to view a list of their own leave requests (history), including status. |
| FR-011 | The system shall allow an Employee to view the details of a single one of their own leave requests. |
| FR-012 | The system shall prevent an Employee from viewing or modifying another employee's leave requests. |
| FR-013 | The system shall allow an Admin to view all leave requests across all employees, optionally filtered by status. |
| FR-014 | The system shall allow an Admin to view a single leave request in full detail, including the requesting employee's information. |
| FR-015 | The system shall allow an Admin to approve a `Pending` leave request. |
| FR-016 | On approval, the system shall deduct the approved number of days from the employee's balance for the relevant leave type. |
| FR-017 | The system shall allow an Admin to reject a `Pending` leave request, optionally with a rejection reason. |
| FR-018 | On rejection, the system shall NOT change the employee's leave balance. |
| FR-019 | The system shall prevent approving or rejecting a leave request that is not currently `Pending` (i.e., already `Approved` or `Rejected`). |
| FR-020 | The system shall record which Admin reviewed a request and when (reviewedBy, reviewedAt). |
| FR-021 | The system shall allow an Admin to view a list of all employees with their current leave balances. |
| FR-022 | The system shall allow an Admin to view basic leave statistics: total employees, pending count, approved count, rejected count. |
| FR-023 | The system shall allow an Employee to view a personal dashboard summarizing balance, pending count, approved count, and rejected count. |
| FR-024 | The system shall allow any authenticated user to log out (client-side token invalidation). |
| FR-025 | The system shall validate all required fields on leave application (leaveType, startDate, endDate, reason) and return a clear validation error if any are missing or invalid. |

## 13. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-001 | Passwords shall never be stored in plain text; bcrypt hashing shall be used. |
| NFR-002 | All protected API routes shall require a valid JWT; requests without one shall receive `401 Unauthorized`. |
| NFR-003 | Role-restricted routes (Admin-only) shall return `403 Forbidden` to authenticated users lacking the Admin role. |
| NFR-004 | All API responses shall follow a consistent JSON envelope (see TRD.md §"Response Structure"). |
| NFR-005 | The system shall return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 409, 500) for all outcomes. |
| NFR-006 | The application shall be deployable to remote hosting (frontend on Vercel, backend on a Node-compatible host, database on MongoDB Atlas) without code changes beyond environment variables. |
| NFR-007 | The frontend shall be responsive and usable on both desktop and typical laptop screen sizes. |
| NFR-008 | Database writes that affect leave balance (approval) shall be atomic so a partial update cannot leave balance and status inconsistent. |
| NFR-009 | The system shall not expose password hashes or other sensitive fields in any API response. |
| NFR-010 | The codebase shall follow a simple, layered structure (routes → controllers → services/models) so it remains easy to review in an assessment context. |

## 14. Employee Requirements

Covered by FR-001 through FR-012, FR-023, FR-024, FR-025. An Employee account has: name, email, password (hashed), role = `employee`, and a leave balance record per leave type.

## 15. Admin Requirements

Covered by FR-013 through FR-022, FR-024. Exactly one or more Admin accounts exist; Admin accounts are seeded the same way as Employee accounts (see Assumptions) with role = `admin`. An Admin does not have a personal leave balance workflow in v1 (out of scope — Admin is a management role, not a requester, unless the assessment reviewer wants an Admin to also act as an Employee; see Assumptions).

## 16. Leave Management Requirements

- Leave requests always belong to exactly one employee (FR-004).
- Leave requests move through exactly one linear status transition: `Pending → Approved` or `Pending → Rejected`. There is no reversal (e.g., un-approving) in v1 (documented under Future Enhancements).
- Leave type is one of a fixed enum in v1: `Casual`, `Sick`, `Earned` (see Assumptions for future configurability).

## 17. Leave Balance Requirements

- Each employee has a balance per leave type, expressed as `total` and `used` (remaining = total − used).
- Balance is validated at application time (FR-006) but only actually adjusted at approval time (FR-016), never at application or rejection time (FR-009, FR-018).
- Balance can never go negative — validated by FR-006 and enforced again defensively at approval time (see Edge Cases in APPFLOW.md and TRD.md).

## 18. Authentication Requirements

- Single login endpoint for both roles; the returned JWT encodes the user's id and role.
- JWT is required on every protected route.
- No self-service registration in v1 (Assumption).
- No password reset flow in v1 (Future Enhancement).

## 19. Authorization Requirements

- Role-based access control with two roles: `employee`, `admin`.
- Employee-only and Admin-only routes are enforced server-side via middleware, not merely hidden in the UI.
- An Employee can only ever access their own leave data; ownership is verified against the JWT's user id on every relevant request.

## 20. Validation Requirements

- All request bodies validated server-side (never trust client-side validation alone).
- Date fields validated as real, parseable dates.
- `endDate >= startDate` enforced.
- `leaveType` validated against the fixed enum.
- `reason` required, non-empty, reasonable max length (e.g., 500 characters).
- MongoDB ObjectIds validated before use in queries (invalid format returns `400`, not a server crash).

## 21. Error Handling Requirements

- All errors return the standard error envelope (see TRD.md).
- Validation errors return `400`.
- Auth errors return `401`.
- Authorization/role errors return `403`.
- Not-found resources return `404`.
- Conflicting state (e.g., approving an already-approved request) returns `409`.
- Unexpected server errors return `500` with a generic message (no stack traces leaked to the client).

## 22. Dashboard Requirements

- Employee dashboard: leave balance by type, total used, pending count, approved count, rejected count.
- Admin dashboard: total employees, pending count, approved count, rejected count (organization-wide).

## 23. Reporting/Statistics Requirements

- Admin can view aggregate counts of requests by status.
- No advanced reporting (charts, exports, date-range filters) in v1 — Future Enhancement.

## 24. Security Requirements

See ARCHITECTURE.md §11 and TRD.md §11 for full detail. Summary:
- bcrypt password hashing (NFR-001).
- JWT-based stateless authentication (NFR-002).
- Role-based authorization middleware (NFR-003).
- Environment variables for all secrets; no secrets committed to the repository.
- CORS restricted to the known frontend origin in production.
- Ownership checks on all employee-scoped resources (FR-012).

## 25. Assumptions

The following are **project assumptions**, not company-provided requirements, and are marked as configurable:

- A-01: Leave types are fixed to Casual, Sick, Earned for v1; the schema is designed so additional types can be added without a structural migration.
- A-02: Initial leave balance per employee (sample/default, configurable): Casual = 12 days, Sick = 10 days, Earned = 15 days per year.
- A-03: Leave duration is calculated in **calendar days inclusive of both start and end date** (weekends are included, not excluded). This is the simplest correct interpretation for v1 and is explicitly flagged as an assumption.
- A-04: There is no employee self-registration UI; Employee and Admin accounts are created directly in the database (e.g., via a seed script or MongoDB Atlas UI) for the purposes of this assessment.
- A-05: There is exactly one organization/tenant; no company/department scoping exists.
- A-06: Pending requests are validated against current balance at submission time but are **not reserved** against the balance (i.e., two pending requests for the same employee are each validated independently against the same `total − used` figure). This is a known, documented simplification — see Edge Cases and Future Enhancements.
- A-07: Overlapping leave date ranges for the same employee are **not blocked** in v1 (documented as a Future Enhancement to add), since the assessment does not explicitly require it.
- A-08: Admin accounts do not themselves apply for leave in v1 (an Admin is a pure management role). If a real Admin also needs to take leave, they would need a separate Employee account — flagged as a limitation.
- A-09: API and folder naming conventions used throughout the documentation (e.g., `/api/leaves`, `leaveRequests` collection) are project decisions, not company mandates.

## 26. Constraints

- Must use the mandated stack: React + Vite, Node.js + Express, MongoDB, JWT + bcrypt.
- Must avoid Docker, Kubernetes, microservices, GraphQL, Redis, payments, payroll, and notifications (except as Future Enhancements) unless a genuine technical need arises (none has been identified).
- Must be deployable with Vercel (frontend), a Node-compatible host (backend), and MongoDB Atlas (database).
- Must be implementable by a single developer within an assessment timeframe.

## 27. Acceptance Criteria

The product is considered functionally complete when:

- AC-01: An Employee can log in, view their balance, submit a valid leave request, and see it appear as `Pending` in their history.
- AC-02: An Employee cannot submit a request that exceeds their available balance for the requested leave type.
- AC-03: An Admin can log in, see all pending requests, and approve or reject any one of them.
- AC-04: Approving a request deducts the correct number of days from the correct leave type balance, and this is reflected immediately when the Employee reloads their dashboard.
- AC-05: Rejecting a request leaves the Employee's balance unchanged.
- AC-06: Attempting to approve/reject an already-processed request fails with a clear error and no state change.
- AC-07: An Employee cannot view or act on another employee's leave requests.
- AC-08: A non-Admin cannot access any Admin-only endpoint.
- AC-09: The application is deployed and reachable at public URLs for both frontend and backend, backed by MongoDB Atlas.
- AC-10: The README allows a new developer to clone, configure, run, and redeploy the project without needing to ask questions.

## 28. Future Enhancements

- Email/SMS notifications on status change.
- Employee self-registration and password reset.
- Manager-level multi-step approval workflow.
- Working-day-aware leave calculation (excluding weekends/holidays), configurable per organization.
- Overlapping/duplicate leave request detection and blocking.
- Reservation of balance for Pending requests (to prevent over-commitment across multiple pending requests).
- Configurable leave types and per-role balance policies via an admin UI.
- Exportable reports (CSV/PDF) and date-range filtering on the admin dashboard.
- Audit log of all approval/rejection actions.
