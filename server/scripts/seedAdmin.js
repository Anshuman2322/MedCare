import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import { connectDB } from '../config/db.js';

dotenv.config();

async function seedAdmin() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@cureneed.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const role = 'super_admin';

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  await Admin.create({ email, password, role });
  console.log(`Admin user created: ${email}`);
}

seedAdmin()
  .then(() => {
    console.log('Admin seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed admin', error);
    process.exit(1);
  });
