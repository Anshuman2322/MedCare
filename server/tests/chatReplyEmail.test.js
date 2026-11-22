import { jest } from '@jest/globals';
import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin } from './helpers.js';

// A team reply reaches a visitor who has left the site by email; a visitor
// still on the site gets it only in the chat. The provider SDK is mocked.

const send = jest.fn();
jest.unstable_mockModule('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const ADMIN_INBOX = 'admin-inbox@test.local';
const PASSWORD = 'Passw0rd!23';
let app;
let ChatConversation;
let ChatMessage;

beforeAll(async () => {
  await startTestDb();
  Object.assign(process.env, { RESEND_API_KEY: 're_test_key', RESEND_FROM: 'CureNeed <no-reply@mail.test.local>', ADMIN_EMAIL: ADMIN_INBOX });
  ({ default: app } = await import('../app.js'));
  ({ default: ChatConversation } = await import('../models/ChatConversation.js'));
  ({ default: ChatMessage } = await import('../models/ChatMessage.js'));
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { id: 'accepted' }, error: null });
});

afterEach(async () => {
  await clearCollections();
});

const pause = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
const sentTo = (address) => send.mock.calls.map(([message]) => message).filter((message) => message.to === address);

async function setup() {
  await createTestAdmin({ email: 'agent@test.local', password: PASSWORD });
  const admin = request.agent(app);
  await admin.post('/api/auth/login').send({ email: 'agent@test.local', password: PASSWORD });

  const session = await request(app).post('/api/chat/session').send({});
  const sessionToken = session.body.sessionToken;
  await request(app)
    .post('/api/chat/handoff')
    .send({ sessionToken, name: 'Jane Doe', email: 'jane@example.com', message: 'Need 50 boxes' });
  const conversation = await ChatConversation.findOne().lean();
  return { admin, sessionToken, id: String(conversation._id) };
}

describe('team replies to a visitor who left', () => {
  it('only shows the reply in the chat while the visitor is on the site', async () => {
    const { admin, sessionToken, id } = await setup();
    await request(app).get('/api/chat/messages').query({ sessionToken });

    const thread = await admin.get(`/api/admin/chat/conversations/${id}`);
    expect(thread.body.conversation.visitorOnline).toBe(true);

    const reply = await admin.post(`/api/admin/chat/conversations/${id}/reply`).send({ text: 'Hi Jane, on it!' });
    expect(reply.body.emailing).toBe(false);
    await pause(50);
    expect(sentTo('jane@example.com')).toHaveLength(0);
  });

  it('emails the reply when the visitor has left, from the team inbox', async () => {
    const { admin, id } = await setup();
    await ChatConversation.updateOne({}, { $set: { visitorSeenAt: new Date(Date.now() - 5 * 60 * 1000) } });

    const thread = await admin.get(`/api/admin/chat/conversations/${id}`);
    expect(thread.body.conversation.visitorOnline).toBe(false);

    const reply = await admin.post(`/api/admin/chat/conversations/${id}/reply`).send({ text: 'Hi Jane,\n50 boxes are <b>available</b>.' });
    expect(reply.body.emailing).toBe(true);

    let email;
    for (let i = 0; i < 100 && !email; i += 1) {
      [email] = sentTo('jane@example.com');
      if (!email) await pause(10); // eslint-disable-line no-await-in-loop
    }
    expect(email).toMatchObject({ replyTo: ADMIN_INBOX, subject: 'CureNeed Support replied to your chat — CureNeed' });
    expect(email.html).toContain('Hi Jane,<br />50 boxes are &lt;b&gt;available&lt;/b&gt;.');
    expect(email.text).toContain('CureNeed Support: Hi Jane,');

    let saved;
    for (let i = 0; i < 100 && !saved?.emailedAt; i += 1) {
      saved = await ChatMessage.findOne({ role: 'agent' }).lean(); // eslint-disable-line no-await-in-loop
      if (!saved?.emailedAt) await pause(10); // eslint-disable-line no-await-in-loop
    }
    expect(saved.emailedAt).toBeTruthy();
    const after = await admin.get(`/api/admin/chat/conversations/${id}`);
    expect(after.body.messages.find((m) => m.role === 'agent').emailedAt).toBeTruthy();
  });

  it('keeps the reply in the chat even if the email is rejected', async () => {
    const { admin, id } = await setup();
    await ChatConversation.updateOne({}, { $set: { visitorSeenAt: new Date(Date.now() - 5 * 60 * 1000) } });
    send.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'rejected' } });

    const reply = await admin.post(`/api/admin/chat/conversations/${id}/reply`).send({ text: 'Hello again' });
    expect(reply.status).toBe(201);
    await pause(100);
    const saved = await ChatMessage.findOne({ role: 'agent' }).lean();
    expect(saved.text).toBe('Hello again');
    expect(saved.emailedAt).toBeNull();
  });
});
