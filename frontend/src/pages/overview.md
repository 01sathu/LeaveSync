# Frontend Pages Module Overview

## 1. What is this module?
The `frontend/src/pages` folder contains the primary view components representing each distinct screen in the Leave Management System.

## 2. Why is it used?
Each page corresponds to a route in the application (such as the login screen, employee dashboard, or admin approval panel). Isolating pages into their own files makes the user interface intuitive to navigate, debug, and expand.

## 3. Files in this module

### `Login.jsx`
- **What it does:** The public authentication page. Allows users to sign in with email and password, displays input errors, and offers one-click demo credentials for easy testing.
- **Why it is needed:** Acts as the entry gate to the system.
- **What it communicates with:** `AuthContext.jsx` and `authService.js`.

### `EmployeeDashboard.jsx`
- **What it does:** The home page for logged-in employees. Displays remaining, used, and total balances for Casual, Sick, and Earned leaves, summary cards for Pending/Approved/Rejected counts, and a table of recent submissions.
- **Why it is needed:** Satisfies FR-003 and FR-023 by giving employees real-time visibility into their available leave.
- **What it communicates with:** `employeeService.js` and `leaveService.js`.

### `ApplyLeave.jsx`
- **What it does:** The leave application form where employees select a leave type, choose start and end dates, and enter a reason. Dynamically computes the calendar days requested and alerts the user if their balance is insufficient before submission.
- **Why it is needed:** Satisfies FR-004 to FR-007 for submitting leave requests with instant client-side feedback.
- **What it communicates with:** `leaveService.js`, `employeeService.js`, and `formatters.js`.

### `LeaveHistory.jsx`
- **What it does:** A comprehensive table of an employee's personal leave requests. Supports filtering by status (`All`, `Pending`, `Approved`, `Rejected`) and reveals review notes and timestamps.
- **Why it is needed:** Satisfies FR-010 and FR-011 by providing full self-service auditability of past leave requests.
- **What it communicates with:** `leaveService.js`.

### `AdminDashboard.jsx`
- **What it does:** The central administrative command screen. Displays company-wide statistics (total employees, pending, approved, rejected) and an interactive queue of pending requests with direct 1-click Approve and Reject actions.
- **Why it is needed:** Satisfies FR-022 and gives managers an efficient way to act on time-off requests.
- **What it communicates with:** `adminService.js`.

### `AdminEmployees.jsx`
- **What it does:** Displays an organization-wide roster of all employees along with their exact leave quotas and balances for all three leave types. Includes a real-time search filter.
- **Why it is needed:** Satisfies FR-021 for management visibility.
- **What it communicates with:** `adminService.js`.

### `AdminLeaves.jsx`
- **What it does:** A company-wide view of all leave submissions across all employees, with filtering by status, status badges, and quick-action buttons.
- **Why it is needed:** Satisfies FR-013 for reviewing organization-wide leave history.
- **What it communicates with:** `adminService.js`.

### `AdminLeaveDetail.jsx`
- **What it does:** A detailed inspection screen for an individual leave request. Displays employee profile, employee balance sufficiency check, full reason text, and approval/rejection modal with optional reason notes.
- **Why it is needed:** Satisfies FR-014 through FR-020 for detailed request auditing.
- **What it communicates with:** `adminService.js`.

### `NotFound.jsx`
- **What it does:** Catch-all 404 page displayed when a user navigates to an undefined route.
- **Why it is needed:** Provides graceful fallback navigation.
- **What it communicates with:** `AuthContext.jsx`.

## 4. How does the code work?
- Pages are mounted inside `App.jsx` using `react-router-dom` `<Route>` elements.
- When a page mounts, it calls its respective service function inside a `useEffect` hook to fetch data.
- State is managed locally using `useState` for loading indicators, error banners, and data arrays.

## 5. Important logic
- **Immediate Feedback on Leave Application:** As the user selects start and end dates in `ApplyLeave.jsx`, the page computes calendar days in real time and validates them against available balance.
- **Defensive Confirmation:** When an admin approves or rejects a request, confirmation dialogs prevent accidental clicks.

## 6. Connection with other modules
```text
Router (App.jsx)
       ↓ renders
Pages (Login, Dashboards, ApplyLeave, History, Admin)
       ├── Uses Components (Navbar, StatCard, StatusBadge)
       ├── Uses Services (api.js, authService, leaveService, adminService)
       └── Uses Context (AuthContext.jsx)
```
