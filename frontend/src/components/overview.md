# Frontend Components Module Overview

## 1. What is this module?
The `frontend/src/components` folder contains reusable presentation and layout components used across the Leave Management System.

## 2. Why is it used?
Breaking the user interface down into smaller, reusable UI components follows standard modern React engineering practices. Common elements—such as navigation bars, status indicators, metric cards, dialog modals, and feedback notifications—are maintained here in isolation so every page looks cohesive and clean.

## 3. Files in this module

### `Navbar.jsx`
- **What it does:** Displays the top navigation bar with a glassmorphism frosted background, application logo, role-aware navigation links (Dashboard, Apply Leave, Leave History for employees; Dashboard, Leave Requests, Employees for admins), user profile chip with initials avatar, and a mobile-friendly collapsible drawer.
- **Why it is needed:** Provides clean, accessible navigation on both desktop and mobile screens.
- **What it communicates with:** Consumes `useAuth()` to conditionally show employee vs admin links and execute logout.

### `ProtectedRoute.jsx`
- **What it does:** Route guard component that checks if a user is authenticated and possesses the required role (`employee` or `admin`). If unauthenticated, it redirects to `/login`. If the user has the wrong role, it redirects them to their respective home dashboard.
- **Why it is needed:** Prevents unauthorized access to protected screens simply by typing URLs into the browser address bar.
- **What it communicates with:** Reads `useAuth()` and wraps child routes inside `App.jsx`.

### `StatCard.jsx`
- **What it does:** A linear/SaaS-style summary card component that presents key metrics, titles, and icons. It also includes an optional quota progress bar showing the percentage of leave days used versus total allotted days.
- **Why it is needed:** Used across both Employee and Admin dashboards to visualize leave quotas and review counts.
- **What it communicates with:** Rendered by `EmployeeDashboard.jsx` and `AdminDashboard.jsx`.

### `StatusBadge.jsx`
- **What it does:** Displays a pill-shaped status badge with a live colored indicator dot:
  - `Pending`: Translucent amber badge with a subtle pulsing dot
  - `Approved`: Translucent emerald green badge with a solid dot
  - `Rejected`: Translucent rose red badge with a solid dot
- **Why it is needed:** Provides immediate visual clarity when reviewing leave requests in tables and detail views.
- **What it communicates with:** Rendered by `LeaveHistory.jsx`, `AdminLeaves.jsx`, and `AdminLeaveDetail.jsx`.

### `Toast.jsx`
- **What it does:** A lightweight toast notification banner that slides up in the bottom-right corner when an action succeeds or fails, and automatically dismisses itself after 4 seconds.
- **Why it is needed:** Gives users immediate, non-intrusive feedback when a leave request is submitted, approved, or rejected.
- **What it communicates with:** Used by `ApplyLeave.jsx`, `AdminDashboard.jsx`, `AdminLeaves.jsx`, and `AdminLeaveDetail.jsx`.

### `Modal.jsx`
- **What it does:** An accessible popup dialog with backdrop blur, smooth entrance animation, and keyboard ESC dismissal.
- **Why it is needed:** Used for administrative workflows like writing a rejection reason before confirming a rejection.
- **What it communicates with:** Used by `AdminDashboard.jsx`, `AdminLeaves.jsx`, and `AdminLeaveDetail.jsx`.

## 4. How does the code work?
- `ProtectedRoute` checks `isAuthenticated` and `user.role`. If checks pass, it renders the requested page using `<Outlet />`.
- `Toast` uses `setTimeout` to automatically call `onClose` after a designated duration.
- `Modal` attaches an ESC key listener to the browser window and locks background scrolling while open.

## 5. Important logic
- **Role-Aware Redirection:** If an employee attempts to navigate directly to `/admin/dashboard`, `ProtectedRoute` intercepts the request and safely reroutes them back to `/dashboard`.
- **Consistent Design Language:** Status colors, rounded borders, and subtle drop shadows are harmonized across all components for a unified SaaS feel.

## 6. Connection with other modules
```text
App.jsx (Layout & Router)
  ├── ProtectedRoute.jsx (guards routes)
  ├── Navbar.jsx (header)
  └── Pages
        ├── StatCard.jsx
        ├── StatusBadge.jsx
        ├── Toast.jsx
        └── Modal.jsx
```
