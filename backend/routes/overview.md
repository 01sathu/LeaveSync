# Routes Module Overview

## 1. What is this module?
The `routes` folder defines the API endpoints for the backend application. Each file groups related HTTP route paths (such as `/api/auth`, `/api/employee`, `/api/leaves`, and `/api/admin`), applies the appropriate middleware (validation, authentication, role authorization), and directs the request to the matching controller function.

## 2. Why is it used?
Separating routes by resource area prevents `server.js` from becoming a huge, cluttered file. It provides a clean sitemap of all available endpoints and makes permissions immediately clear by attaching middleware right at the route definition.

## 3. Files in this module

### `authRoutes.js`
- **What it does:** Defines public authentication routes.
- **Endpoints:**
  - `POST /api/auth/login` — logs in a user and returns a JWT.
- **Middleware used:** `validateLogin`
- **What it communicates with:** `authController.js`

### `employeeRoutes.js`
- **What it does:** Defines routes for the authenticated employee to view their account info.
- **Endpoints:**
  - `GET /api/employee/profile` — fetches the current user's profile.
  - `GET /api/employee/leave-balance` — fetches the employee's current leave balances.
- **Middleware used:** `authMiddleware`
- **What it communicates with:** `employeeController.js`

### `leaveRoutes.js`
- **What it does:** Defines routes for employees to manage their leave requests.
- **Endpoints:**
  - `POST /api/leaves` — submits a new leave request.
  - `GET /api/leaves/my` — lists the logged-in employee's own leave requests (supports `?status=` filter).
  - `GET /api/leaves/:id` — views a specific leave request (with ownership verification).
- **Middleware used:** `authMiddleware`, `validateLeaveApplication`, `validateObjectId`
- **What it communicates with:** `leaveController.js`

### `adminRoutes.js`
- **What it does:** Defines all administration routes.
- **Endpoints:**
  - `GET /api/admin/dashboard` — returns organization-wide dashboard counts.
  - `GET /api/admin/employees` — lists all employees and their leave balances.
  - `GET /api/admin/leaves` — lists all leave requests across the company.
  - `GET /api/admin/leaves/:id` — views details of any leave request.
  - `PATCH /api/admin/leaves/:id/approve` — approves a pending leave request.
  - `PATCH /api/admin/leaves/:id/reject` — rejects a pending leave request.
- **Middleware used:** `authMiddleware`, `roleMiddleware('admin')`, `validateObjectId`
- **What it communicates with:** `adminController.js`

## 4. How does the code work?
1. An incoming HTTP request hits `server.js`.
2. `server.js` routes requests starting with `/api/...` to the matching router file.
3. The router applies middleware in order:
   - For protected routes: `authMiddleware` checks the JWT token.
   - For admin routes: `roleMiddleware('admin')` checks that the user is an administrator.
   - For routes with parameters: `validateObjectId` ensures the ID is valid.
4. Finally, the controller function executes to handle the request.

## 5. Important logic
- **Layered Security:** Admin routes automatically protect all sub-paths using `router.use(authMiddleware, roleMiddleware('admin'))` at the top of the file, guaranteeing no admin endpoint can ever be called by an unauthenticated user or normal employee.
- **Input Validation:** Request bodies are checked before reaching the controller, returning quick `400` errors for missing or invalid data.

## 6. Connection with other modules
```text
server.js
  ├── mounts /api/auth     → authRoutes.js     → authController.js
  ├── mounts /api/employee → employeeRoutes.js → employeeController.js
  ├── mounts /api/leaves   → leaveRoutes.js    → leaveController.js
  └── mounts /api/admin    → adminRoutes.js    → adminController.js
```
