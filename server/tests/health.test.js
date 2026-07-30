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

describe('GET /api/health', () => {
  it('reports ok and a connected database', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.db).toBe('connected');
    expect(typeof res.body.uptime).toBe('number');
  });
});
