require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Connected to database');

  const existing = await User.findOne({ email: 'admin@jawara.com' });
  if (existing) {
    console.log('Admin user already exists');
    process.exit(0);
  }

  await User.create({
    name: 'Administrator',
    email: 'admin@jawara.com',
    password: 'admin123',
    phone: '08123456789',
    role: 'admin'
  });

  console.log('✅ Admin user created:');
  console.log('   Email   : admin@jawara.com');
  console.log('   Password: admin123');
  console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
