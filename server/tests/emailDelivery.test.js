import { jest } from '@jest/globals';
import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin, createTestMedicine } from './helpers.js';

// Mocks only the provider SDK, so the real routing and error handling are exercised.
const send = jest.fn();

jest.unstable_mockModule('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const FROM = 'CureNeed <no-reply@mail.test.local>';
const ADMIN_INBOX = 'admin-inbox@test.local';
const BUSINESS_INBOX = 'business-inbox@test.local';
const CRM_INBOX = 'crm-inbox@test.local';
const ACCOUNT = 'account-owner@test.local';
const ACCEPTED = { data: { id: 'accepted' }, error: null };
const REJECTED = { data: null, error: { name: 'validation_error', message: 'The domain is not verified.' } };

let app;
let PasswordReset;
let clientIp;
let ipCounter = 0;

const post = (url, body) => request(app).post(url).set('X-Forwarded-For', clientIp).send(body);
const pause = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

async function waitUntil(condition) {
  const deadline = Date.now() + 3000;
  // eslint-disable-next-line no-await-in-loop
  while (!(await condition()) && Date.now() < deadline) await pause(10);
  expect(await condition()).toBeTruthy();
}

const waitForSends = (count) => waitUntil(() => send.mock.calls.length >= count);
const contactBody = { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there' };

beforeAll(async () => {
  await startTestDb();
  Object.assign(process.env, {
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM: FROM,
    ADMIN_EMAIL: ADMIN_INBOX,
    BUSINESS_EMAIL: BUSINESS_INBOX,
    CRM_EMAIL: CRM_INBOX,
  });
  ({ default: app } = await import('../app.js'));
  ({ default: PasswordReset } = await import('../models/PasswordReset.js'));
  await PasswordReset.init();
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(() => {
  ipCounter += 1;
  clientIp = `10.30.0.${ipCounter}`;
  send.mockReset();
  send.mockResolvedValue(ACCEPTED);
});

afterEach(async () => {
  await clearCollections();
});

const inquiryBody = (medicineId, customer = {}) => ({
  medicineId,
  customer: { name: 'Jane Doe', city: 'Metropolis', email: 'jane@example.com', phone: '9876543210', ...customer },
  product: { quantity: 3, packagingType: 'strip', strength: '100 mg', brand: 'Test' },
  notes: 'Need delivery in 2 weeks',
});

// Every email the provider was asked to send, by recipient.
const sentTo = (address) => send.mock.calls.map(([message]) => message).filter((message) => message.to === address);

describe('notification routing', () => {
  // BUSINESS_EMAIL / CRM_EMAIL stay set in this suite on purpose: old
  // configs that still define them must not get any mail.
  it('sends contact messages to ADMIN_EMAIL only, with the customer as reply-to', async () => {
    const res = await post('/api/contact', contactBody);
    expect(res.status).toBe(201);

    await waitForSends(1);
    await pause(50);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({ from: FROM, to: ADMIN_INBOX, replyTo: contactBody.email });
    expect(send.mock.calls[0][0].cc).toBeUndefined();
  });

  it('sends support-chat handoffs to ADMIN_EMAIL only', async () => {
    const session = await request(app).post('/api/chat/session').send({});
    const res = await post('/api/chat/handoff', {
      sessionToken: session.body.sessionToken,
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Please call me about bulk pricing',
    });
    expect(res.status).toBe(201);

    await waitForSends(1);
    await pause(50);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({ to: ADMIN_INBOX, replyTo: 'jane@example.com' });
    expect(send.mock.calls[0][0].cc).toBeUndefined();
  });

  it('sends an inquiry to ADMIN_EMAIL only and a thank-you with its details to the customer', async () => {
    const medicine = await createTestMedicine();
    const res = await post('/api/inquiries', inquiryBody(medicine._id.toString()));
    expect(res.status).toBe(201);
    expect(res.body.confirmationEmail).toBe(true);

    await waitForSends(2);
    await pause(50);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.every(([message]) => message.cc === undefined)).toBe(true);
    expect(send.mock.calls.every(([message]) => [ADMIN_INBOX, 'jane@example.com'].includes(message.to))).toBe(true);

    const [team] = sentTo(ADMIN_INBOX);
    expect(team).toMatchObject({ from: FROM, replyTo: 'jane@example.com' });
    expect(team.subject).toBe(`New Inquiry ${res.body.referenceId} — CureNeed`);

    const [receipt] = sentTo('jane@example.com');
    expect(receipt).toMatchObject({ from: FROM, replyTo: ADMIN_INBOX });
    expect(receipt.subject).toBe(`Thank you for your inquiry (${res.body.referenceId}) — CureNeed`);
    for (const detail of [res.body.referenceId, 'Jane Doe', medicine.name, '3 strips', '$10.00 per strip', '$30.00', 'Need delivery in 2 weeks', '9876543210']) {
      expect(receipt.html).toContain(detail);
      expect(receipt.text).toContain(detail);
    }
    expect(receipt.html).toContain(`https://www.cureneed.com/medicine/${medicine.slug}`);
    expect(receipt.html).toContain('View product');
  });

  it('links products to PUBLIC_SITE_URL when it is set', async () => {
    const medicine = await createTestMedicine();
    process.env.PUBLIC_SITE_URL = 'https://shop.example.com/';
    try {
      await post('/api/inquiries', inquiryBody(medicine._id.toString()));
      await waitForSends(2);
      expect(sentTo('jane@example.com')[0].html).toContain(`https://shop.example.com/medicine/${medicine.slug}`);
    } finally {
      delete process.env.PUBLIC_SITE_URL;
    }
  });

  it('emails only the team when the customer left just a phone number', async () => {
    const medicine = await createTestMedicine();
    const res = await post('/api/inquiries', inquiryBody(medicine._id.toString(), { email: '' }));
    expect(res.status).toBe(201);
    expect(res.body.confirmationEmail).toBe(false);

    await waitForSends(1);
    await pause(50);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].to).toBe(ADMIN_INBOX);
    expect(send.mock.calls[0][0]).not.toHaveProperty('replyTo');
    expect(send.mock.calls[0][0].html).toContain('No email given');
  });

  it('confirms a multi-medicine request with every line and the listed subtotal', async () => {
    const first = await createTestMedicine({ slug: 'first-med', name: 'First Med', variants: [{ strength: '10 mg', form: 'Tablet', packSize: '10 tablets', packagingType: 'Strip', price: 4, stock: 5 }] });
    const second = await createTestMedicine({ slug: 'second-med', name: 'Second Med', variants: [{ strength: '5 ml', form: 'Eye Drops', packSize: '5 ml Bottle', packagingType: 'Bottle', price: 16.8, stock: 5 }] });
    const res = await post('/api/inquiries/bulk', {
      requestType: 'best_price',
      customer: { name: 'Sam Lee', city: 'Sydney', email: 'sam@example.com' },
      items: [
        { medicineId: first._id.toString(), quantity: 10 },
        { medicineId: second._id.toString(), quantity: 3 },
      ],
    });
    expect(res.status).toBe(201);

    await waitForSends(2);
    const [receipt] = sentTo('sam@example.com');
    expect(receipt.subject).toBe(`Thank you for your best-price request (${res.body.referenceId}) — CureNeed`);
    for (const detail of ['First Med', '10 strips', '$40.00', 'Second Med', '3 bottles', '$50.40', '$90.40', 'Sydney']) {
      expect(receipt.html).toContain(detail);
    }
    expect(sentTo(ADMIN_INBOX)[0].subject).toBe(`New Best-Price Request ${res.body.referenceId} — CureNeed`);
  });

  it('escapes what the customer typed', async () => {
    const medicine = await createTestMedicine();
    await post('/api/inquiries', {
      ...inquiryBody(medicine._id.toString(), { name: '<img src=x onerror=alert(1)>' }),
      notes: '<a href="https://evil.test">click</a>',
    });

    await waitForSends(2);
    for (const [message] of send.mock.calls) {
      expect(message.html).not.toContain('<img src=x');
      expect(message.html).not.toContain('<a href="https://evil.test"');
      expect(message.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    }
  });

  it("keeps the inquiry and the team's email when the customer's confirmation is rejected", async () => {
    send.mockImplementation(async (message) => (message.to === ADMIN_INBOX ? ACCEPTED : REJECTED));
    const medicine = await createTestMedicine();
    const res = await post('/api/inquiries', inquiryBody(medicine._id.toString()));
    expect(res.status).toBe(201);

    await waitForSends(2);
    expect(sentTo(ADMIN_INBOX)).toHaveLength(1);
  });

  it('keeps the customer submission when the provider rejects its notification', async () => {
    send.mockResolvedValue(REJECTED);
    const res = await post('/api/contact', contactBody);
    expect(res.status).toBe(201);
    await waitForSends(1);
  });
});

describe('password reset emails', () => {
  it('sends the code and the confirmation to the account, not to a team inbox', async () => {
    await createTestAdmin({ email: ACCOUNT });

    await post('/api/auth/forgot-password', { email: ACCOUNT });
    await waitForSends(1);
    expect(send.mock.calls[0][0]).toMatchObject({ from: FROM, to: ACCOUNT });
    const otp = send.mock.calls[0][0].text.match(/code is (\d{6})/)[1];

    const verified = await post('/api/auth/verify-reset-otp', { email: ACCOUNT, otp });
    await post('/api/auth/reset-password', { resetToken: verified.body.resetToken, password: 'N3wSecret!45' });

    await waitForSends(2);
    expect(send.mock.calls[1][0]).toMatchObject({ from: FROM, to: ACCOUNT });
    expect(send.mock.calls[1][0].subject).toMatch(/password was changed/i);
  });
});

describe('provider failures', () => {
  it('gives up on a provider that never responds', async () => {
    const { sendEmailTo } = await import('../utils/sendEmail.js');
    send.mockReturnValue(new Promise(() => {}));

    jest.useFakeTimers();
    try {
      const assertion = expect(sendEmailTo({ to: ACCOUNT, subject: 's', text: 't' })).rejects.toThrow(/did not respond/);
      await jest.advanceTimersByTimeAsync(10_000);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });

  // Last in this file: it deliberately leaves the module's delivery hold active.
  it('withdraws an undelivered code, refunds the quota and stops promising codes', async () => {
    await createTestAdmin({ email: ACCOUNT });
    send.mockResolvedValueOnce(REJECTED);

    const first = await post('/api/auth/forgot-password', { email: ACCOUNT });
    expect(first.status).toBe(200);

    await waitUntil(async () => (await PasswordReset.findOne({ email: ACCOUNT }))?.otpHash === null);
    expect((await PasswordReset.findOne({ email: ACCOUNT })).sendCount).toBe(0);
    await pause(50);

    const known = await post('/api/auth/forgot-password', { email: ACCOUNT });
    const unknown = await post('/api/auth/forgot-password', { email: 'nobody@test.local' });
    expect(known.status).toBe(503);
    expect(unknown.status).toBe(503);
    expect(unknown.body).toEqual(known.body);
    expect(send).toHaveBeenCalledTimes(1);

    const later = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 3 * 60 * 1000);
    try {
      const retry = await post('/api/auth/forgot-password', { email: ACCOUNT });
      expect(retry.status).toBe(200);
      await waitForSends(2);
    } finally {
      later.mockRestore();
    }
  });
});
