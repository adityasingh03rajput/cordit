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

async function runStage4Tests() {
  console.log('--- STARTING STAGE 4 LIVE ROOM & OBSERVER TESTS ---');

  const ts = Date.now().toString().slice(-4);
  const partA = await createUser(`PartA_${ts}`, 'male', 'any');
  const partB = await createUser(`PartB_${ts}`, 'female', 'any');
  const observer = await createUser(`Obs_${ts}`, 'other', 'any');

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

  // Step 1: Create a public stranger chat room between Participant A & B
  console.log('\nStep 1: Participant A & B match directly to form a Stranger Chat room...');
  const directMatchPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Match timeout')), 5000);
    sockA.once('match:found', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  sockA.emit('match:direct_request', { targetPublicId: partB.publicId });
  const roomData = await directMatchPromise;
  const roomId = roomData.roomId;
  console.log(`✓ PASS: Stranger Room created: "${roomData.roomName}" (ID: ${roomId})`);

  // Step 2: Observer joins the live stranger room
  console.log('\nStep 2: Observer joins the public room...');
  const observerJoinPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Observer join timeout')), 5000);
    sockObs.once('joined_room', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  sockObs.emit('join_room', { roomId });
  const obsJoinData = await observerJoinPromise;

  if (obsJoinData.role !== 'observer') {
    throw new Error(`Expected role 'observer', got: ${obsJoinData.role}`);
  }
  console.log(`✓ PASS: Observer joined with verified role: "${obsJoinData.role}" (Observer count: ${obsJoinData.observerCount})`);

  // Step 3: Server-side message block enforcement for observer
  console.log('\nStep 3: Testing server-side authorization: Observer attempts to send_message...');
  const observerSendAttemptPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Observer block error timeout')), 5000);
    sockObs.once('error', (err) => {
      clearTimeout(timer);
      resolve(err);
    });
  });

  sockObs.emit('send_message', { roomId, text: 'Hello, I am trying to talk as an observer!' });
  const blockError = await observerSendAttemptPromise;

  if (!blockError.message.toLowerCase().includes('observer')) {
    throw new Error(`Expected observer message rejection, got: ${JSON.stringify(blockError)}`);
  }
  console.log(`✓ PASS: Server strictly rejected observer message: "${blockError.message}"`);

  // Step 4: Participant A sends legitimate message
  console.log('\nStep 4: Participant A sends a legitimate message to room...');
  const messageBroadcastPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Message broadcast timeout')), 5000);
    sockObs.once('new_message', (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
  });

  sockA.emit('send_message', { roomId, text: 'Hello Participant B, welcome!' });
  const receivedMsg = await messageBroadcastPromise;
  console.log(`✓ PASS: Legitimate message received by room spectators: "${receivedMsg.text}" from #${receivedMsg.publicId}`);

  // Step 5: Observer submits a suggestion
  console.log('\nStep 5: Observer drops a live suggestion...');
  const suggestionBroadcastPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Suggestion broadcast timeout')), 5000);
    sockA.once('chat:suggestion:new', (sugg) => {
      clearTimeout(timer);
      resolve(sugg);
    });
  });

  sockObs.emit('chat:suggestion:send', { roomId, content: 'You guys should discuss your favorite books!' });
  const receivedSugg = await suggestionBroadcastPromise;
  console.log(`✓ PASS: Observer suggestion broadcast to room: "${receivedSugg.content}" by #${receivedSugg.observerPublicId}`);

  // Step 6: Participant toggles suggestion visibility
  console.log('\nStep 6: Participant A toggles suggestion visibility...');
  const toggleVisibilityPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Toggle visibility timeout')), 5000);
    sockA.once('chat:suggestion:visibility_updated', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  sockA.emit('chat:suggestion:toggle_visibility', { suggestionId: receivedSugg._id, visible: true });
  const toggleData = await toggleVisibilityPromise;
  console.log(`✓ PASS: Suggestion visibility updated: visible=${toggleData.visible}`);

  // Step 7: Observer leaves room
  console.log('\nStep 7: Observer leaves room...');
  const leavePromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Leave room timeout')), 5000);
    sockA.once('user_left', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  sockObs.emit('leave_room', { roomId });
  const leaveData = await leavePromise;
  console.log(`✓ PASS: Room notified of observer departure: #${leaveData.publicId} (${leaveData.username})`);

  sockA.disconnect();
  sockB.disconnect();
  sockObs.disconnect();

  console.log('\n--- ALL STAGE 4 LIVE ROOM TESTS PASSED WITH 100% SUCCESS ---');
  process.exit(0);
}

runStage4Tests().catch((err) => {
  console.error('\n❌ STAGE 4 TEST ERROR:', err.message);
  process.exit(1);
});

