import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin } from './helpers.js';

let app;

beforeAll(async () => {
  await startTestDb();
  ({ default: app } = await import('../app.js'));
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearCollections();
});

describe('POST /api/auth/login', () => {
  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'Passw0rd!23' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('logs in with correct credentials and sets a cookie', async () => {
    await createTestAdmin({ email: 'admin@test.local', password: 'Passw0rd!23' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'Passw0rd!23' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects the wrong password without leaking whether the email exists', async () => {
    await createTestAdmin({ email: 'admin@test.local', password: 'Passw0rd!23' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: 'WrongPass!23' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('locks the account after repeated failed attempts', async () => {
    await createTestAdmin({ email: 'admin@test.local', password: 'Passw0rd!23' });
    const agent = request(app);

    // LOGIN_MAX_ATTEMPTS is 5 in the test env (tests/setup.js)
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await agent.post('/api/auth/login').send({ email: 'admin@test.local', password: 'WrongPass!23' });
    }

    const res = await agent.post('/api/auth/login').send({ email: 'admin@test.local', password: 'Passw0rd!23' });
    expect(res.status).toBe(423);
    expect(res.body.error).toMatch(/locked/i);
  });
});

describe('GET /api/auth/me', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the logged-in admin using the session cookie', async () => {
    await createTestAdmin({ email: 'admin@test.local', password: 'Passw0rd!23' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@test.local', password: 'Passw0rd!23' });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.admin.email).toBe('admin@test.local');
  });
});
