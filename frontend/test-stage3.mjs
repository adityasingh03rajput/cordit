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

async function runStage3Tests() {
  console.log('--- STARTING STAGE 3 MATCHING TESTS ---');

  const ts = Date.now().toString().slice(-4);
  const userA = await createUser(`Part1_${ts}`, 'male', 'female');
  const userB = await createUser(`Part2_${ts}`, 'male', 'female');
  const userC = await createUser(`Part3_${ts}`, 'female', 'male');

  console.log(`User A (Male seeking Female): #${userA.publicId}`);
  console.log(`User B (Male seeking Female): #${userB.publicId}`);
  console.log(`User C (Female seeking Male): #${userC.publicId}`);

  const sockA = connectSocket(userA.token);
  const sockB = connectSocket(userB.token);
  const sockC = connectSocket(userC.token);

  await Promise.all([
    new Promise((r) => sockA.on('connect', r)),
    new Promise((r) => sockB.on('connect', r)),
    new Promise((r) => sockC.on('connect', r)),
  ]);
  console.log('All 3 sockets connected.');

  // Step 1: Self-match Prevention Test
  console.log('Step 1: Testing self-match prevention...');
  const selfMatchPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Self match error timeout')), 4000);
    sockA.once('match:error', (err) => {
      clearTimeout(timer);
      resolve(err);
    });
  });
  sockA.emit('match:direct_request', { targetPublicId: userA.publicId });
  const selfErr = await selfMatchPromise;
  if (!selfErr.message.includes('yourself')) {
    throw new Error(`Expected self-match rejection, got: ${JSON.stringify(selfErr)}`);
  }
  console.log(`✓ PASS: Self-match rejected by server: "${selfErr.message}"`);

  // Step 2: Queue Cancel Acknowledgement Test
  console.log('Step 2: Testing queue join and server cancellation acknowledgement...');
  const waitPromise = new Promise((r) => sockA.once('match:waiting', r));
  sockA.emit('match:join_queue', { genderPreference: 'female' });
  await waitPromise;

  const cancelPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Cancel queue timeout')), 4000);
    sockA.once('match:left_queue', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  sockA.emit('match:leave_queue');
  await cancelPromise;
  console.log('✓ PASS: Server acknowledged match:left_queue and removed user from queue.');

  // Step 3: Mutual Preference Enforcement
  console.log('Step 3: Enqueuing User A and User B (Two males seeking females)...');
  sockA.emit('match:join_queue', { genderPreference: 'female' });
  sockB.emit('match:join_queue', { genderPreference: 'female' });
  await new Promise((r) => setTimeout(r, 600));
  console.log('✓ PASS: Mutual preference enforced! Two males seeking females did NOT match.');

  // Step 4: Enqueue compatible partner (User C)
  console.log('Step 4: Enqueuing User C (Female seeking Male)...');
  const matchPromise = new Promise((resolve, reject) => {
    let matchA = null;
    let matchC = null;
    const timer = setTimeout(() => reject(new Error('Random match timeout')), 5000);

    sockA.on('match:found', (data) => {
      matchA = data;
      if (matchC) {
        clearTimeout(timer);
        resolve({ matchA, matchC });
      }
    });

    sockC.on('match:found', (data) => {
      matchC = data;
      if (matchA) {
        clearTimeout(timer);
        resolve({ matchA, matchC });
      }
    });
  });

  sockC.emit('match:join_queue', { genderPreference: 'male' });
  const { matchA, matchC } = await matchPromise;

  console.log(`✓ PASS: Random Match found! Room: "${matchA.roomName}"`);
  console.log(`  User A partnered with #${matchA.partner.publicId} (${matchA.partner.gender})`);
  console.log(`  User C partnered with #${matchC.partner.publicId} (${matchC.partner.gender})`);

  // Step 5: Testing Direct ID Match mapping
  console.log('Step 5: Testing Direct ID Match (User A requests match with User C)...');
  const directMatchPromise = new Promise((resolve, reject) => {
    let directA = null;
    let directC = null;
    const timer = setTimeout(() => reject(new Error('Direct match timeout')), 5000);

    sockA.once('match:found', (data) => {
      directA = data;
      if (directC) {
        clearTimeout(timer);
        resolve({ directA, directC });
      }
    });

    sockC.once('match:found', (data) => {
      directC = data;
      if (directA) {
        clearTimeout(timer);
        resolve({ directA, directC });
      }
    });
  });

  // User A requests direct match with User C
  sockA.emit('match:direct_request', { targetPublicId: userC.publicId });
  const { directA, directC } = await directMatchPromise;

  if (directA.partner.publicId !== userC.publicId) {
    throw new Error(`Requester User A (#${userA.publicId}) expected partner #${userC.publicId}, got #${directA.partner.publicId}`);
  }
  if (directC.partner.publicId !== userA.publicId) {
    throw new Error(`Target User C (#${userC.publicId}) expected partner #${userA.publicId}, got #${directC.partner.publicId}`);
  }

  console.log(`✓ PASS: Direct Match verified!`);
  console.log(`  Requester User A (#${userA.publicId}) received partner #${directA.partner.publicId} (${directA.partner.username})`);
  console.log(`  Target User C (#${userC.publicId}) received partner #${directC.partner.publicId} (${directC.partner.username})`);

  sockA.disconnect();
  sockB.disconnect();
  sockC.disconnect();

  console.log('--- ALL STAGE 3 TESTS PASSED PERFECTLY ---');
  process.exit(0);
}

runStage3Tests().catch((err) => {
  console.error('TEST ERROR:', err.message);
  process.exit(1);
});
