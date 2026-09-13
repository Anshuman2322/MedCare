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

// express-rate-limit keys by IP, and every request here originates from the
// same in-process supertest connection — so within a describe block the
// limiter's counter genuinely accumulates across `it`s, same as it would
// across real requests in a 15-minute window. Ordering below is deliberate.
describe('authLimiter (/api/auth/login)', () => {
  it('does not count successful logins toward the limit (skipSuccessfulRequests)', async () => {
    await createTestAdmin({ email: 'success@test.local', password: 'Passw0rd!23' });

    // AUTH_RATE_LIMIT_MAX defaults to 20 — prove successes are excluded by
    // sending more than that and confirming none of them ever 429. Runs
    // first so the limiter's counter is still effectively untouched for the
    // failure test below.
    for (let i = 0; i < 25; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'success@test.local', password: 'Passw0rd!23' });
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 on the 21st failed attempt within the window', async () => {
    // A distinct, nonexistent account per request avoids the separate
    // per-account lockout (423 after 5 fails on one account) so every
    // response here is a plain 401 right up until the IP-based limiter
    // itself intercepts request 21 before the route handler even runs.
    for (let i = 0; i < 20; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `nobody${i}@test.local`, password: 'WrongPass!23' });
      expect(res.status).toBe(401);
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody-final@test.local', password: 'WrongPass!23' });
    expect(res.status).toBe(429);
  });
});

describe('inquiryLimiter (/api/inquiries, /api/inquiry, /api/contact)', () => {
  it('returns 429 on the 31st submission within the window', async () => {
    // Missing medicineId fails validation fast (400, no DB write).
    // inquiryLimiter sets neither skip option, so failed requests count
    // toward the cap exactly like successful ones do.
    for (let i = 0; i < 30; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app).post('/api/inquiries').send({});
      expect(res.status).toBe(400);
    }

    const res = await request(app).post('/api/inquiries').send({});
    expect(res.status).toBe(429);
  });

  it('shares the same quota with /api/contact', async () => {
    // app.js mounts the exact same inquiryLimiter instance on /api/inquiries,
    // /api/inquiry, and /api/contact — not three separate-but-identical
    // limiters. The previous test already exhausted the quota for this IP,
    // so a fresh request against /api/contact should be blocked immediately,
    // proving the cap is shared rather than per-route.
    const res = await request(app).post('/api/contact').send({});
    expect(res.status).toBe(429);
  });
});
