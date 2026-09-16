# Frontend Utils Module Overview

## 1. What is this module?
The `frontend/src/utils` folder contains client-side helper functions for formatting values and validating inputs.

## 2. Why is it used?
Rather than repeating date parsing, calendar day calculation, and email validation logic inside multiple React components, these routines are written once and shared. This guarantees consistent behavior across all screens.

## 3. Files in this module

### `formatters.js`
- **What it does:** Provides functions to format ISO dates into human-friendly strings (`formatDate`), dynamically compute calendar days for leave periods (`calculateLeaveDays`), and capitalize strings (`capitalize`).
- **Why it is needed:** Displays clean dates in tables and gives real-time visual feedback on how many days a leave request will consume as the user selects dates.
- **What it communicates with:** Used by `ApplyLeave.jsx`, `LeaveHistory.jsx`, `AdminLeaves.jsx`, and `AdminLeaveDetail.jsx`.

### `validators.js`
- **What it does:** Provides client-side validation checks like `isValidEmail` and `isEndDateValid`.
- **Why it is needed:** Gives users immediate feedback if an end date precedes a start date before sending an invalid request to the server.
- **What it communicates with:** Used by forms in `Login.jsx` and `ApplyLeave.jsx`.

## 4. How does the code work?
- When an employee chooses a start date and an end date in the Apply Leave form, `calculateLeaveDays()` converts both dates to UTC midnights and calculates the difference in days `+ 1`.
- In history tables, `formatDate('2026-06-10T00:00:00.000Z')` returns `'Jun 10, 2026'` for readability.

## 5. Important logic
- **Client-Side Calendar Days:** The day calculation logic in `formatters.js` exactly mirrors the backend calculation in `leaveService.js` (inclusive of start and end dates), ensuring the employee sees the exact number of days that will be submitted.
- **Defensive Parsing:** Functions safely handle empty strings or `null` values without throwing runtime JavaScript errors.

## 6. Connection with other modules
```text
React Components & Pages (ApplyLeave, LeaveHistory, AdminLeaves)
       ↓ calls
frontend/src/utils (formatters.js, validators.js)
```
