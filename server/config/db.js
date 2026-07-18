import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export async function connectDB({ required = true } = {}) {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    const error = new Error('MONGO_URI is missing');
    if (required) {
      throw error;
    }
    console.warn(error.message);
    return false;
  }

  try {
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'medcare' });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection error', error);
    if (required) {
      throw error;
    }

    console.warn('Continuing without MongoDB. Set a reachable MONGO_URI to enable database-backed routes.');
    return false;
  }
}
