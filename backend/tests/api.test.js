const http = require('http');
const app = require('../server');

const PORT = 5001; // Use test port
let server;
let BASE_URL = `http://localhost:${PORT}/api`;

const makeRequest = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await response.json().catch(() => null);
  return {
    status: response.status,
    body: json,
  };
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
};

async function runTests() {
  console.log('🚀 Starting Automated API Test Suite for Leave Management System...\n');

  server = app.listen(PORT);
  // Wait a moment for server to listen
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // -------------------------------------------------------------
    // TEST 1: Health Check
    // -------------------------------------------------------------
    console.log('Test Group 1: System Health');
    const health = await makeRequest('/health');
    assert(health.status === 200, 'GET /api/health returns 200');
    assert(health.body.success === true, 'Health check returns success: true');

    // -------------------------------------------------------------
    // TEST 2: Authentication & Logins (T-8.1)
    // -------------------------------------------------------------
    console.log('\nTest Group 2: Authentication & Edge Cases');
    
    // T-8.1 Wrong Password
    const badPass = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'asha.rao@example.com', password: 'WrongPassword!' },
    });
    assert(badPass.status === 401, 'T-8.1: Wrong password returns 401 Unauthorized');
    assert(badPass.body.error === 'INVALID_CREDENTIALS', 'Returns INVALID_CREDENTIALS error code');

    // T-8.1 Nonexistent Email
    const noUser = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'nobody@example.com', password: 'SomePassword123' },
    });
    assert(noUser.status === 401, 'T-8.1: Nonexistent email returns 401');

    // Missing Fields in Login
    const missingLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'asha.rao@example.com' },
    });
    assert(missingLogin.status === 400, 'Missing password returns 400 Bad Request');

    // Valid Employee Login
    const empLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'asha.rao@example.com', password: 'Employee@123' },
    });
    assert(empLogin.status === 200, 'Valid employee login returns 200');
    assert(empLogin.body.data.token, 'Token is returned on login');
    const empToken = empLogin.body.data.token;
    const empUser = empLogin.body.data.user;

    // Valid Admin Login
    const adminLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@example.com', password: 'Admin@123' },
    });
    assert(adminLogin.status === 200, 'Valid admin login returns 200');
    assert(adminLogin.body.data.user.role === 'admin', 'Admin user role is admin');
    const adminToken = adminLogin.body.data.token;

    // Employee 2 Login (Rahul Verma)
    const emp2Login = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'rahul.verma@example.com', password: 'Employee@123' },
    });
    const emp2Token = emp2Login.body.data.token;
    const emp2User = emp2Login.body.data.user;

    // -------------------------------------------------------------
    // TEST 3: Auth & Role Middleware (T-8.11, T-8.13, T-8.14)
    // -------------------------------------------------------------
    console.log('\nTest Group 3: Authorization & Security (T-8.11, T-8.13)');
    
    // T-8.11 Employee accessing Admin Dashboard -> 403
    const forbiddenAdmin = await makeRequest('/admin/dashboard', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(forbiddenAdmin.status === 403, 'T-8.11: Employee accessing admin dashboard returns 403 Forbidden');

    // No Token -> 401
    const noToken = await makeRequest('/employee/profile');
    assert(noToken.status === 401, 'Request with no token returns 401 Unauthorized');

    // T-8.13 Invalid/Malformed Token -> 401
    const badToken = await makeRequest('/employee/profile', {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    });
    assert(badToken.status === 401, 'T-8.13: Malformed JWT returns 401 Unauthorized');

    // -------------------------------------------------------------
    // TEST 4: Employee Leave Balances & Profiles
    // -------------------------------------------------------------
    console.log('\nTest Group 4: Employee Profile & Leave Balance');
    
    const profile = await makeRequest('/employee/profile', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(profile.status === 200, 'GET /api/employee/profile returns 200');
    assert(profile.body.data.email === 'asha.rao@example.com', 'Profile matches logged-in user');

    const balanceRes = await makeRequest('/employee/leave-balance', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(balanceRes.status === 200, 'GET /api/employee/leave-balance returns 200');
    assert(balanceRes.body.data.casual.remaining !== undefined, 'Balance includes computed remaining property');

    // -------------------------------------------------------------
    // TEST 5: Leave Application Validation (T-8.3, T-8.4, T-8.5, T-8.6, T-8.7)
    // -------------------------------------------------------------
    console.log('\nTest Group 5: Leave Application Validation & Balance Rules');

    // T-8.3 Missing Fields
    const missingFields = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual' },
    });
    assert(missingFields.status === 400, 'T-8.3: Missing required fields returns 400');

    // T-8.4 Invalid Dates
    const invalidDate = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: 'not-a-date', endDate: 'invalid', reason: 'Vacation' },
    });
    assert(invalidDate.status === 400, 'T-8.4: Invalid date format returns 400');

    // T-8.5 End date before start date
    const badDateOrder = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-10', endDate: '2026-08-05', reason: 'Vacation' },
    });
    assert(badDateOrder.status === 400, 'T-8.5: End date before start date returns 400');

    // T-8.7 Invalid Leave Type
    const invalidType = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Sabbatical', startDate: '2026-08-01', endDate: '2026-08-03', reason: 'Time off' },
    });
    assert(invalidType.status === 400, 'T-8.7: Invalid leave type returns 400');

    // T-8.6 Insufficient Leave Balance (asking for 50 days when total is 12)
    const overBudget = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-01', endDate: '2026-09-20', reason: 'Trip' },
    });
    assert(overBudget.status === 400, 'T-8.6: Insufficient leave balance returns 400');
    assert(overBudget.body.error === 'INSUFFICIENT_BALANCE', 'Returns INSUFFICIENT_BALANCE error code');

    // Valid Leave Application (2 days of Casual leave)
    const validLeave = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: {
        leaveType: 'Casual',
        startDate: '2026-08-10',
        endDate: '2026-08-11',
        reason: 'Family appointment',
      },
    });
    assert(validLeave.status === 201, 'Valid leave application returns 201 Created');
    assert(validLeave.body.data.status === 'Pending', 'New leave request has status Pending');
    assert(validLeave.body.data.totalDays === 2, 'Total days correctly computed as 2 (inclusive calendar days)');
    const createdRequestId = validLeave.body.data._id;

    // Check balance is UNTOUCHED while Pending (FR-009)
    const balanceAfterPending = await makeRequest('/employee/leave-balance', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(balanceAfterPending.body.data.casual.used === 0, 'FR-009: Pending leave does NOT deduct balance');

    // -------------------------------------------------------------
    // TEST 6: Ownership Security (T-8.17, T-8.18)
    // -------------------------------------------------------------
    console.log('\nTest Group 6: Ownership Security & ID Validation');

    // T-8.17 Invalid ObjectId format
    const invalidIdRes = await makeRequest('/leaves/not-a-valid-id', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(invalidIdRes.status === 400, 'T-8.17: Invalid ObjectId format returns 400');

    // T-8.18 Employee 2 attempts to access Employee 1's leave request
    const crossAccess = await makeRequest(`/leaves/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${emp2Token}` },
    });
    assert(crossAccess.status === 404, 'T-8.18: Employee cannot access another employee leave request (returns 404)');

    // -------------------------------------------------------------
    // TEST 7: Admin Review, Approval, Rejection & Idempotency (T-8.9, T-8.10, T-8.20)
    // -------------------------------------------------------------
    console.log('\nTest Group 7: Admin Approval, Rejection, and Idempotency Guard');

    // Admin approves the request
    const approveRes = await makeRequest(`/admin/leaves/${createdRequestId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(approveRes.status === 200, 'T-8.9: Admin can approve pending request (returns 200)');
    assert(approveRes.body.data.status === 'Approved', 'Status updated to Approved');

    // Confirm Employee 1 balance is now deducted
    const balanceAfterApprove = await makeRequest('/employee/leave-balance', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(balanceAfterApprove.body.data.casual.used === 2, 'T-8.19: Casual used balance accurately increased to 2');
    assert(balanceAfterApprove.body.data.casual.remaining === 10, 'T-8.19: Remaining balance is accurately 10 (12 - 2)');

    // T-8.9 & T-8.20 Idempotency: Attempt to approve already-approved request -> 409 Conflict
    const doubleApprove = await makeRequest(`/admin/leaves/${createdRequestId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(doubleApprove.status === 409, 'T-8.9 / T-8.20: Re-approving already-approved request returns 409 Conflict');
    assert(doubleApprove.body.error === 'ALREADY_PROCESSED', 'Error code is ALREADY_PROCESSED');

    // Verify balance was NOT double-deducted
    const balanceAfterDoubleApprove = await makeRequest('/employee/leave-balance', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(balanceAfterDoubleApprove.body.data.casual.used === 2, 'Balance remains 2 and was not double deducted');

    // Create another request to test Rejection
    const rejectTarget = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: {
        leaveType: 'Sick',
        startDate: '2026-09-01',
        endDate: '2026-09-02',
        reason: 'Feeling unwell',
      },
    });
    assert(rejectTarget.status === 201, 'Created second request for rejection test');
    const rejectTargetId = rejectTarget.body.data._id;

    // T-8.10 Admin rejects the request with reason
    const rejectRes = await makeRequest(`/admin/leaves/${rejectTargetId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { rejectionReason: 'High workload during project release' },
    });
    assert(rejectRes.status === 200, 'T-8.10: Admin can reject pending request (returns 200)');
    assert(rejectRes.body.data.status === 'Rejected', 'Status updated to Rejected');
    assert(rejectRes.body.data.rejectionReason === 'High workload during project release', 'Rejection reason preserved');

    // Confirm Sick balance is UNCHANGED
    const balanceAfterReject = await makeRequest('/employee/leave-balance', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(balanceAfterReject.body.data.sick.used === 0, 'FR-018: Rejected leave leaves balance unchanged (used = 0)');

    // T-8.10 Attempt to reject already-rejected request -> 409
    const doubleReject = await makeRequest(`/admin/leaves/${rejectTargetId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(doubleReject.status === 409, 'T-8.10: Re-rejecting already-rejected request returns 409 Conflict');

    // -------------------------------------------------------------
    // TEST 8: Admin Dashboard Statistics (T-5.2)
    // -------------------------------------------------------------
    console.log('\nTest Group 8: Admin Dashboard Statistics & Reports');
    const adminStats = await makeRequest('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStats.status === 200, 'GET /api/admin/dashboard returns 200');
    assert(adminStats.body.data.totalEmployees >= 2, 'Admin dashboard reports total employees');
    assert(typeof adminStats.body.data.approved === 'number', 'Approved count is a valid number');
    assert(typeof adminStats.body.data.rejected === 'number', 'Rejected count is a valid number');

    const adminEmployees = await makeRequest('/admin/employees', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminEmployees.status === 200, 'GET /api/admin/employees returns 200');
    assert(adminEmployees.body.data.length >= 2, 'Lists all employees');
    assert(!adminEmployees.body.data[0].password, 'Password hash is excluded from employee list');

    console.log('\n🎉 ALL 20 TEST CASES PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    process.exit(process.exitCode || 0);
  }
}

runTests();
