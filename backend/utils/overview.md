# Utils Module Overview

## 1. What is this module?
The `utils` (utilities) folder contains reusable helper functions and classes that are shared across the backend codebase.

## 2. Why is it used?
Instead of writing repetitive code for error formatting, token signing, or async/await try-catch blocks in every controller, these common tasks are centralized into small, testable utility functions. This keeps the controllers clean and focused on their primary responsibilities.

## 3. Files in this module

### `AppError.js`
- **What it does:** A custom error class that extends JavaScript's built-in `Error`. It attaches an HTTP status code (like 400, 404, 409) and an optional machine-readable error code (like `INSUFFICIENT_BALANCE` or `ALREADY_PROCESSED`).
- **Why it is needed:** Allows services and controllers to throw errors with specific HTTP status codes and messages that our central error handler can easily interpret.
- **What it communicates with:** Thrown by services, controllers, and middleware; caught by Express error middleware (`errorHandler.js`).

### `asyncHandler.js`
- **What it does:** A wrapper function for asynchronous Express route controllers.
- **Why it is needed:** Without this wrapper, every async controller would need a manual `try { ... } catch (error) { next(error); }` block. With `asyncHandler`, any rejected promise or error is automatically caught and forwarded to Express's error handler.
- **What it communicates with:** Wraps controller functions across all route handlers.

### `generateToken.js`
- **What it does:** Signs a JSON Web Token (JWT) containing the user's `id` and `role`, using the secret key from `JWT_SECRET`.
- **Why it is needed:** Enables stateless authentication so users receive a secure token upon logging in.
- **What it communicates with:** Used by `authController.js` when a user successfully logs in.

## 4. How does the code work?
- When a controller needs to report an issue (e.g., balance exceeded), it throws `new AppError('Insufficient leave balance', 400, 'INSUFFICIENT_BALANCE')`.
- The `asyncHandler` catches that error and passes it along to Express via `next(err)`.
- When an employee or admin logs in, `generateToken({ id: user._id, role: user.role })` creates a signed JWT string with a 1-day expiration.

## 5. Important logic
- **Operational vs Programming Errors:** `AppError` marks `isOperational = true` so the central error handler knows this is a planned, user-safe error (e.g., invalid input) rather than an unexpected system crash.
- **Token Security:** The JWT only holds the user's unique ID and role (`{ id, role }`). Sensitive information like passwords or balance objects are never embedded in the token.

## 6. Connection with other modules
```text
Controller / Service
       ↓ throws AppError or uses generateToken
asyncHandler (catches errors)
       ↓ forwards to
middleware/errorHandler.js
       ↓ formats JSON response to
Client (Browser / Postman)
```
