import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-for-production-use-1234567890';
process.env.JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';
process.env.LOGIN_MAX_ATTEMPTS = process.env.LOGIN_MAX_ATTEMPTS || '5';
process.env.LOGIN_LOCKOUT_MINUTES = process.env.LOGIN_LOCKOUT_MINUTES || '15';
process.env.BCRYPT_SALT_ROUNDS = '4'; // keep test hashing fast; production default (12) is set separately

// Several config modules call dotenv.config() at import time, which would
// otherwise pull real third-party credentials from server/.env into the test
// process (and — as happened during development of this suite — actually hit
// the real Resend API on every inquiry test). dotenv never overrides an
// already-set var, so pre-setting these to empty/obviously-fake values here,
// before anything else is imported, keeps every external integration a no-op.
process.env.RESEND_API_KEY = '';
process.env.ADMIN_EMAIL = '';
process.env.TWILIO_ACCOUNT_SID = '';
process.env.TWILIO_AUTH_TOKEN = '';
process.env.TWILIO_WHATSAPP_FROM = '';
process.env.ADMIN_WHATSAPP_TO = '';
process.env.CLOUD_NAME = '';
process.env.CLOUD_API_KEY = '';
process.env.CLOUD_API_SECRET = '';

let mongoServer;

export async function startTestDb() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'medcare-test' });
}

export async function stopTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}
