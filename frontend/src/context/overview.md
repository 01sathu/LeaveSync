# Context Module Overview

## 1. What is this module?
The `frontend/src/context` folder contains React Context providers used for managing global client-side state across the frontend application.

## 2. Why is it used?
In a web application with multiple pages, various components (such as the navigation bar, login form, and route guards) all need to know who is logged in and what role they have (`employee` or `admin`). React Context allows us to share this authentication state globally without manually passing props down through every component tree.

## 3. Files in this module

### `AuthContext.jsx`
- **What it does:** Provides the global `AuthContext` and custom `useAuth()` hook. It tracks:
  - `user`: current user details (`id`, `name`, `email`, `role`).
  - `token`: the active JWT string.
  - `isAuthenticated`: boolean flag indicating if a valid session exists.
  - `isAdmin` / `isEmployee`: helper booleans for role checks.
  - `login()`: calls the backend login API, saves credentials to `localStorage`, and updates state.
  - `logout()`: clears local storage and resets state.
- **Why it is needed:** Acts as the single source of truth for authentication state on the frontend.
- **What it communicates with:** Uses `authService.js` for API and storage interactions; consumed by `App.jsx`, `Navbar.jsx`, `Login.jsx`, and `ProtectedRoute.jsx`.

## 4. How does the code work?
1. On initial page load, `AuthProvider` initializes `user` and `token` from `localStorage` so user logins persist across page refreshes.
2. When a user submits their login form, `login(email, password)` is called.
3. Upon success, the returned JWT and user profile are saved to `localStorage` and stored in React state.
4. Any component can access auth state by importing and calling `const { user, logout, isAdmin } = useAuth();`.
5. When the user clicks "Logout", `logout()` clears `localStorage` and resets state to `null`.

## 5. Important logic
- **Session Expiration Event:** Listens for the `'auth:unauthorized'` event dispatched by `api.js`. If the backend returns a 401 error (expired token), the context automatically resets the session to immediately return the user to the login screen.
- **Role Flags:** Provides convenient boolean helpers (`isAdmin`, `isEmployee`) so navigation bars and routes can render role-specific views simply and cleanly.

## 6. Connection with other modules
```text
AuthProvider (wraps entire application in App.jsx)
       ├── consumed by ProtectedRoute.jsx (guards routes)
       ├── consumed by Navbar.jsx (renders user info & logout button)
       ├── consumed by Login.jsx (executes login)
       └── interacts with services/authService.js
```
