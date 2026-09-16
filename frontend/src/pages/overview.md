# Frontend Pages Module Overview

## 1. What is this module?
The `frontend/src/pages` folder contains the primary view components representing each distinct screen in the Leave Management System.

## 2. Why is it used?
Each page corresponds to a route in the application (such as the login screen, employee dashboard, or admin approval panel). Isolating pages into their own files makes the user interface intuitive to navigate, debug, and expand.

## 3. Files in this module

### `Login.jsx`
- **What it does:** The public authentication page. Features an ambient background glow, email and password inputs, a password visibility toggle (eye icon), and 1-click quick-fill chips for Admin and Employee test accounts.
- **Why it is needed:** Acts as the entry gate to the system.
- **What it communicates with:** `AuthContext.jsx` and `authService.js`.

### `EmployeeDashboard.jsx`
- **What it does:** The home page for logged-in employees. Features a hero banner, quota visualizer progress bars for Casual, Sick, and Earned leaves, request overview summary cards, and a table of recent submissions.
- **Why it is needed:** Satisfies FR-003 and FR-023 by giving employees real-time visibility into their available leave.
- **What it communicates with:** `employeeService.js` and `leaveService.js`.

### `ApplyLeave.jsx`
- **What it does:** The leave application form where employees select a leave category, choose start and end dates, and enter a reason. Dynamically calculates calendar days in real time, warns immediately if duration exceeds balance, and shows a smooth toast notification upon submission.
- **Why it is needed:** Satisfies FR-004 to FR-007 for submitting leave requests with instant client-side feedback.
- **What it communicates with:** `leaveService.js`, `employeeService.js`, `formatters.js`, and `Toast.jsx`.

### `LeaveHistory.jsx`
- **What it does:** A comprehensive table of an employee's personal leave requests. Supports filtering by status (`All`, `Pending`, `Approved`, `Rejected`), real-time search filtering, and displays reviewer notes and timestamps.
- **Why it is needed:** Satisfies FR-010 and FR-011 by providing full self-service auditability of past leave requests.
- **What it communicates with:** `leaveService.js` and `StatusBadge.jsx`.

### `AdminDashboard.jsx`
- **What it does:** The central administrative command screen. Displays company-wide metrics and an interactive queue of pending requests with direct 1-click Approve actions and a Modal for entering rejection reasons.
- **Why it is needed:** Satisfies FR-022 and gives administrators an efficient way to act on time-off requests.
- **What it communicates with:** `adminService.js`, `Modal.jsx`, and `Toast.jsx`.

### `AdminEmployees.jsx`
- **What it does:** Displays an organization-wide roster of all employees with initials avatars, real-time search filtering, and visual progress bars showing the exact usage percentage for Casual, Sick, and Earned leaves.
- **Why it is needed:** Satisfies FR-021 for management visibility.
- **What it communicates with:** `adminService.js`.

### `AdminLeaves.jsx`
- **What it does:** A company-wide view of all leave submissions across all employees, with filtering by status, search by employee name or reason, and inline Approve/Reject action controls.
- **Why it is needed:** Satisfies FR-013 for reviewing organization-wide leave history.
- **What it communicates with:** `adminService.js`, `Modal.jsx`, and `Toast.jsx`.

### `AdminLeaveDetail.jsx`
- **What it does:** A detailed two-column inspection screen for an individual leave request. Displays the employee profile, balance sufficiency indicator, full reason text, and approval/rejection modal.
- **Why it is needed:** Satisfies FR-014 through FR-020 for detailed request auditing.
- **What it communicates with:** `adminService.js`, `Modal.jsx`, and `Toast.jsx`.

### `NotFound.jsx`
- **What it does:** Clean 404 page displayed when a user navigates to an undefined route, featuring clear copy and a return home button.
- **Why it is needed:** Provides graceful fallback navigation.
- **What it communicates with:** `AuthContext.jsx`.

## 4. How does the code work?
- Pages are mounted inside `App.jsx` using `react-router-dom` `<Route>` elements.
- When a page mounts, it calls its respective service function inside a `useEffect` hook to fetch data.
- State is managed locally using `useState` for loading indicators, error banners, modals, and toast notifications.

## 5. Important logic
- **Immediate Client Feedback:** In `ApplyLeave.jsx`, selecting dates immediately computes duration and verifies against balance before submitting.
- **Non-blocking Toasts:** Action confirmations appear in the corner without disrupting screen context.

## 6. Connection with other modules
```text
Router (App.jsx)
       ↓ renders
Pages (Login, Dashboards, ApplyLeave, History, Admin)
       ├── Uses Components (Navbar, StatCard, StatusBadge, Toast, Modal)
       ├── Uses Services (api.js, authService, leaveService, adminService)
       └── Uses Context (AuthContext.jsx)
```
