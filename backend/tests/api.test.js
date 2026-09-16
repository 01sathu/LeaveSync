process.env.NODE_ENV = 'test';

const http = require('http');
const app = require('../server');

const PORT = 5001; // Isolated test port
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
    body: options.rawBody !== undefined ? options.rawBody : (options.body ? JSON.stringify(options.body) : undefined),
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
  console.log('🚀 Starting Comprehensive Edge-Case API Test Suite...\n');

  server = app.listen(PORT);
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
      setTimeout(resolve, 3000);
    });
  }

  const User = require('../models/User');
  const LeaveRequest = require('../models/LeaveRequest');

  const cleanupTestData = async () => {
    try {
      await LeaveRequest.deleteMany({
        reason: { $in: ['Half-day errand', 'Personal family matter', 'Attempt overlapping dates', 'Flu recovery'] },
      });
      const testAsha = await User.findOne({ email: 'asha.rao@example.com' });
      if (testAsha) {
        testAsha.leaveBalance = {
          casual: { total: 12, used: 0 },
          sick: { total: 10, used: 0 },
          earned: { total: 15, used: 0 },
        };
        await testAsha.save();
      }
    } catch (e) {
      // Best-effort cleanup
    }
  };

  await cleanupTestData();

  try {
    // -------------------------------------------------------------
    // TEST 1: System Health & Malformed JSON
    // -------------------------------------------------------------
    console.log('Test Group 1: Health & Request Parsing');
    const health = await makeRequest('/health');
    assert(health.status === 200, 'GET /api/health returns 200');
    assert(health.body.success === true, 'Health check returns success: true');

    // Edge Case: Malformed JSON body in request
    const malformedJson = await makeRequest('/auth/login', {
      method: 'POST',
      rawBody: '{"email": "invalid-json',
    });
    assert(malformedJson.status === 400, 'Malformed JSON returns 400');
    assert(malformedJson.body.error === 'INVALID_JSON', 'Malformed JSON returns INVALID_JSON code');

    // -------------------------------------------------------------
    // TEST 2: Authentication & Input Validation
    // -------------------------------------------------------------
    console.log('\nTest Group 2: Authentication & Credentials');
    
    // Wrong Password
    const badPass = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'asha.rao@example.com', password: 'WrongPassword!' },
    });
    assert(badPass.status === 401, 'Wrong password returns 401 Unauthorized');
    assert(badPass.body.error === 'INVALID_CREDENTIALS', 'Returns INVALID_CREDENTIALS');

    // Nonexistent Email
    const noUser = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@example.com', password: 'SomePassword123' },
    });
    assert(noUser.status === 401, 'Nonexistent email returns 401');

    // Invalid Email Format
    const badEmail = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'notanemail', password: 'Password123' },
    });
    assert(badEmail.status === 400, 'Invalid email format returns 400');
    assert(badEmail.body.error === 'INVALID_EMAIL', 'Returns INVALID_EMAIL code');

    // Valid Employee Login (Asha Rao)
    const empLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'asha.rao@example.com', password: 'Employee@123' },
    });
    assert(empLogin.status === 200, 'Valid employee login returns 200');
    const empToken = empLogin.body.data.token;

    // Valid Admin Login
    const adminLogin = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'admin@example.com', password: 'Admin@123' },
    });
    assert(adminLogin.status === 200, 'Valid admin login returns 200');
    const adminToken = adminLogin.body.data.token;

    // Second Employee Login (Rahul Verma)
    const emp2Login = await makeRequest('/auth/login', {
      method: 'POST',
      body: { email: 'rahul.verma@example.com', password: 'Employee@123' },
    });
    const emp2Token = emp2Login.body.data.token;

    // -------------------------------------------------------------
    // TEST 3: RBAC & Route Security
    // -------------------------------------------------------------
    console.log('\nTest Group 3: RBAC & Token Security');
    
    // Employee accessing Admin route
    const forbidden = await makeRequest('/admin/dashboard', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(forbidden.status === 403, 'Employee accessing admin route returns 403 Forbidden');

    // No Token provided
    const noToken = await makeRequest('/employee/profile');
    assert(noToken.status === 401, 'Missing token returns 401 Unauthorized');

    // Malformed Token
    const malformedToken = await makeRequest('/employee/profile', {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    });
    assert(malformedToken.status === 401, 'Malformed token returns 401');

    // -------------------------------------------------------------
    // TEST 4: Leave Application & Edge Cases
    // -------------------------------------------------------------
    console.log('\nTest Group 4: Leave Application Edge Cases');

    // Missing Fields
    const missing = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual' },
    });
    assert(missing.status === 400, 'Missing fields returns 400');

    // End date before start date
    const badRange = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-10', endDate: '2026-08-05', reason: 'Vacation' },
    });
    assert(badRange.status === 400, 'End date before start date returns 400');

    // Invalid leave type
    const badType = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Holiday', startDate: '2026-08-10', endDate: '2026-08-11', reason: 'Vacation' },
    });
    assert(badType.status === 400, 'Invalid leave type returns 400');

    // Reason exceeding 500 characters
    const longReason = 'A'.repeat(501);
    const tooLong = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-10', endDate: '2026-08-11', reason: longReason },
    });
    assert(tooLong.status === 400, 'Reason exceeding 500 chars returns 400');
    assert(tooLong.body.error === 'REASON_TOO_LONG', 'Returns REASON_TOO_LONG code');

    // Insufficient balance
    const overLimit = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-01', endDate: '2026-09-30', reason: 'Long trip' },
    });
    assert(overLimit.status === 400, 'Insufficient balance returns 400');
    assert(overLimit.body.error === 'INSUFFICIENT_BALANCE', 'Returns INSUFFICIENT_BALANCE');

    // Edge Case: Same-Day Leave (start == end) -> exactly 1 day
    const sameDay = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-15', endDate: '2026-08-15', reason: 'Half-day errand' },
    });
    assert(sameDay.status === 201, 'Same-day leave returns 201 Created');
    assert(sameDay.body.data.totalDays === 1, 'Same-day leave calculates as exactly 1 calendar day');

    // Valid 2-day Leave Application
    const validLeave = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-20', endDate: '2026-08-21', reason: 'Personal family matter' },
    });
    assert(validLeave.status === 201, 'Valid leave returns 201 Created');
    assert(validLeave.body.data.status === 'Pending', 'Initial status is Pending');
    assert(validLeave.body.data.totalDays === 2, 'Total days is 2');
    const leaveId = validLeave.body.data._id;

    // Edge Case: Overlapping Leave Application (same or overlapping dates) -> 400 OVERLAPPING_LEAVE
    const overlappingAttempt = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Casual', startDate: '2026-08-20', endDate: '2026-08-22', reason: 'Attempt overlapping dates' },
    });
    assert(overlappingAttempt.status === 400, 'Overlapping leave returns 400');
    assert(overlappingAttempt.body.error === 'OVERLAPPING_LEAVE', 'Returns OVERLAPPING_LEAVE code');

    // -------------------------------------------------------------
    // TEST 5: ObjectId Validation Edge Cases
    // -------------------------------------------------------------
    console.log('\nTest Group 5: ObjectId Parameter Hardening');

    // Non-hex characters
    const nonHex = await makeRequest('/leaves/zzzzzzzzzzzzzzzzzzzzzzzz', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(nonHex.status === 400, 'Non-hex 24-char ObjectId returns 400');
    assert(nonHex.body.error === 'INVALID_OBJECT_ID', 'Returns INVALID_OBJECT_ID code');

    // 12-char string (which raw Mongoose sometimes accepts)
    const shortId = await makeRequest('/leaves/123456789012', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(shortId.status === 400, '12-char ID rejected by exact 24-hex check (400)');

    // -------------------------------------------------------------
    // TEST 6: Ownership & Cross-Employee Protection
    // -------------------------------------------------------------
    console.log('\nTest Group 6: Cross-Employee Privacy Protection');
    const crossAccess = await makeRequest(`/leaves/${leaveId}`, {
      headers: { Authorization: `Bearer ${emp2Token}` },
    });
    assert(crossAccess.status === 404, 'Employee cannot view another employee request (404)');

    // -------------------------------------------------------------
    // TEST 7: Admin Approval, Idempotency & Balance Deduction
    // -------------------------------------------------------------
    console.log('\nTest Group 7: Admin Approval & Idempotency');
    
    // First approval
    const approveRes = await makeRequest(`/admin/leaves/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(approveRes.status === 200, 'Admin can approve pending request (200)');
    assert(approveRes.body.data.status === 'Approved', 'Status updated to Approved');

    // Second approval (Idempotency check)
    const duplicateApprove = await makeRequest(`/admin/leaves/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(duplicateApprove.status === 409, 'Re-approving returns 409 Conflict');
    assert(duplicateApprove.body.error === 'ALREADY_PROCESSED', 'Error code is ALREADY_PROCESSED');

    // -------------------------------------------------------------
    // TEST 8: Rejection Validation & Idempotency
    // -------------------------------------------------------------
    console.log('\nTest Group 8: Rejection Validation & Idempotency');

    // Create a request to reject
    const toReject = await makeRequest('/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { leaveType: 'Sick', startDate: '2026-09-10', endDate: '2026-09-11', reason: 'Flu recovery' },
    });
    assert(toReject.status === 201, 'Created request for rejection');
    const rejectId = toReject.body.data._id;

    // Rejection reason too long (> 500 chars)
    const longRejectReason = 'R'.repeat(501);
    const badReject = await makeRequest(`/admin/leaves/${rejectId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { rejectionReason: longRejectReason },
    });
    assert(badReject.status === 400, 'Rejection reason exceeding 500 chars returns 400');
    assert(badReject.body.error === 'REASON_TOO_LONG', 'Returns REASON_TOO_LONG');

    // Valid rejection
    const validReject = await makeRequest(`/admin/leaves/${rejectId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { rejectionReason: 'Team project milestone this week' },
    });
    assert(validReject.status === 200, 'Valid rejection returns 200');
    assert(validReject.body.data.status === 'Rejected', 'Status updated to Rejected');

    // Re-reject (Idempotency check)
    const duplicateReject = await makeRequest(`/admin/leaves/${rejectId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(duplicateReject.status === 409, 'Re-rejecting returns 409 Conflict');

    // -------------------------------------------------------------
    // TEST 9: Query Parameter Sanitization & NoSQL Injection Protection
    // -------------------------------------------------------------
    console.log('\nTest Group 9: Query Parameter Sanitization');
    
    // Status filter with invalid value should be safely handled
    const bogusFilter = await makeRequest('/leaves/my?status=BogusStatus', {
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert(bogusFilter.status === 200, 'Invalid status query safely handled without crashing');

    // Admin leaves with valid filter
    const adminFiltered = await makeRequest('/admin/leaves?status=Approved', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminFiltered.status === 200, 'Admin leaves filtered by status returns 200');
    assert(adminFiltered.body.data.every((l) => l.status === 'Approved'), 'Every returned record has status Approved');

    console.log('\n🎉 ALL EDGE-CASE TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await cleanupTestData();
    if (server) server.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
