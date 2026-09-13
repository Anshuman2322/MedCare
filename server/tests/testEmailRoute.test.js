import request from 'supertest';
import { startTestDb, stopTestDb } from './setup.js';

let app;

beforeAll(async () => {
  await startTestDb();
  ({ default: app } = await import('../app.js'));
});

afterAll(async () => {
  await stopTestDb();
});

describe('GET /api/test/email (non-production)', () => {
  it('requires a valid admin session — 401 without one', async () => {
    const res = await request(app).get('/api/test/email');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Not authorized');
  });
});
