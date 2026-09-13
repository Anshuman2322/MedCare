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

describe('CORS', () => {
  it('rejects a request from a non-allowlisted origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://not-an-allowed-origin.example');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not allowed by cors/i);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows a request from an allowlisted origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
