import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

async function promoteAdmin() {
  const targetEmail = (process.env.ADMIN_EMAIL || 'admin@cureneed.com').toLowerCase();

  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || 'medcare' });

    const admin = await Admin.findOne({ email: targetEmail });

    if (!admin) {
      console.log('Admin not found');
      process.exit(1);
    }

    admin.role = 'super_admin';
    await admin.save();

    console.log('Admin promoted to super_admin successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error promoting admin:', error.message);
    process.exit(1);
  }
}

promoteAdmin();
