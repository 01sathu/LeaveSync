# Models Module Overview

## 1. What is this module?
The `models` folder defines the database schemas and structure for our MongoDB collections using Mongoose.

## 2. Why is it used?
MongoDB is a NoSQL document database, which means it is naturally flexible. Mongoose schemas give our application structure, type checking, field validation, and data consistency. This ensures that every document saved in MongoDB adheres strictly to the defined schema.

## 3. Files in this module

### `User.js`
- **What it does:** Represents a user account (both Employees and Admins). It stores user credentials, user role (`employee` or `admin`), and the embedded `leaveBalance` object for each leave type (`casual`, `sick`, `earned`).
- **Why it is needed:** Used for authentication, role authorization, and tracking an employee's total and used leave quotas.
- **What it communicates with:** Used by `authController.js`, `employeeController.js`, `adminController.js`, `leaveService.js`, and seed scripts.

### `LeaveRequest.js`
- **What it does:** Represents an individual leave request submitted by an employee. It stores the referencing `employeeId`, `leaveType`, `startDate`, `endDate`, calculated `totalDays`, `reason`, `status` (`Pending`, `Approved`, `Rejected`), and admin review details (`reviewedBy`, `reviewedAt`, `rejectionReason`).
- **Why it is needed:** Acts as the single source of truth for all leave submissions and the approval/rejection lifecycle.
- **What it communicates with:** Used by `leaveService.js`, `statsService.js`, `leaveController.js`, and `adminController.js`.

## 4. How does the code work?
- **User Creation:** When a new user is saved, a pre-save hook automatically hashes the password using bcrypt with a salt factor of 10. Passwords are never stored in plain text.
- **Password Security:** The schema sets `select: false` on the password field so queries do not accidentally expose password hashes in API responses.
- **Leave Request Creation:** The schema validates that `endDate` is on or after `startDate`, and ensures `leaveType` is one of `Casual`, `Sick`, or `Earned`.

## 5. Important logic
- **Single Source of Truth for Leave Balance:** The `leaveBalance` stores `total` and `used`. The `remaining` balance is not stored as a separate database field; instead, it is dynamically computed as `total - used`. This prevents synchronization bugs.
- **Automatic Status Transition:** Every newly created leave request defaults to `Pending`. Only an Admin can change the status to `Approved` or `Rejected`.
- **Referential Integrity:** `LeaveRequest` stores Mongoose `ObjectId` references to `User`, enabling `.populate('employeeId', 'name email')` to fetch employee details without redundant data duplication.

## 6. Connection with other modules
```text
Routes / Controllers / Services
       ↓
Mongoose Models (User, LeaveRequest)
       ↓
MongoDB Atlas / Local MongoDB Database
```
