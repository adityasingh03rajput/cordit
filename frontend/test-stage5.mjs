import { io } from 'socket.io-client';

const API = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runStage5Tests() {
  console.log('🚀 Starting Stage 5 Verification Tests...');

  // 1. Authenticate admin user
  const adminRes = await request('/user/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'password' }),
  });
  if (adminRes.status !== 200) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminRes.data));
  }
  const adminToken = adminRes.data.token;
  const adminPublicId = adminRes.data.publicId;
  console.log(`✅ Admin authenticated (#${adminPublicId})`);

  // 2. Register two test users
  const rnd = Math.floor(Math.random() * 90000 + 10000);
  const u1Name = `ModUser1_${rnd}`;
  const u2Name = `ModUser2_${rnd}`;

  const reg1 = await request('/user/register', {
    method: 'POST',
    body: JSON.stringify({
      username: u1Name,
      password: 'password123',
      gender: 'male',
      genderPreference: 'any',
    }),
  });
  const u1 = reg1.data;
  const token1 = reg1.data.token;

  const reg2 = await request('/user/register', {
    method: 'POST',
    body: JSON.stringify({
      username: u2Name,
      password: 'password123',
      gender: 'female',
      genderPreference: 'any',
    }),
  });
  const u2 = reg2.data;
  const token2 = reg2.data.token;

  console.log(`✅ Created test users: User1 #${u1.publicId} (${u1Name}) and User2 #${u2.publicId} (${u2Name})`);

  // TEST 1: Block user functionality
  console.log('\n--- Test 1: Block User & Matching Prevention ---');
  const blockRes = await request(`/moderation/block/${u2.publicId}`, {
    method: 'POST',
    token: token1,
  });
  if (blockRes.status !== 200 || !blockRes.data.blockedPublicId) {
    throw new Error(`Failed to block user: ${JSON.stringify(blockRes.data)}`);
  }
  console.log(`✅ User1 (#${u1.publicId}) blocked User2 (#${u2.publicId})`);

  // Verify User1's block list includes User2
  const blocksList = await request('/moderation/blocks', {
    method: 'GET',
    token: token1,
  });
  if (!blocksList.data.blocks?.some(b => b.blockedId?.publicId === u2.publicId)) {
    throw new Error('Blocked user not found in blocks list');
  }
  console.log(`✅ Block verified in GET /moderation/blocks`);

  // Verify direct match request fails when blocked (User 1 is online)
  const s1 = io(API, { auth: { token: token1 }, transports: ['websocket'] });
  await new Promise(r => s1.on('connect', r));

  const s2 = io(API, { auth: { token: token2 }, transports: ['websocket'] });
  await new Promise(r => s2.on('connect', r));

  const directMatchAttempt = await new Promise((resolve) => {
    s2.on('match:error', (err) => resolve(err));
    s2.emit('match:direct_request', { targetPublicId: u1.publicId });
  });
  if (!directMatchAttempt?.message || (!directMatchAttempt.message.toLowerCase().includes('connect') && !directMatchAttempt.message.toLowerCase().includes('block'))) {
    throw new Error(`Direct match should fail when blocked: ${JSON.stringify(directMatchAttempt)}`);
  }
  console.log(`✅ Direct match correctly rejected with: "${directMatchAttempt.message}"`);
  s1.disconnect();
  s2.disconnect();

  // TEST 2: Submit report
  console.log('\n--- Test 2: Report User Submission ---');
  const reportRes = await request('/moderation/report', {
    method: 'POST',
    token: token1,
    body: JSON.stringify({
      targetPublicId: u2.publicId,
      reason: 'Harassment and inappropriate language in stranger chat',
    }),
  });
  if (reportRes.status !== 201 || !reportRes.data.reportId) {
    throw new Error(`Failed to submit report: ${JSON.stringify(reportRes.data)}`);
  }
  const reportId = reportRes.data.reportId;
  console.log(`✅ Report submitted successfully (ID: ${reportId})`);

  // TEST 3: Admin Report Review Queue & Actions
  console.log('\n--- Test 3: Admin Report Inspection & Action ---');
  const adminReportsRes = await request('/moderation/admin/reports', {
    method: 'GET',
    token: adminToken,
  });
  if (adminReportsRes.status !== 200) {
    throw new Error(`Admin reports query failed: ${JSON.stringify(adminReportsRes.data)}`);
  }
  const targetReport = adminReportsRes.data.reports?.find(r => r._id === reportId);
  if (!targetReport) {
    throw new Error(`Submitted report ${reportId} not found in admin queue`);
  }
  console.log(`✅ Admin retrieved report queue; found report: "${targetReport.reason}"`);

  // Update report to reviewed
  const reviewRes = await request(`/moderation/admin/reports/${reportId}`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({
      status: 'reviewed',
      actionTaken: 'User issued warning',
    }),
  });
  if (reviewRes.status !== 200 || reviewRes.data.report?.status !== 'reviewed') {
    throw new Error(`Failed to update report status: ${JSON.stringify(reviewRes.data)}`);
  }
  console.log(`✅ Admin updated report status to 'reviewed' with action logged`);

  // TEST 4: Security RBAC Verification
  console.log('\n--- Test 4: RBAC Security Enforcement ---');
  const forbiddenRes = await request('/moderation/admin/reports', {
    method: 'GET',
    token: token1, // Regular user token
  });
  if (forbiddenRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for non-admin on admin endpoint, got ${forbiddenRes.status}`);
  }
  console.log(`✅ Non-admin attempt to access admin endpoints correctly rejected with 403 Forbidden`);

  // TEST 5: Admin Ban User & Login Enforcement
  console.log('\n--- Test 5: User Suspension & Ban Enforcement ---');
  const banRes = await request(`/moderation/admin/users/${u2.publicId}/status`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({ status: 'banned' }),
  });
  if (banRes.status !== 200 || banRes.data.user?.status !== 'banned') {
    throw new Error(`Failed to ban user: ${JSON.stringify(banRes.data)}`);
  }
  console.log(`✅ Admin banned user #${u2.publicId}`);

  // Verify banned user cannot log in
  const bannedLoginRes = await request('/user/login', {
    method: 'POST',
    body: JSON.stringify({ username: u2Name, password: 'password123' }),
  });
  if (bannedLoginRes.status !== 403) {
    throw new Error(`Expected 403 for banned user login, got ${bannedLoginRes.status}`);
  }
  console.log(`✅ Banned user login blocked with: "${bannedLoginRes.data.error}"`);

  // Unban user to restore
  const unbanRes = await request(`/moderation/admin/users/${u2.publicId}/status`, {
    method: 'PUT',
    token: adminToken,
    body: JSON.stringify({ status: 'active' }),
  });
  if (unbanRes.status !== 200) {
    throw new Error(`Failed to unban user: ${JSON.stringify(unbanRes.data)}`);
  }
  console.log(`✅ Admin unbanned user #${u2.publicId} and restored active status`);

  console.log('\n🎉 ALL STAGE 5 VERIFICATION TESTS PASSED SUCCESSFULLY! (100% PASS)');
  process.exit(0);
}

runStage5Tests().catch(err => {
  console.error('\n❌ STAGE 5 TEST FAILED:', err);
  process.exit(1);
});
