import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin } from './helpers.js';

// Production safety nets: an outage must look like an outage, public endpoints
// accept only what they should, and the dormant orders endpoint is gone.

// Cloudinary is replaced so uploads never leave the machine.
const uploadStream = jest.fn((_options, done) => {
  const sink = { write() {}, end() {}, on() { return sink; }, once() { return sink; }, emit() {}, removeListener() {} };
  setImmediate(() => done(null, { secure_url: 'https://res.cloudinary.com/demo/image/upload/medcare/x.webp' }));
  return sink;
});
jest.unstable_mockModule('../config/cloudinary.js', () => ({ default: { uploader: { upload_stream: uploadStream }, config: () => ({}) } }));

const PASSWORD = 'Passw0rd!23';
let app;

beforeAll(async () => {
  await startTestDb();
  ({ default: app } = await import('../app.js'));
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  jest.restoreAllMocks();
  process.env.NODE_ENV = 'test';
  await clearCollections();
});

describe('database outage in production', () => {
  it('answers 503 instead of serving sample data, and keeps the health check honest', async () => {
    process.env.NODE_ENV = 'production';
    // readyState is a read-only accessor, so flip the field behind it (no events fire).
    const connected = mongoose.connection._readyState;
    mongoose.connection._readyState = 0;
    try {
      for (const path of ['/api/medicines', '/api/medicines/some-slug', '/api/categories', '/api/admin/dashboard']) {
        const res = await request(app).get(path);
        expect(res.status).toBe(503);
        expect(res.body).toEqual({ error: 'Service temporarily unavailable. Please try again shortly.' });
      }

      const health = await request(app).get('/api/health');
      expect(health.status).toBe(200);
      expect(health.body).toMatchObject({ ok: true, db: 'disconnected' });
    } finally {
      mongoose.connection._readyState = connected;
    }
  });

  it('does not get in the way while the database is connected', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/api/medicines');
    expect(res.status).toBe(200);
  });
});

describe('dormant endpoints', () => {
  it('no longer exposes a public orders endpoint', async () => {
    expect((await request(app).post('/api/orders').send({ customerName: 'x' })).status).toBe(404);
    expect((await request(app).get('/api/orders')).status).toBe(404);
  });

  it('is not diagnostics-friendly in production', async () => {
    process.env.NODE_ENV = 'production';
    expect((await request(app).post('/api/test/email').send({})).status).toBe(404);
  });
});

describe('request size limits', () => {
  it('rejects a JSON body over 1 MB on public endpoints', async () => {
    const res = await request(app).post('/api/contact').send({ name: 'x', email: 'a@b.co', message: 'y'.repeat(1.2 * 1024 * 1024) });
    expect(res.status).toBe(413);
  });
});

describe('image upload', () => {
  async function adminAgent() {
    await createTestAdmin({ email: 'uploader@test.local', password: PASSWORD });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'uploader@test.local', password: PASSWORD });
    return agent;
  }
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

  it('needs an admin', async () => {
    const res = await request(app).post('/api/upload').attach('image', png, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });

  it('refuses anything that is not an image', async () => {
    const admin = await adminAgent();
    const res = await admin.post('/api/upload').attach('image', Buffer.from('<?php echo 1;'), { filename: 'shell.php', contentType: 'application/x-php' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPEG, PNG, WebP or GIF/);
    expect(uploadStream).not.toHaveBeenCalled();
  });

  it('accepts an image and returns its Cloudinary URL', async () => {
    const admin = await adminAgent();
    const res = await admin.post('/api/upload').attach('image', png, { filename: 'pack.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(uploadStream).toHaveBeenCalledTimes(1);
  });
});
