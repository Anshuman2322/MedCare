import request from 'supertest';
import { startTestDb, stopTestDb } from './setup.js';

let app;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeAll(async () => {
  await startTestDb();
  // app.js reads NODE_ENV at import time to decide whether to mount
  // /api/test at all, so it must be set to 'production' BEFORE the dynamic
  // import below. Jest gives each test file its own isolated module
  // registry, so this evaluates a fresh copy of app.js independent of
  // every other test file's already-imported instance.
  process.env.NODE_ENV = 'production';
  ({ default: app } = await import('../app.js'));
});

afterAll(async () => {
  // The suite runs with --runInBand (single process, files run serially),
  // and process.env is a real process-wide global — leaving this set would
  // leak into every test file imported afterward.
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  await stopTestDb();
});

describe('GET /api/test/email (production)', () => {
  it('404s — the route is never mounted in production', async () => {
    const res = await request(app).get('/api/test/email');
    expect(res.status).toBe(404);
  });
});
