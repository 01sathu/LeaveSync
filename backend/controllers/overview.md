# Controllers Module Overview

## 1. What is this module?
The `controllers` folder contains the functions that handle HTTP requests from the client. A controller receives the incoming request, calls the appropriate service or model, and formats the standard JSON response to send back to the client.

## 2. Why is it used?
Controllers keep routing and business logic separated. Instead of writing database queries and response formatting directly in the route definitions, routes simply point to controller functions. This makes the codebase neat, readable, and easy to maintain.

## 3. Files in this module

### `authController.js`
- **What it does:** Handles user authentication (`POST /api/auth/login`).
- **Why it is needed:** Allows both employees and admins to log into the application and receive a signed JWT token.
- **What it communicates with:** Reads the `User` model to find matching credentials, compares passwords using bcrypt, and generates a JWT with `generateToken.js`.

### `employeeController.js`
- **What it does:** Handles employee-specific queries (`GET /api/employee/profile` and `GET /api/employee/leave-balance`).
- **Why it is needed:** Provides the logged-in employee with their personal details and calculates their remaining leave balance (`total - used`) for all three leave categories (`Casual`, `Sick`, `Earned`).
- **What it communicates with:** Reads the employee's document from the `User` model.

### `leaveController.js`
- **What it does:** Handles leave application and leave history (`POST /api/leaves`, `GET /api/leaves/my`, and `GET /api/leaves/:id`).
- **Why it is needed:** Enables employees to submit leave requests, view their past requests, and check the details of a single request while enforcing strict ownership security.
- **What it communicates with:** Delegates business validation to `leaveService.js` and queries the `LeaveRequest` model.

### `adminController.js`
- **What it does:** Handles all admin dashboard operations (`GET /api/admin/dashboard`, `GET /api/admin/employees`, `GET /api/admin/leaves`, `GET /api/admin/leaves/:id`, `PATCH /api/admin/leaves/:id/approve`, `PATCH /api/admin/leaves/:id/reject`).
- **Why it is needed:** Gives administrators tools to monitor organization-wide statistics, inspect employee balances, review submitted requests, and execute approvals or rejections.
- **What it communicates with:** Calls `statsService.js`, `leaveService.js`, `User.js`, and `LeaveRequest.js`.

## 4. How does the code work?
1. Client makes an HTTP request.
2. Route middleware validates the request and passes control to the controller function.
3. The controller extracts any parameters (`req.params`), query strings (`req.query`), or body data (`req.body`).
4. The controller calls the relevant service method (e.g., `leaveService.approveLeaveRequest()`).
5. The controller returns a standardized JSON response:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

## 5. Important logic
- **Consistent Response Envelopes:** Every successful controller response wraps its payload inside `{ success: true, message: "...", data: ... }`.
- **Ownership Verification:** In `leaveController.getLeaveById`, normal employees can only view their own leave requests. If an employee tries to access another employee's request ID, the controller returns a 404 response to avoid leaking the existence of other records.
- **Derived Balances:** When returning employee balances, the controller dynamically calculates `remaining = total - used` so the frontend always sees accurate figures.

## 6. Connection with other modules
```text
Express Routes (authRoutes, employeeRoutes, leaveRoutes, adminRoutes)
       ↓ calls
Controllers (authController, employeeController, leaveController, adminController)
       ↓ delegates to
Services (leaveService, statsService) & Models (User, LeaveRequest)
       ↓ returns JSON to
Client (React Frontend / Postman)
```
