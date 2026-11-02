import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'local_mongodb_data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Initializing local standalone MongoDB on port 27017...');

try {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbPath: dataDir,
      storageEngine: 'wiredTiger',
    },
  });

  console.log('Local MongoDB is running successfully!');
  console.log('Connection URI:', mongod.getUri());
} catch (err) {
  console.error('Error starting local MongoDB:', err);
}

