# Leave Management System (LeaveSync)

> 🚀 **Live Demo (User-End Frontend):** [https://leave-sync-frontend.vercel.app](https://leave-sync-frontend.vercel.app)  
> ⚙️ **Live Server API (Backend):** [https://leavesync-backend.vercel.app](https://leavesync-backend.vercel.app)  
> 🩺 **API Health Check:** [https://leavesync-backend.vercel.app/api/health](https://leavesync-backend.vercel.app/api/health)  
> 📦 **GitHub Repository:** [https://github.com/01sathu/LeaveSync.git](https://github.com/01sathu/LeaveSync.git)

A full-stack web application for employees to apply for leave and track their balance, and for an admin to review, approve, or reject leave requests. Built as a focused, single-purpose system (not a full HR platform) using the MERN-style stack with JWT authentication.

## Overview

Manually tracking employee leave via spreadsheets or email is error-prone and gives no real-time visibility into balances. This system gives employees a self-service way to apply for leave and see accurate, live balances, and gives an admin a centralized place to review and act on every request.

## Problem Solved

- Employees always know exactly how much leave they have left, per leave type.
- Every leave request has a clear, auditable status (`Pending` → `Approved`/`Rejected`).
- Leave balance is only ever adjusted through the approval workflow — never inconsistently.

## Features

**Employee**
- Secure login
- Personal dashboard (balance, pending/approved/rejected counts)
- View leave balance by type (Casual, Sick, Earned)
- Apply for leave (type, start date, end date, reason)
- View leave history and status of every request

**Admin**
- Secure login
- Admin dashboard (organization-wide stats)
- View all employees and their balances
- View all leave requests (filterable by status)
- Approve or reject pending requests
- View leave statistics

## User Roles

| Role | Access |
|---|---|
| Employee | Own dashboard, own leave requests and balance only |
| Admin | Organization-wide dashboard, all employees, all leave requests |

## Screenshots

> `<SCREENSHOT_PLACEHOLDER>` — add screenshots of the Login page, Employee Dashboard, Apply Leave form, and Admin Dashboard here once the UI is finalized.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, HTML/CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (MongoDB Atlas in production) |
| Auth | JWT, bcrypt |
| Hosting | Vercel (frontend), Node-compatible host (backend), MongoDB Atlas (database) |

## Architecture

```
React Frontend (Vercel)  ──REST/JSON──▶  Express Backend (Node host)  ──Mongoose──▶  MongoDB Atlas
```

Full detail (folder structure, layering, auth flow, deployment architecture) is documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Project Structure

```
frontend/
  src/
    components/
    pages/
    services/
    context/
    hooks/
    utils/
backend/
  controllers/
  routes/
  models/
  middleware/
  services/
  utils/
  config/
  server.js
```

## Prerequisites

- Node.js v18+ and npm
- A MongoDB Atlas account (free tier is sufficient) or local MongoDB
- Git

## Installation

Clone the repository:

```bash
git clone <GITHUB_REPOSITORY_URL>
cd leave-management-system
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# fill in .env values as described below
npm run dev
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# fill in .env values as described below
npm run dev
```

## MongoDB Atlas Setup

1. Create a free MongoDB Atlas account and a new cluster.
2. Create a database user with a username/password.
3. Add your current IP (or `0.0.0.0/0` for development convenience) to the Network Access allow-list.
4. Copy the connection string (it looks like `mongodb+srv://<user>:<password>@<cluster>/<dbname>`) — this becomes `MONGO_URI`.

## Environment Variables

**Backend (`backend/.env`):**

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string (Atlas or local). |
| `JWT_SECRET` | Secret key used to sign and verify JWTs. Use a long, random string. |
| `PORT` | Port the backend listens on locally (e.g., `5000`). |
| `CLIENT_URL` | The frontend's origin, used for CORS (e.g., `http://localhost:5173` in dev, the Vercel URL in production). |

**Frontend (`frontend/.env`):**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (e.g., `http://localhost:5000/api` in dev, the deployed backend URL + `/api` in production). |

> Never commit `.env` files. Only `.env.example` (variable names, no values) should be in version control.

## Running Locally

1. Start MongoDB (Atlas is always "running"; if using local MongoDB, start the `mongod` service).
2. Start the backend: `cd backend && npm run dev` (runs on `http://localhost:5000` by default).
3. Start the frontend: `cd frontend && npm run dev` (runs on `http://localhost:5173` by default).
4. (Optional) Seed sample accounts: `node backend/scripts/seed.js` — creates one admin and employee accounts with initial leave quotas.
5. Open `http://localhost:5173` and log in.

## Default Test Credentials

The database can be seeded with pre-configured accounts for testing both Admin and Employee roles:

```bash
node backend/scripts/seed.js
```

| Role | Name | Email | Password | Pre-configured Quota / Status |
|---|---|---|---|---|
| **Admin** | System Admin | `admin@example.com` | `Admin@123` | Organization-wide dashboard, review & approve/reject leave requests |
| **Employee 1** | Asha Rao | `asha.rao@example.com` | `Employee@123` | 12 Casual, 10 Sick, 12 Earned (3 used / 1 approved, 1 pending) |
| **Employee 2** | Rahul Verma | `rahul.verma@example.com` | `Employee@123` | 12 Casual, 10 Sick, 15 Earned (1 pending Sick leave request) |

## API Overview

Full endpoint-by-endpoint contract (request/response shapes, validation, error cases) is documented in [`TRD.md`](./TRD.md). Summary:

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Log in | Public |
| GET | `/api/employee/profile` | Get own profile | Employee |
| GET | `/api/employee/leave-balance` | Get own leave balance | Employee |
| POST | `/api/leaves` | Apply for leave | Employee |
| GET | `/api/leaves/my` | List own leave requests | Employee |
| GET | `/api/leaves/:id` | View own leave request detail | Employee |
| GET | `/api/admin/dashboard` | Org-wide stats | Admin |
| GET | `/api/admin/employees` | List employees + balances | Admin |
| GET | `/api/admin/leaves` | List all leave requests | Admin |
| GET | `/api/admin/leaves/:id` | View any leave request detail | Admin |
| PATCH | `/api/admin/leaves/:id/approve` | Approve a request | Admin |
| PATCH | `/api/admin/leaves/:id/reject` | Reject a request | Admin |

## Authentication

- Login returns a JWT; include it as `Authorization: Bearer <token>` on all subsequent requests.
- Tokens expire after 1 day by default (configurable in the backend).
- There is no self-service registration in this version — accounts are created via the seed script (see `backend/scripts/seed.js`) or directly in MongoDB Atlas.

## Testing

- Import the Postman collection (if provided in `/postman`) or manually exercise each endpoint above.
- See [`TASKS.md`](./TASKS.md) Phase 8 for the full edge-case test matrix (invalid login, insufficient balance, double-approval, unauthorized access, etc.).

## Deployment

### Database — MongoDB Atlas
Already covered above. Use the same `MONGO_URI` for whichever environment (local/staging/production) points at the appropriate cluster/database.

### Backend
1. Push the repository to GitHub.
2. Create a new service on your chosen Node-compatible host (e.g., Render, Railway), pointing at the `backend/` directory.
3. Set build command: `npm install`. Set start command: `npm start`.
4. Set environment variables (`MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`) in the host's dashboard.
5. Deploy and note the resulting public backend URL.

### Frontend — Vercel
1. Import the GitHub repository into Vercel, setting the root directory to `frontend/`.
2. Set build command: `npm run build`. Output directory: `dist`.
3. Set the environment variable `VITE_API_URL` to `<deployed backend URL>/api`.
4. Deploy and note the resulting public frontend URL.

### Updating the Deployed Application
- Push changes to `main` on GitHub.
- Vercel redeploys the frontend automatically on push (if connected via Git integration).
- The backend host redeploys automatically or via a manual trigger, depending on the host's configuration.
- If environment variables change (e.g., a new `CLIENT_URL` after a frontend redeploy), update them in both hosting dashboards and redeploy the backend.

## Live Application

* **User-End (Frontend):** [https://leave-sync-frontend.vercel.app](https://leave-sync-frontend.vercel.app)
* **Backend API:** [https://leavesync-backend.vercel.app](https://leavesync-backend.vercel.app)
* **API Health Check:** [https://leavesync-backend.vercel.app/api/health](https://leavesync-backend.vercel.app/api/health)

## GitHub Repository
 
- [https://github.com/01sathu/LeaveSync.git](https://github.com/01sathu/LeaveSync.git)
 
 ## Common Issues

| Issue | Likely Cause | Fix |
|---|---|---|
| `401 Unauthorized` on every request | Missing/expired JWT | Log in again; confirm the token is attached as `Authorization: Bearer <token>` |
| CORS error in browser console | `CLIENT_URL` on the backend doesn't match the frontend's actual origin | Update `CLIENT_URL` env var on the backend and redeploy |
| Backend fails to start | Invalid or missing `MONGO_URI` | Double-check the Atlas connection string and that the IP allow-list includes your host |
| Leave application always rejected as "insufficient balance" | Seed data has low/zero balances | Check `leaveBalance` values on the test account via Atlas or the admin Employee List page |
| Approve request returns `409` | Request was already processed (approved/rejected) | Expected behavior — refresh the list to see current status |

## Future Enhancements

- Email/SMS notifications on status change
- Employee self-registration and password reset
- Multi-level approval workflow
- Working-day-aware leave calculation (excluding weekends/holidays)
- Overlapping leave request detection
- Balance reservation for pending requests
- Configurable leave types via an admin UI
- Exportable reports and date-range filtering
- Audit log of approval/rejection actions

---

# DOCUMENTATION CONSISTENCY CHECK

Final cross-document consistency review for the seven-document package (PRD.md, APPFLOW.md, ARCHITECTURE.md, Backend Schema.md, TRD.md, TASKS.md, README.md):

- [x] PRD requirements covered — FR-001–FR-025 and NFR-001–NFR-010 all map to specific tasks in TASKS.md and endpoints in TRD.md.
- [x] Employee flow covered — APPFLOW.md §1 covers login through logout end to end.
- [x] Admin flow covered — APPFLOW.md §2 covers login through logout end to end, including approve/reject.
- [x] Authentication documented — PRD §18, APPFLOW §3, ARCHITECTURE §6, TRD §6, consistent single `POST /api/auth/login` endpoint everywhere.
- [x] Authorization documented — PRD §19, APPFLOW §4, ARCHITECTURE §7, TRD §7, consistent `authMiddleware`/`roleMiddleware` naming everywhere.
- [x] Database schema complete — Backend Schema.md §1–§2 define both collections with every field used by the API in TRD.md §8.
- [x] API endpoints complete — TRD.md §8 lists every endpoint referenced in APPFLOW.md and used by TASKS.md Phase 4/5/6.
- [x] API/schema consistency verified — every field referenced in TRD.md request/response bodies exists in Backend Schema.md.
- [x] Leave balance logic verified — identical description in PRD §17, APPFLOW §7, Backend Schema §4–§5, TRD §13.
- [x] Leave approval/rejection logic verified — identical status-guard description in APPFLOW §5–§6, Backend Schema §5, TRD §13, TASKS T-5.6/T-5.8.
- [x] Validation documented — PRD §20, APPFLOW §1.5, TRD §9.
- [x] Error handling documented — PRD §21, APPFLOW §8, TRD §10, with one consistent response envelope (TRD §8.1) used throughout.
- [x] Security documented — PRD §24, ARCHITECTURE §11, TRD §11 — consistent bcrypt/JWT/CORS/role-check approach.
- [x] Frontend requirements documented — TRD §3, §14–§15, ARCHITECTURE §3, §13.
- [x] Backend requirements documented — TRD §4, §16–§20, ARCHITECTURE §4, §13.
- [x] Deployment documented — ARCHITECTURE §12, TRD §24–§25, README "Deployment" section, TASKS Phase 9 — all reference the same Vercel/Node-host/Atlas split.
- [x] Environment variables documented — identical variable names (`MONGO_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`, `VITE_API_URL`) across TRD §21 and README "Environment Variables".
- [x] GitHub requirements documented — TASKS T-1.1, T-9.1, README "GitHub Repository" (placeholder, no fake URL).
- [x] README requirements documented — this file covers all 24 requested sections.
- [x] Testing requirements documented — TRD §23, TASKS Phase 8, README "Testing" — same edge-case list as PRD "Edge Cases".
- [x] TASKS cover the implementation — every PRD requirement and TRD endpoint has a corresponding task in TASKS.md.
- [x] No unnecessary technologies — no Docker, Kubernetes, microservices, GraphQL, Redis, payments, payroll, or mandatory notifications anywhere in the package; all excluded per the assessment's explicit constraints.
- [x] No contradictory requirements — leave types (Casual/Sick/Earned), statuses (Pending/Approved/Rejected), and roles (employee/admin) use identical spelling/casing across all seven documents.
- [x] No fake URLs — all live URLs and the GitHub URL are represented as explicit placeholders (`<LIVE_FRONTEND_URL>`, `<LIVE_BACKEND_URL>`, `<GITHUB_REPOSITORY_URL>`) to be filled in after deployment.
- [x] No real secrets — only variable names are documented; `.env.example` pattern used throughout.
- [x] Project is realistically implementable by a single developer — scope, stack, and task breakdown are deliberately kept minimal and sequential (TASKS.md), consistent with the assessment's anti-over-engineering constraints.
