import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set');
  process.exit(1);
}

const seeds = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'operator', password: 'operator123', role: 'operator' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  for (const data of seeds) {
    const exists = await User.findOne({ username: data.username });
    if (exists) {
      console.log(`  skip  "${data.username}" — already exists`);
      continue;
    }
    const user = new User(data);
    await user.save();
    console.log(`  created "${data.username}" (${data.role})`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
