import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is missing');
  }

  try {
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'medcare' });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error', error);
    throw error;
  }
}
