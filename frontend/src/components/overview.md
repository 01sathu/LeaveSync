# Frontend Components Module Overview

## 1. What is this module?
The `frontend/src/components` folder contains reusable presentation and layout components used throughout the React user interface.

## 2. Why is it used?
Breaking the user interface down into smaller, reusable UI components follows standard React best practices. Instead of duplicating navigation bars, metric cards, status indicators, or route protection logic on every screen, these elements are maintained in isolated, testable components.

## 3. Files in this module

### `Navbar.jsx`
- **What it does:** Displays the top navigation bar with the application logo, role-aware navigation links (e.g., Dashboard, Apply Leave, Leave History for employees; Dashboard, Leave Requests, Employees for admins), current user badge, and logout action.
- **Why it is needed:** Provides clear, persistent navigation throughout the application.
- **What it communicates with:** Consumes `useAuth()` to conditionally show employee vs admin links and execute logout.

### `ProtectedRoute.jsx`
- **What it does:** Route guard component that checks if a user is authenticated and possesses the required role (`employee` or `admin`). If unauthenticated, it redirects to `/login`. If the user has the wrong role, it redirects them to their respective home dashboard.
- **Why it is needed:** Prevents unauthorized access to protected screens simply by typing URLs into the browser address bar.
- **What it communicates with:** Reads `useAuth()` and wraps child routes inside `App.jsx`.

### `StatCard.jsx`
- **What it does:** A clean summary card component that presents a key metric, including title, big number, description, colored icon, and subtle border.
- **Why it is needed:** Used across both Employee and Admin dashboards to visualize counts (e.g., Casual balance, Sick balance, Pending requests, Approved requests).
- **What it communicates with:** Rendered by `EmployeeDashboard.jsx` and `AdminDashboard.jsx`.

### `StatusBadge.jsx`
- **What it does:** Displays a color-coded status badge with matching icons:
  - `Pending`: Amber badge with clock icon
  - `Approved`: Emerald green badge with check icon
  - `Rejected`: Rose red badge with cross icon
- **Why it is needed:** Provides immediate visual clarity when reviewing leave requests in tables and detail views.
- **What it communicates with:** Rendered by `LeaveHistory.jsx`, `AdminLeaves.jsx`, and `AdminLeaveDetail.jsx`.

## 4. How does the code work?
- `ProtectedRoute` inspects `isAuthenticated` and `user.role` from `AuthContext`. If checks pass, it renders the requested page using React Router's `<Outlet />`.
- `Navbar` dynamically computes link styling based on the active route using `NavLink`'s `isActive` property.

## 5. Important logic
- **Role-Aware Route Protection:** If an employee attempts to navigate directly to `/admin/dashboard`, `ProtectedRoute` intercepts the request and safely reroutes them back to `/dashboard`.
- **Status Color Consistency:** Status badge colors and icons are centralized in `StatusBadge.jsx` to guarantee that "Pending", "Approved", and "Rejected" look identical everywhere in the app.

## 6. Connection with other modules
```text
App.jsx (Layout & Router)
  ├── ProtectedRoute.jsx (guards routes)
  ├── Navbar.jsx (header)
  └── Pages (render StatCard.jsx, StatusBadge.jsx)
```
