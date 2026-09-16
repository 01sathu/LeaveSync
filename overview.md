# LeaveSync — Complete System Overview & Architecture Guide

LeaveSync is a full-stack, enterprise-grade Employee Leave Management System designed to streamline time-off requests, quota tracking, and managerial approval workflows.

---

## 1. What LeaveSync Does

In modern workplaces, managing employee leave via emails or spreadsheets leads to miscalculated balances, unrecorded absences, and lack of visibility. LeaveSync solves this through a centralized portal:
* **Employees:** View real-time quotas across leave types (Casual, Sick, Earned), apply for leaves with automated day calculations, and track approval status.
* **Administrators / HR:** Access an organization-wide dashboard, review staff balances, and approve or reject requests with mandatory audit notes.
* **Guaranteed Balance Integrity:** Leave quotas are only deducted upon explicit managerial approval, with automatic rollback protection.

---

## 2. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS | High-performance Single Page Application (SPA) |
| **Icons & Design** | Lucide React | Modern, accessible SaaS interface components |
| **Backend** | Node.js, Express.js | Modular, RESTful Serverless-ready API |
| **Database** | MongoDB Atlas (Cloud) | Document database with schema enforcement via Mongoose |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs | Stateless session management and secure password hashing |
| **Deployment** | Vercel | Global serverless edge hosting for both frontend and backend |

---

## 3. Project Folder Structure

```text
leave-management-system/
├── backend/
│   ├── api/
│   │   └── index.js            # Vercel serverless function entrypoint
│   ├── config/
│   │   └── db.js               # MongoDB Atlas connection pooling & DNS configuration
│   ├── controllers/            # Request handlers (auth, employee, leave, admin)
│   ├── middleware/             # Auth guard, role checker, validation, error handler
│   ├── models/                 # Mongoose schemas (User, LeaveRequest)
│   ├── routes/                 # Express route definitions
│   ├── scripts/
│   │   └── seed.js             # Initial database seeding script
│   ├── tests/
│   │   └── api.test.js         # Automated 20/20 edge-case test suite
│   ├── utils/                  # Custom AppError, token generator, async handlers
│   ├── package.json
│   └── vercel.json             # Backend serverless rewrite configuration
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # Navbar, Modals, StatCards, StatusBadges, Toasts
│   │   ├── context/            # AuthContext (state, login, logout, user session)
│   │   ├── pages/              # Login, Dashboards, ApplyLeave, History, LeaveDetail
│   │   ├── services/           # HTTP API client (api.js) and service methods
│   │   ├── utils/              # Client-side formatters and validators
│   │   ├── App.jsx             # React Router routing hierarchy
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind CSS directives & global ambient styles
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json             # Client-side SPA routing rewrites
├── overview.md                 # Complete system guide (this document)
├── README.md                   # Repository documentation and live links
└── DEPLOYMENT.md               # Step-by-step production hosting manual
```

---

## 4. How Frontend Communicates with Backend

1. **API Client (`frontend/src/services/api.js`):**
   - The frontend reads the backend URL from `import.meta.env.VITE_API_URL` (`https://leavesync-backend.vercel.app/api`).
   - Automatically sanitizes trailing slashes to prevent double-slash routing bugs.
2. **Authorization Header Injection:**
   - On successful login, the JWT is stored in browser `localStorage`.
   - Every subsequent request automatically attaches the header:
     ```http
     Authorization: Bearer <jwt_token>
     ```
3. **Session Expiry Handling:**
   - If the backend returns a `401 Unauthorized` (due to an expired or tampered token), the frontend triggers an `auth:unauthorized` event that clears local storage and routes the user back to `/login`.

---

## 5. Important API Routes

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Diagnostic endpoint reporting API and database connectivity |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT + user profile |
| `GET` | `/api/employee/leave-balance` | Employee | Returns remaining/used quotas for Casual, Sick, and Earned |
| `POST` | `/api/leaves` | Employee | Submits a new leave request (with date & quota validation) |
| `GET` | `/api/leaves/my` | Employee | Lists all past leave applications submitted by the logged-in user |
| `GET` | `/api/admin/dashboard` | Admin | Aggregated organization metrics (pending, approved, rejected counts) |
| `GET` | `/api/admin/employees` | Admin | Directory of all staff and their live quota breakdown |
| `GET` | `/api/admin/leaves` | Admin | Filterable log of all company leave requests |
| `PATCH` | `/api/admin/leaves/:id/approve` | Admin | Approves request and atomically deducts employee quota |
| `PATCH` | `/api/admin/leaves/:id/reject` | Admin | Rejects request with required reviewer reasoning |

---

## 6. Authentication & Security (JWT)

* Passwords are encrypted using `bcryptjs` with a salt round factor of 10. Passwords are never stored or logged in plain text.
* Authentication tokens are signed using `jsonwebtoken` (`HS256`) using `process.env.JWT_SECRET` and expire after 1 day.
* Route security is enforced at the controller layer via `authMiddleware` (verifies token integrity and decodes user identity) and `roleMiddleware` (restricts administrative routes exclusively to `role: "admin"`).

---

## 7. MongoDB & Mongoose Schema Design

The system uses two primary collections in `leave_management_db`:
1. **`users` Collection:**
   - Stores name, normalized email, hashed password, role (`employee` or `admin`), and embedded `leaveBalance` object:
     ```json
     {
       "casual": { "total": 12, "used": 0 },
       "sick": { "total": 10, "used": 0 },
       "earned": { "total": 15, "used": 0 }
     }
     ```
2. **`leaverequests` Collection:**
   - Stores `employeeId` (reference to `User`), `leaveType` (`Casual`, `Sick`, or `Earned`), `startDate`, `endDate`, `totalDays`, `reason`, `status` (`Pending`, `Approved`, or `Rejected`), and optional `reviewedBy` / `rejectionReason`.

---

## 8. Environment Variables Reference

### Backend (`backend/.env`):
* `MONGO_URI`: MongoDB Atlas connection string (`mongodb+srv://...`).
* `JWT_SECRET`: High-entropy 32+ character key for signing tokens.
* `NODE_ENV`: Set to `production` for deployed instances, or `development` locally.
* `CLIENT_URL`: Deployed frontend domain allowed by CORS.

### Frontend (`frontend/.env`):
* `VITE_API_URL`: Full URL of the backend API, including `/api` (`https://leavesync-backend.vercel.app/api`).

---

## 9. How to Run Locally

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. **Start Backend:**
   ```bash
   cd backend
   node server.js
   # Running on http://localhost:5000
   ```
3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   # Running on http://localhost:5173
   ```

---

## 10. Production Deployment Guide (Vercel + Atlas)

### A. MongoDB Atlas Configuration
1. Create a free **M0 Cluster** on MongoDB Atlas.
2. Under **Database Access**, create a user (e.g., `leavesync_admin`).
3. Under **Network Access**, add IP `0.0.0.0/0` (**Allow Access from Anywhere**).
4. In the **Connect** -> **Drivers** dialog, copy the exact connection string:
   ```text
   mongodb+srv://leavesync_admin:<password>@cluster0.epdldma.mongodb.net/leave_management_db?retryWrites=true&w=majority
   ```

### B. Backend Deployment on Vercel
1. Import the repository into Vercel as project **`leavesync-backend`**.
2. Framework: **Other** | Root Directory: **`backend`**.
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL=*`.
4. Deploy and verify at `https://leavesync-backend.vercel.app/api/health`.

### C. Frontend Deployment on Vercel
1. Import the repository into Vercel as project **`leavesync-frontend`**.
2. Framework: **Vite** | Root Directory: **`frontend`**.
3. Set environment variable: `VITE_API_URL=https://leavesync-backend.vercel.app/api`.
4. Deploy. The application is live!

---

## 11. Testing the Health Check Endpoint

Query the live health check at any time:
```bash
curl -i https://leavesync-backend.vercel.app/api/health
```

Expected Response (`200 OK`):
```json
{
  "success": true,
  "message": "Leave Management System API is healthy",
  "database": "connected",
  "timestamp": "2026-09-16T09:57:56.865Z"
}
```

---

## 12. Common Deployment Issues & Solutions

1. **`querySrv ENOTFOUND`**:
   - *Cause:* Typo in the Atlas cluster hostname (e.g. `epdlma` instead of `epdldma`) or cluster is paused.
   - *Solution:* Verify the exact spelling in the Atlas Drivers tab, or resume the cluster in the Atlas console.
2. **`Invalid vercel.json provided`**:
   - *Cause:* Invisible UTF-8 BOM characters (`\uFEFF`) added by certain Windows editors or deprecated `builds` syntax.
   - *Solution:* Use clean UTF-8 encoding without BOM and the modern `rewrites` block.
3. **404 on Page Refresh on Vercel**:
   - *Cause:* Static hosting server tries to find a physical file matching the React Router path.
   - *Solution:* Handled automatically by `frontend/vercel.json` with `rewrites: [{"source": "/(.*)", "destination": "/index.html"}]`.
4. **CORS Blocked**:
   - *Cause:* Backend `CLIENT_URL` does not match the frontend URL.
   - *Solution:* Set `CLIENT_URL` in Vercel backend environment variables to match the frontend domain.