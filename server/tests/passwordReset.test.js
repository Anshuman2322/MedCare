import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin } from './helpers.js';

const sendEmailTo = jest.fn().mockResolvedValue({ id: 'test' });
let emailConfigured = true;

jest.unstable_mockModule('../utils/sendEmail.js', () => ({
  sendEmail: jest.fn(),
  sendEmailTo,
  isEmailConfigured: () => emailConfigured,
}));

let app;
let Admin;
let PasswordReset;

const EMAIL = 'admin@test.local';
const OLD_PASSWORD = 'Passw0rd!23';
const NEW_PASSWORD = 'N3wSecret!45';
const INVALID_CODE = 'That code is incorrect or has expired.';

// Rate limiters key on the client IP; a fresh one per test keeps them independent.
let clientIp;
let ipCounter = 0;

const post = (path, body) =>
  request(app).post(`/api/auth/${path}`).set('X-Forwarded-For', clientIp).send(body);

async function waitForEmails(count) {
  const deadline = Date.now() + 3000;
  while (sendEmailTo.mock.calls.length < count && Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
  expect(sendEmailTo.mock.calls.length).toBeGreaterThanOrEqual(count);
}

// Forgot-password does its work after responding, so "nothing was sent" can only
// be observed by giving that background work time to have happened.
const settle = () => new Promise((resolve) => { setTimeout(resolve, 200); });

const otpFromEmail = (index = sendEmailTo.mock.calls.length - 1) =>
  sendEmailTo.mock.calls[index][0].text.match(/code is (\d{6})/)[1];

async function requestCode(expectedEmails = 1) {
  await post('forgot-password', { email: EMAIL });
  await waitForEmails(expectedEmails);
  return otpFromEmail();
}

async function verifiedToken() {
  const otp = await requestCode();
  const res = await post('verify-reset-otp', { email: EMAIL, otp });
  return res.body.resetToken;
}

const expireCooldown = () =>
  PasswordReset.updateOne({ email: EMAIL }, { $set: { lastSentAt: new Date(Date.now() - 120_000) } });

const wrongCode = (otp) => (otp === '000000' ? '000001' : '000000');

beforeAll(async () => {
  await startTestDb();
  ({ default: app } = await import('../app.js'));
  ({ default: Admin } = await import('../models/Admin.js'));
  ({ default: PasswordReset } = await import('../models/PasswordReset.js'));
  await PasswordReset.init();
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  ipCounter += 1;
  clientIp = `10.20.0.${ipCounter}`;
  emailConfigured = true;
  sendEmailTo.mockClear();
  await createTestAdmin({ email: EMAIL, password: OLD_PASSWORD });
});

afterEach(async () => {
  await clearCollections();
});

describe('POST /api/auth/forgot-password', () => {
  it('emails a code to the account and never returns or stores it in plain text', async () => {
    const res = await post('forgot-password', { email: EMAIL });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/\b\d{6}\b/);

    await waitForEmails(1);
    expect(sendEmailTo.mock.calls[0][0].to).toBe(EMAIL);

    const otp = otpFromEmail();
    const record = await PasswordReset.findOne({ email: EMAIL });
    expect(record.otpHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(record)).not.toContain(otp);
  });

  it('answers identically for an unknown email and sends nothing', async () => {
    const known = await post('forgot-password', { email: EMAIL });
    await waitForEmails(1);
    sendEmailTo.mockClear();

    const unknown = await post('forgot-password', { email: 'nobody@test.local' });
    await settle();

    expect(unknown.status).toBe(known.status);
    expect(unknown.body).toEqual(known.body);
    expect(sendEmailTo).not.toHaveBeenCalled();
    expect(await PasswordReset.countDocuments({ email: 'nobody@test.local' })).toBe(0);
  });

  it('rejects a malformed email', async () => {
    const res = await post('forgot-password', { email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('returns 503 when email delivery is not configured', async () => {
    emailConfigured = false;
    const res = await post('forgot-password', { email: EMAIL });
    expect(res.status).toBe(503);
  });

  it('returns 503 while the database is unreachable', async () => {
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, get: () => 0 });
    try {
      const res = await post('forgot-password', { email: EMAIL });
      expect(res.status).toBe(503);
    } finally {
      delete mongoose.connection.readyState;
    }
  });

  it('silently ignores a resend inside the cooldown and keeps the first code valid', async () => {
    const otp = await requestCode();

    const second = await post('forgot-password', { email: EMAIL });
    await settle();

    expect(second.status).toBe(200);
    expect(sendEmailTo).toHaveBeenCalledTimes(1);

    const verify = await post('verify-reset-otp', { email: EMAIL, otp });
    expect(verify.status).toBe(200);
  });

  it('replaces the previous code once the cooldown has passed', async () => {
    const first = await requestCode();
    await expireCooldown();
    const second = await requestCode(2);

    if (first !== second) {
      const stale = await post('verify-reset-otp', { email: EMAIL, otp: first });
      expect(stale.status).toBe(400);
    }

    const fresh = await post('verify-reset-otp', { email: EMAIL, otp: second });
    expect(fresh.status).toBe(200);
  });

  it('stops sending once the hourly per-account quota is used', async () => {
    await requestCode();
    await PasswordReset.updateOne(
      { email: EMAIL },
      { $set: { sendCount: 5, lastSentAt: new Date(Date.now() - 120_000) } }
    );
    sendEmailTo.mockClear();

    await post('forgot-password', { email: EMAIL });
    await settle();
    expect(sendEmailTo).not.toHaveBeenCalled();
  });

  it('restores the quota after the hourly window lapses', async () => {
    await requestCode();
    await PasswordReset.updateOne(
      { email: EMAIL },
      {
        $set: {
          sendCount: 5,
          lastSentAt: new Date(Date.now() - 120_000),
          sendWindowStartedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      }
    );
    sendEmailTo.mockClear();

    await requestCode(1);
    expect((await PasswordReset.findOne({ email: EMAIL })).sendCount).toBe(1);
  });

  it('caps requests per IP', async () => {
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await post('forgot-password', { email: `user${i}@test.local` });
    }
    const res = await post('forgot-password', { email: EMAIL });
    expect(res.status).toBe(429);
  });
});

describe('POST /api/auth/verify-reset-otp', () => {
  it('exchanges the right code for a reset token', async () => {
    const otp = await requestCode();
    const res = await post('verify-reset-otp', { email: EMAIL, otp });
    expect(res.status).toBe(200);
    expect(res.body.resetToken).toMatch(/^[a-f0-9]{64}$/);

    const record = await PasswordReset.findOne({ email: EMAIL });
    expect(record.resetTokenHash).not.toBe(res.body.resetToken);
  });

  it('rejects a wrong code', async () => {
    const otp = await requestCode();
    const res = await post('verify-reset-otp', { email: EMAIL, otp: wrongCode(otp) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(INVALID_CODE);
  });

  it('gives an unknown email the same answer as a wrong code', async () => {
    const res = await post('verify-reset-otp', { email: 'nobody@test.local', otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(INVALID_CODE);
  });

  it('rejects an expired code', async () => {
    const otp = await requestCode();
    await PasswordReset.updateOne({ email: EMAIL }, { $set: { otpExpiresAt: new Date(Date.now() - 1000) } });
    const res = await post('verify-reset-otp', { email: EMAIL, otp });
    expect(res.status).toBe(400);
  });

  it('kills the code after too many wrong attempts, even if the next guess is right', async () => {
    const otp = await requestCode();
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await post('verify-reset-otp', { email: EMAIL, otp: wrongCode(otp) });
    }
    const res = await post('verify-reset-otp', { email: EMAIL, otp });
    expect(res.status).toBe(400);
  });

  it('cannot exceed the attempt limit with parallel guesses', async () => {
    const otp = await requestCode();
    await Promise.all(
      Array.from({ length: 12 }, () => post('verify-reset-otp', { email: EMAIL, otp: wrongCode(otp) }))
    );
    expect((await PasswordReset.findOne({ email: EMAIL })).attempts).toBe(5);
  });

  it('accepts a code only once', async () => {
    const otp = await requestCode();
    await post('verify-reset-otp', { email: EMAIL, otp });
    const second = await post('verify-reset-otp', { email: EMAIL, otp });
    expect(second.status).toBe(400);
  });

  it('rejects non-string codes such as query operators', async () => {
    const res = await post('verify-reset-otp', { email: EMAIL, otp: { $ne: null } });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('changes the password, and only the new one works afterwards', async () => {
    const resetToken = await verifiedToken();
    const res = await post('reset-password', { resetToken, password: NEW_PASSWORD });
    expect(res.status).toBe(200);

    const oldLogin = await post('login', { email: EMAIL, password: OLD_PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await post('login', { email: EMAIL, password: NEW_PASSWORD });
    expect(newLogin.status).toBe(200);
  });

  it('stores the new password hashed', async () => {
    const resetToken = await verifiedToken();
    await post('reset-password', { resetToken, password: NEW_PASSWORD });
    const admin = await Admin.findOne({ email: EMAIL });
    expect(admin.password).toMatch(/^\$2[ab]\$/);
  });

  it('sends a password-changed notice', async () => {
    const resetToken = await verifiedToken();
    await post('reset-password', { resetToken, password: NEW_PASSWORD });
    await waitForEmails(2);
    expect(sendEmailTo.mock.calls[1][0].subject).toMatch(/password was changed/i);
    expect(sendEmailTo.mock.calls[1][0].to).toBe(EMAIL);
  });

  it('signs out sessions created before the reset', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').set('X-Forwarded-For', clientIp).send({ email: EMAIL, password: OLD_PASSWORD });
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const resetToken = await verifiedToken();
    await post('reset-password', { resetToken, password: NEW_PASSWORD });

    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('keeps accepting sessions issued before token versioning existed', async () => {
    const admin = await Admin.findOne({ email: EMAIL });
    const legacy = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/auth/me').set('Cookie', `token=${legacy}`);
    expect(res.status).toBe(200);
  });

  it('clears an account lockout', async () => {
    await Admin.updateOne(
      { email: EMAIL },
      { $set: { failedLoginAttempts: 5, lockUntil: new Date(Date.now() + 60_000) } }
    );
    const resetToken = await verifiedToken();
    await post('reset-password', { resetToken, password: NEW_PASSWORD });

    const res = await post('login', { email: EMAIL, password: NEW_PASSWORD });
    expect(res.status).toBe(200);
  });

  it('cannot reuse a reset token', async () => {
    const resetToken = await verifiedToken();
    await post('reset-password', { resetToken, password: NEW_PASSWORD });
    const res = await post('reset-password', { resetToken, password: 'An0ther!Secret' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('RESET_SESSION_EXPIRED');
  });

  it('rejects an expired reset token', async () => {
    const resetToken = await verifiedToken();
    await PasswordReset.updateOne({ email: EMAIL }, { $set: { resetTokenExpiresAt: new Date(Date.now() - 1000) } });
    const res = await post('reset-password', { resetToken, password: NEW_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('RESET_SESSION_EXPIRED');
  });

  it('rejects a weak password without spending the token', async () => {
    const resetToken = await verifiedToken();
    const weak = await post('reset-password', { resetToken, password: 'weak' });
    expect(weak.status).toBe(400);

    const retry = await post('reset-password', { resetToken, password: NEW_PASSWORD });
    expect(retry.status).toBe(200);
  });

  it('refuses the current password without spending the token', async () => {
    const resetToken = await verifiedToken();
    const same = await post('reset-password', { resetToken, password: OLD_PASSWORD });
    expect(same.status).toBe(400);
    expect(same.body.error).toMatch(/different/i);

    const retry = await post('reset-password', { resetToken, password: NEW_PASSWORD });
    expect(retry.status).toBe(200);
  });

  it('refuses a password shaped like a bcrypt hash', async () => {
    const resetToken = await verifiedToken();
    const res = await post('reset-password', { resetToken, password: '$2a$Abcdef1!' });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed token', async () => {
    const res = await post('reset-password', { resetToken: { $ne: null }, password: NEW_PASSWORD });
    expect(res.status).toBe(400);
  });
});
