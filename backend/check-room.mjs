import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/cordit');
  const rooms = await mongoose.connection.collection('rooms').find({}).sort({ updatedAt: -1 }).limit(5).toArray();
  for (const r of rooms) {
    console.log({
      _id: r._id.toString(),
      name: r.name,
      roomType: r.roomType,
      participants: r.participants?.map(p => p.toString()),
      observers: r.observers?.map(o => o.toString()),
      activeUsers: r.activeUsers?.map(u => ({ username: u.username, publicId: u.publicId, role: u.role }))
    });
  }
  const users = await mongoose.connection.collection('users').find({}).toArray();
  for (const u of users) {
    if (['user1', 'user2', 'user123'].includes(u.username)) {
      console.log('User in DB:', u.username, u._id.toString(), u.publicId);
    }
  }
  await mongoose.disconnect();
}
run().catch(console.error);

