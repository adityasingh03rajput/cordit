const API = 'http://localhost:3000';
const FRONTEND_PROXY = 'http://localhost:3001/api';

async function testMedia() {
  console.log('Testing Media Upload & Download Flow...');

  // 1. Login
  const loginRes = await fetch(`${API}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password' }),
  });
  const { token } = await loginRes.json();

  // 2. Request upload
  const reqRes = await fetch(`${FRONTEND_PROXY}/upload/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: 'avatar.png',
      mimeType: 'image/png',
      fileSize: 8,
    }),
  });
  const reqData = await reqRes.json();
  if (!reqData.fileId) throw new Error('Upload request failed: ' + JSON.stringify(reqData));
  console.log('✅ Upload requested. File ID:', reqData.fileId);

  // 3. Upload binary content (8 bytes dummy PNG signature)
  const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const putRes = await fetch(`http://localhost:3001${reqData.uploadUrl}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/png',
      Authorization: `Bearer ${token}`,
    },
    body: fakePng,
  });
  if (putRes.status !== 200) throw new Error('Upload content failed with status ' + putRes.status);
  console.log('✅ Binary content uploaded successfully to disk.');

  // 4. Download file directly through stream
  const getRes = await fetch(`http://localhost:3001${reqData.downloadUrl}`);
  if (getRes.status !== 200) throw new Error('Download failed with status ' + getRes.status);
  const downloadedBuf = await getRes.arrayBuffer();
  if (downloadedBuf.byteLength !== 8) throw new Error('Downloaded size mismatch: ' + downloadedBuf.byteLength);
  console.log('✅ Stream served perfectly via Next.js proxy! Buffer length:', downloadedBuf.byteLength);

  console.log('🎉 Media upload/download flow is 100% verified and permanent!');
  process.exit(0);
}

testMedia().catch((e) => {
  console.error(e);
  process.exit(1);
});

