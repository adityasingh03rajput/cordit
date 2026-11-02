import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3000';

async function createUser(username, gender, genderPreference) {
  const res = await fetch(`${API_BASE}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: 'password123',
      gender,
      genderPreference,
    }),
  });
  const data = await res.json();
  if (res.status !== 201) {
    throw new Error(`Failed to create user: ${JSON.stringify(data)}`);
  }
  return {
    publicId: data.publicId,
    token: data.token,
    username,
    gender,
    genderPreference,
  };
}

function connectSocket(token) {
  return io(API_BASE, {
    auth: { token },
    transports: ['websocket'],
  });
}

async function runStage5Tests() {
  console.log('--- STARTING STAGE 5 VERIFICATION & POLISH TESTS ---');

  const ts = Date.now().toString().slice(-4);
  const partA = await createUser(`P5_A_${ts}`, 'male', 'any');
  const partB = await createUser(`P5_B_${ts}`, 'female', 'any');
  const observer = await createUser(`P5_Obs_${ts}`, 'other', 'any');

  console.log(`Participant A: #${partA.publicId} (${partA.username})`);
  console.log(`Participant B: #${partB.publicId} (${partB.username})`);
  console.log(`Observer:      #${observer.publicId} (${observer.username})`);

  const sockA = connectSocket(partA.token);
  const sockB = connectSocket(partB.token);
  const sockObs = connectSocket(observer.token);

  await Promise.all([
    new Promise((r) => sockA.on('connect', r)),
    new Promise((r) => sockB.on('connect', r)),
    new Promise((r) => sockObs.on('connect', r)),
  ]);
  console.log('All 3 sockets connected.');

  // 1. Participant direct match
  console.log('\nStep 1: Direct match to create live stranger room...');
  const matchPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Match timeout')), 5000);
    sockA.once('match:found', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
  sockA.emit('match:direct_request', { targetPublicId: partB.publicId });
  const room = await matchPromise;
  const roomId = room.roomId;
  console.log(`✓ PASS: Matched in room "${room.roomName}" (ID: ${roomId})`);

  // 2. Observer join
  console.log('\nStep 2: Observer joins room...');
  const obsJoinPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Observer join timeout')), 5000);
    sockObs.once('joined_room', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
  sockObs.emit('join_room', { roomId });
  const obsJoin = await obsJoinPromise;
  if (obsJoin.role !== 'observer') throw new Error(`Expected role observer, got ${obsJoin.role}`);
  console.log(`✓ PASS: Observer verified with role: "${obsJoin.role}" (Observer count: ${obsJoin.observerCount})`);

  // 3. Observer sends suggestion
  console.log('\nStep 3: Observer sends suggestion...');
  const suggPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Suggestion timeout')), 5000);
    sockA.once('chat:suggestion:new', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
  sockObs.emit('chat:suggestion:send', { roomId, content: 'What is your favorite travel destination?' });
  const suggestion = await suggPromise;
  console.log(`✓ PASS: Suggestion broadcast received: "${suggestion.content}" from #${suggestion.observerPublicId}`);

  // 4. Participant A hides the suggestion (individual control)
  console.log('\nStep 4: Participant A toggles suggestion visibility to false...');
  const toggleAPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Toggle timeout')), 5000);
    sockA.once('chat:suggestion:visibility_updated', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
  sockA.emit('chat:suggestion:toggle_visibility', { suggestionId: suggestion._id, visible: false });
  const toggleResult = await toggleAPromise;
  if (toggleResult.visible !== false) throw new Error('Expected visible to be false');
  console.log(`✓ PASS: Participant A received visibility_updated: visible=${toggleResult.visible}`);

  // 5. Confirm Participant B did not receive an unwanted visibility reset
  console.log('\nStep 5: Verifying individual participant suggestion visibility scoping...');
  let participantBLeaked = false;
  sockB.once('chat:suggestion:visibility_updated', () => {
    participantBLeaked = true;
  });
  await new Promise((r) => setTimeout(r, 600));
  if (participantBLeaked) {
    throw new Error('Participant B should not receive Participant A personal visibility toggle');
  }
  console.log('✓ PASS: Suggestion visibility is correctly scoped per-participant.');

  // 6. Observer leaves room
  console.log('\nStep 6: Observer leaves room...');
  const leavePromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Leave timeout')), 5000);
    sockA.once('user_left', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
  sockObs.emit('leave_room', { roomId });
  const leaveData = await leavePromise;
  console.log(`✓ PASS: Departure notification received for #${leaveData.publicId}`);

  // 7. Cleanup
  sockA.disconnect();
  sockB.disconnect();
  sockObs.disconnect();

  console.log('\n--- ALL STAGE 5 VERIFICATION TESTS PASSED (100%) ---');
  process.exit(0);
}

runStage5Tests().catch((err) => {
  console.error('\n❌ STAGE 5 TEST ERROR:', err.message);
  process.exit(1);
});
