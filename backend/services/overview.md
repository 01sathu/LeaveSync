# Services Module Overview

## 1. What is this module?
The `services` folder contains the core business logic of our Leave Management System.

## 2. Why is it used?
In clean architecture, controllers should only be responsible for handling HTTP requests and responses (extracting query params, reading body JSON, and sending response status codes). The business rules—such as calculating leave days, checking if an employee has enough leave, and updating balances safely—belong in the service layer. This keeps our controllers thin and allows business logic to be easily tested in isolation.

## 3. Files in this module

### `leaveService.js`
- **What it does:** Contains all logic related to leave calculation, leave balance validation, creating leave requests, and approving/rejecting requests.
- **Why it is needed:** Implements the most critical requirements of the system: guaranteeing that leave balances are never deducted prematurely and are deducted exactly once upon approval.
- **What it communicates with:** Interacts with `LeaveRequest.js` and `User.js` models; called by `leaveController.js` and `adminController.js`.

### `statsService.js`
- **What it does:** Aggregates dashboard metrics (total employees, pending requests, approved requests, rejected requests).
- **Why it is needed:** Provides high-level summary statistics for the admin dashboard.
- **What it communicates with:** Queries `User.js` and `LeaveRequest.js`; called by `adminController.js`.

## 4. How does the code work?
### Applying for Leave
1. Employee submits leave type, start date, end date, and reason.
2. `calculateDays()` computes total calendar days inclusive of start and end dates (normalized to UTC midnight).
3. `validateBalance()` checks if `totalDays <= remaining` for that leave type. If not, it throws an `AppError` with status `400` and code `INSUFFICIENT_BALANCE`.
4. If valid, the leave request is saved with status `Pending`. **No balance is deducted at this stage.**

### Approving Leave
1. `approveLeaveRequest()` fetches the leave request and ensures its status is `Pending`. If it was already approved or rejected, it throws a `409 ALREADY_PROCESSED` conflict error.
2. It re-checks the employee's current balance defensively to ensure another approved request hasn't exhausted the quota in the interim.
3. It performs a status-guarded update on MongoDB: sets `status = 'Approved'`, assigns `reviewedBy` and `reviewedAt`, and increments the employee's `leaveBalance[leaveType].used` count.

### Rejecting Leave
1. `rejectLeaveRequest()` verifies the request is currently `Pending`.
2. It sets `status = 'Rejected'`, saves the optional admin `rejectionReason`, and **leaves the employee's leave balance completely untouched**.

## 5. Important logic
- **Zero Premature Deduction:** A `Pending` request never affects the balance.
- **Strict Status Guard:** A request can only transition once: `Pending → Approved` or `Pending → Rejected`. Attempting to approve or reject an already-processed request always fails with `409 Conflict`.
- **Defensive Re-check:** Prevents negative balances even in edge cases where an employee submits two pending requests that together exceed their balance.

## 6. Connection with other modules
```text
Controllers (leaveController, adminController)
       ↓ calls
Services (leaveService, statsService)
       ↓ performs business rules & queries
Mongoose Models (User, LeaveRequest)
       ↓ persists to
MongoDB Database
```
