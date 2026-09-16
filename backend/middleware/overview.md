# Middleware Module Overview

## 1. What is this module?
The `middleware` folder contains Express middleware functions. Middleware functions are functions that intercept incoming HTTP requests before they reach the controller, or catch errors after the controller finishes.

## 2. Why is it used?
Middleware keeps our application secure and modular. Instead of copying authentication checks, role permissions, input validation, and error-handling code into every single controller, middleware handles these cross-cutting concerns cleanly in one place.

## 3. Files in this module

### `authMiddleware.js`
- **What it does:** Extracts the JWT from the `Authorization: Bearer <token>` header, verifies its validity and signature, checks that the user still exists in MongoDB, and attaches the authenticated user object (`req.user`) to the request.
- **Why it is needed:** Protects private endpoints from unauthenticated visitors.
- **What it communicates with:** Reads tokens sent by the client, verifies with `jsonwebtoken`, queries `User.js`, and hands the request over to the next handler.

### `roleMiddleware.js`
- **What it does:** Checks if the authenticated user (`req.user.role`) has one of the allowed roles (e.g., `admin`). If not, it halts the request with a `403 Forbidden` response.
- **Why it is needed:** Enforces role-based authorization so normal employees cannot view admin statistics, list other employees' records, or approve/reject leave requests.
- **What it communicates with:** Runs immediately after `authMiddleware.js` on role-restricted routes.

### `validate.js`
- **What it does:** Validates request parameters and body payloads before they reach business logic. Checks for valid MongoDB ObjectIds, login email/password presence, leave application fields, date ordering (`endDate >= startDate`), and valid leave types (`Casual`, `Sick`, `Earned`).
- **Why it is needed:** Prevents invalid or malformed data from reaching controllers and database queries, returning clear `400 Bad Request` messages.
- **What it communicates with:** Used directly on Express routes before invoking controllers.

### `errorHandler.js`
- **What it does:** The centralized error handler for the entire backend. It catches all errors passed via `next(err)` and formats them into the standard JSON response envelope: `{ success: false, message, error }`.
- **Why it is needed:** Ensures consistent error messages for frontend clients and guarantees that internal server details and stack traces are never leaked in production.
- **What it communicates with:** Placed as the very last middleware in `server.js`.

## 4. How does the code work?
1. An HTTP request reaches an endpoint (e.g., `PATCH /api/admin/leaves/:id/approve`).
2. `validateObjectId('id')` runs first: ensures `:id` is a 24-character hex MongoDB ObjectId.
3. `authMiddleware` runs second: verifies the Bearer token and attaches `req.user`.
4. `roleMiddleware('admin')` runs third: verifies `req.user.role === 'admin'`.
5. If any check fails, an `AppError` is forwarded to `errorHandler.js`.
6. If all checks pass, the controller executes. If the controller throws an error, `errorHandler.js` catches it and returns the structured error response.

## 5. Important logic
- **Stateless Verification:** The token is validated using cryptographic signatures against `process.env.JWT_SECRET`.
- **Ownership and Safety:** By attaching `req.user = { id, name, email, role }`, controllers can reliably identify the caller without trusting client-provided user IDs.
- **Central Error Normalization:** Database errors (like MongoDB duplicate keys or invalid ID casts) are automatically converted into friendly, standard HTTP responses.

## 6. Connection with other modules
```text
Client Request
      ↓
[validate.js] (checks request body and parameters)
      ↓
[authMiddleware.js] (checks JWT token)
      ↓
[roleMiddleware.js] (checks user role)
      ↓
Controllers & Services (process business logic)
      ↓ (if error occurs)
[errorHandler.js] (formats clean JSON error response)
```
