# Frontend Services Module Overview

## 1. What is this module?
The `frontend/src/services` folder acts as the API communication layer between the React client and the Express backend.

## 2. Why is it used?
Instead of hardcoding `fetch()` or `axios` calls with backend URLs across multiple React components, all HTTP requests are organized into clean service files. If an endpoint path changes or the backend host URL changes, we only need to update it in one place.

## 3. Files in this module

### `api.js`
- **What it does:** The centralized HTTP client. It reads `VITE_API_URL`, automatically injects the JWT `Bearer <token>` header from `localStorage`, converts request bodies to JSON, and parses the API error envelope. If a 401 Unauthorized status is returned, it automatically clears the expired session.
- **Why it is needed:** Ensures that every single API call across the frontend includes proper authentication headers and handles errors uniformly.
- **What it communicates with:** Used by all other service files (`authService`, `employeeService`, `leaveService`, `adminService`).

### `authService.js`
- **What it does:** Handles logging in (`/api/auth/login`) and manages local token/user session persistence in browser `localStorage`.
- **Why it is needed:** Used during login and logout to set and clear user credentials.
- **What it communicates with:** Used by `AuthContext.jsx` and `Login.jsx`.

### `employeeService.js`
- **What it does:** Fetches the logged-in employee's profile (`/api/employee/profile`) and leave balances (`/api/employee/leave-balance`).
- **Why it is needed:** Feeds real-time leave quotas and profile info to employee dashboards.
- **What it communicates with:** Used by `EmployeeDashboard.jsx` and `ApplyLeave.jsx`.

### `leaveService.js`
- **What it does:** Calls leave endpoints (`applyLeave`, `getMyLeaves`, `getLeaveById`).
- **Why it is needed:** Enables employees to submit leave requests and query their personal leave history.
- **What it communicates with:** Used by `ApplyLeave.jsx` and `LeaveHistory.jsx`.

### `adminService.js`
- **What it does:** Calls admin endpoints (`getDashboardStats`, `getAllEmployees`, `getAllLeaves`, `getLeaveDetail`, `approveLeave`, `rejectLeave`).
- **Why it is needed:** Powers all admin screens for inspecting metrics, viewing all employee balances, and approving or rejecting leave requests.
- **What it communicates with:** Used by `AdminDashboard.jsx`, `AdminEmployees.jsx`, `AdminLeaves.jsx`, and `AdminLeaveDetail.jsx`.

## 4. How does the code work?
1. A React component calls a service function, for example: `await leaveService.applyLeave({ leaveType, startDate, endDate, reason })`.
2. `leaveService.js` delegates to `request('/leaves', { method: 'POST', body: ... })` in `api.js`.
3. `api.js` attaches the JWT stored in `localStorage` as `Authorization: Bearer <token>` and sends the request to `${VITE_API_URL}/leaves`.
4. If the server returns a 200 or 201 response, the JSON payload is returned to the React component.
5. If the server returns a 400 or 409 error, `api.js` throws an Error object containing the server's error message and error code so the UI can display a helpful notification.

## 5. Important logic
- **No Hardcoded URLs:** The API base URL is read dynamically from `import.meta.env.VITE_API_URL`, allowing seamless switching between local development and production deployments.
- **Automatic 401 Interception:** If a user's token expires, `api.js` clears `localStorage` and triggers an event to immediately redirect the user to the login screen.

## 6. Connection with other modules
```text
React Components & Pages (Login, Dashboard, ApplyLeave, Admin)
       ↓ calls
frontend/src/services (authService, employeeService, leaveService, adminService)
       ↓ delegates to
frontend/src/services/api.js (attaches JWT & handles errors)
       ↓ HTTP fetch
Express Backend (/api/...)
```
