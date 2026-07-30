import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from './logger.js';

dotenv.config();

export async function connectDB({ required = true } = {}) {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    const error = new Error('MONGO_URI is missing');
    if (required) {
      throw error;
    }
    logger.warn(error.message);
    return false;
  }

  try {
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'medcare' });
    logger.info('MongoDB connected');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error');
    if (required) {
      throw error;
    }

    logger.warn('Continuing without MongoDB. Set a reachable MONGO_URI to enable database-backed routes.');
    return false;
  }
}
