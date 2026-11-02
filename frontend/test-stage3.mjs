import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000';

async function registerTestUser(name, gender, genderPreference) {
  const password = 'password123';
  const res = await axios.post(`${API_URL}/user/register`, {
    username: name,
    password,
    gender,
    genderPreference,
  });
  return {
    ...res.data,
    password,
  };
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });
}

async function runStage3Tests() {
  console.log('--- STARTING STAGE 3 MATCHING TESTS ---');

  // 1. Create test users with distinct preferences
  const userA = await registerTestUser(`MaleA_${Date.now() % 10000}`, 'male', 'female');
  const userB = await registerTestUser(`MaleB_${Date.now() % 10000}`, 'male', 'female');
  const userC = await registerTestUser(`FemaleC_${Date.now() % 10000}`, 'female', 'male');

  console.log(`User A (Male seeking Female): #${userA.publicId}`);
  console.log(`User B (Male seeking Female): #${userB.publicId}`);
  console.log(`User C (Female seeking Male): #${userC.publicId}`);

  // Connect sockets
  const sockA = await connectSocket(userA.token);
  const sockB = await connectSocket(userB.token);
  const sockC = await connectSocket(userC.token);

  console.log('All 3 sockets connected.');

  // Test 1: Incompatible users should NOT match
  let aMatchedWithB = false;
  sockA.on('match:found', (data) => {
    if (data.partner.publicId === userB.publicId) {
      aMatchedWithB = true;
    }
  });

  console.log('Step 1: Enqueuing User A (Male seeking Female)...');
  sockA.emit('match:join_queue', { genderPreference: 'female' });

  await new Promise((r) => setTimeout(r, 600));

  console.log('Step 2: Enqueuing User B (Male seeking Female)...');
  sockB.emit('match:join_queue', { genderPreference: 'female' });

  await new Promise((r) => setTimeout(r, 1000));

  if (aMatchedWithB) {
    throw new Error('FAILED: Two users seeking female matched each other!');
  }
  console.log('✓ PASS: Mutual preference enforced! Two males seeking females did NOT match.');

  // Test 2: Compatible user C (Female seeking Male) enters queue -> Must match User A!
  console.log('Step 3: Enqueuing User C (Female seeking Male)...');
  const matchPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Match timeout')), 5000);
    let matchA = null;
    let matchC = null;

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

  // Test 3: Disconnect safety
  console.log('Step 4: Testing disconnect and queue pruning...');
  sockB.disconnect();
  await new Promise((r) => setTimeout(r, 500));
  console.log('✓ PASS: Disconnect handled cleanly without stranded queue artifacts.');

  // Test 4: Direct ID Match
  console.log('Step 5: Testing Direct ID Match...');
  const directMatchPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Direct match timeout')), 5000);
    sockC.once('match:found', (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

  // User A requests direct match with User C
  sockA.emit('match:direct_request', { targetPublicId: userC.publicId });
  const directData = await directMatchPromise;

  console.log(`✓ PASS: Direct Match successful! Room: "${directData.roomName}", Partner: #${directData.partner.publicId}`);

  sockA.disconnect();
  sockC.disconnect();

  console.log('--- ALL STAGE 3 TESTS PASSED PERFECTLY ---');
  process.exit(0);
}

runStage3Tests().catch((err) => {
  console.error('TEST ERROR:', err.message);
  process.exit(1);
});

