import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin } from './helpers.js';

// Live chat with the team: the waiting message, the one-time reassurance,
// team replies with a display name, the admin alert summary, the live-chat
// settings and the saved quick replies.

let app;
let ChatConversation;
let ContactMessage;
let Admin;

const PASSWORD = 'Passw0rd!23';

beforeAll(async () => {
  await startTestDb();
  ({ default: app } = await import('../app.js'));
  ({ default: ChatConversation } = await import('../models/ChatConversation.js'));
  ({ default: ContactMessage } = await import('../models/ContactMessage.js'));
  ({ default: Admin } = await import('../models/Admin.js'));
});

afterAll(async () => {
  await stopTestDb();
});

afterEach(async () => {
  await clearCollections();
});

async function adminAgent(email = 'admin@test.local', role = 'super_admin') {
  await createTestAdmin({ email, password: PASSWORD, role });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: PASSWORD });
  return agent;
}

async function openSession() {
  const res = await request(app).post('/api/chat/session').send({});
  return res.body.sessionToken;
}

const handoff = (sessionToken, overrides = {}) =>
  request(app)
    .post('/api/chat/handoff')
    .send({ sessionToken, name: 'Jane Doe', email: 'jane@example.com', message: 'I need 50 boxes, can someone help?', ...overrides });

const poll = (sessionToken, after) =>
  request(app).get('/api/chat/messages').query({ sessionToken, ...(after ? { after } : {}) });

describe('waiting for the team', () => {
  it('asks the visitor to stay on the page and gives the usual wait', async () => {
    const token = await openSession();
    const res = await handoff(token);

    expect(res.status).toBe(201);
    const [message] = res.body.messages;
    expect(message.role).toBe('assistant');
    expect(message.text).toMatch(/Please stay on this page/);
    expect(message.text).toMatch(/within 5–10 minutes/);
    expect(message.text).toMatch(/Don't close the chat/);
    expect(message.text).toMatch(/jane@example\.com/);
    expect(res.body.conversation).toMatchObject({ handoffRequested: true, agentJoined: false, team: { available: true, waitText: '5–10 minutes' } });
    expect(res.body.conversation.waitingSince).toBeTruthy();
  });

  it('says the team is away when live chat is switched off, with the configured wait elsewhere', async () => {
    const admin = await adminAgent();
    await admin.put('/api/admin/chat/settings').send({ available: false });

    const token = await openSession();
    const res = await handoff(token);
    expect(res.body.messages[0].text).toMatch(/away right now/);
    expect(res.body.messages[0].text).not.toMatch(/Please stay on this page/);
    expect(res.body.conversation.team.available).toBe(false);

    await admin.put('/api/admin/chat/settings').send({ available: true, waitText: '2–3 minutes' });
    const again = await handoff(await openSession());
    expect(again.body.messages[0].text).toMatch(/within 2–3 minutes/);
  });

  it('notifies the team once per conversation, even if the visitor asks again', async () => {
    const token = await openSession();
    await handoff(token);
    await handoff(token, { email: 'jane.doe@example.com', message: 'Sorry, my correct email' });
    expect(await ContactMessage.countDocuments()).toBe(1);

    const conversation = await ChatConversation.findOne().lean();
    expect(conversation.visitor.email).toBe('jane.doe@example.com');
    // The admin queue shows what the visitor wrote, not the automatic reply.
    expect(conversation.lastMessagePreview).toBe('Sorry, my correct email');
  });

  it('sends one "thanks for your patience" message after 10 minutes without a reply', async () => {
    const token = await openSession();
    await handoff(token);

    // Not yet: the wait has only just started.
    expect((await poll(token)).body.messages.some((m) => /patience/.test(m.text))).toBe(false);

    await ChatConversation.updateOne({}, { $set: { handoffAt: new Date(Date.now() - 11 * 60 * 1000) } });
    const first = await poll(token);
    expect(first.body.messages.filter((m) => /Thanks for your patience, Jane/.test(m.text))).toHaveLength(1);

    const second = await poll(token);
    expect(second.body.messages.filter((m) => /patience/.test(m.text))).toHaveLength(1);
  });

  it("shows the team member's display name, never their email, and stops the reassurance once they reply", async () => {
    const admin = await adminAgent();
    await admin.put('/api/admin/chat/settings').send({ agentName: 'Henry' });

    const token = await openSession();
    await handoff(token);
    const conversation = await ChatConversation.findOne().lean();

    const reply = await admin.post(`/api/admin/chat/conversations/${conversation._id}/reply`).send({ text: 'Hi Jane, Henry here. Happy to help!' });
    expect(reply.status).toBe(201);

    await ChatConversation.updateOne({}, { $set: { handoffAt: new Date(Date.now() - 30 * 60 * 1000) } });
    const res = await poll(token);
    const agentMessage = res.body.messages.find((m) => m.role === 'agent');
    expect(agentMessage).toMatchObject({ text: 'Hi Jane, Henry here. Happy to help!', agentName: 'Henry' });
    expect(JSON.stringify(res.body)).not.toMatch(/admin@test\.local/);
    expect(res.body.conversation.agentJoined).toBe(true);
    expect(res.body.messages.some((m) => /patience/.test(m.text))).toBe(false);
  });

  it('uses "CureNeed Support" when no display name is set', async () => {
    const admin = await adminAgent();
    const token = await openSession();
    await handoff(token);
    const conversation = await ChatConversation.findOne().lean();
    await admin.post(`/api/admin/chat/conversations/${conversation._id}/reply`).send({ text: 'Hello!' });

    const agentMessage = (await poll(token)).body.messages.find((m) => m.role === 'agent');
    expect(agentMessage.agentName).toBe('CureNeed Support');
  });
});

describe('admin alerts summary', () => {
  it('counts only visitors who asked for the team and still need a reply', async () => {
    const admin = await adminAgent();

    // A bot-only chat with unread messages does not need the team.
    const botOnly = await openSession();
    await request(app).post('/api/chat/message').send({ sessionToken: botOnly, text: 'hello' });

    const waiting = await openSession();
    await handoff(waiting, { name: 'Sam Lee' });

    const summary = await admin.get('/api/admin/chat/summary');
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({ needsReply: 1, waiting: 1, latest: { name: 'Sam Lee' } });
    expect(summary.body.oldestWaitingSince).toBeTruthy();

    const conversation = await ChatConversation.findOne({ 'visitor.name': 'Sam Lee' }).lean();
    await admin.post(`/api/admin/chat/conversations/${conversation._id}/reply`).send({ text: 'On it!' });
    expect((await admin.get('/api/admin/chat/summary')).body).toMatchObject({ needsReply: 0, waiting: 0 });

    // A new message from the visitor makes it need a reply again.
    await request(app).post('/api/chat/message').send({ sessionToken: waiting, text: 'thanks, and the price?' });
    expect((await admin.get('/api/admin/chat/summary')).body.needsReply).toBe(1);
  });
});

describe('live chat settings', () => {
  it('starts from the defaults and validates changes', async () => {
    const admin = await adminAgent();
    const res = await admin.get('/api/admin/chat/settings');
    expect(res.body).toMatchObject({ available: true, waitText: '5–10 minutes', agentName: '', defaultAgentName: 'CureNeed Support' });

    expect((await admin.put('/api/admin/chat/settings').send({ available: 'yes' })).status).toBe(400);
    expect((await admin.put('/api/admin/chat/settings').send({ waitText: '' })).status).toBe(400);
    expect((await admin.put('/api/admin/chat/settings').send({ waitText: 'x'.repeat(41) })).status).toBe(400);
    expect((await admin.put('/api/admin/chat/settings').send({ agentName: 'henry@cureneed.com' })).status).toBe(400);

    const saved = await admin.put('/api/admin/chat/settings').send({ available: false, waitText: '10–15 minutes', agentName: 'Henry' });
    expect(saved.body).toMatchObject({ available: false, waitText: '10–15 minutes', agentName: 'Henry' });
    expect((await admin.get('/api/admin/chat/settings')).body).toMatchObject({ available: false, waitText: '10–15 minutes', agentName: 'Henry' });
  });

  it('is only for admins who handle customer messages', async () => {
    const limited = await adminAgent('limited@test.local', 'admin');
    await Admin.updateOne({ email: 'limited@test.local' }, { $set: { 'permissions.inquiries': false } });
    expect((await limited.get('/api/admin/chat/settings')).status).toBe(403);
    expect((await request(app).get('/api/admin/chat/quick-replies')).status).toBe(401);
  });
});

describe('quick replies', () => {
  it('adds the starter replies only once, even when two requests arrive together', async () => {
    const admin = await adminAgent();
    const SupportSettings = (await import('../models/SupportSettings.js')).default;
    await SupportSettings.init();
    const [a, b] = await Promise.all([admin.get('/api/admin/chat/quick-replies'), admin.get('/api/admin/chat/quick-replies')]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect((await admin.get('/api/admin/chat/quick-replies')).body.items).toHaveLength(8);
  });

  it('adds the starter replies once, then supports add, edit and delete', async () => {
    const admin = await adminAgent();
    const first = await admin.get('/api/admin/chat/quick-replies');
    expect(first.body.items).toHaveLength(8);
    expect(first.body.items[0]).toMatchObject({ title: 'Welcome' });
    expect(first.body.items[0].text).toContain('{name}');

    const created = await admin.post('/api/admin/chat/quick-replies').send({ title: 'Bulk', text: 'For 100+ boxes we can offer our best price.' });
    expect(created.status).toBe(201);
    const id = created.body.item.id;

    const edited = await admin.put(`/api/admin/chat/quick-replies/${id}`).send({ title: 'Bulk order', text: 'For 100+ boxes, {name}, we can offer our best price.' });
    expect(edited.body.item).toMatchObject({ title: 'Bulk order' });

    expect((await admin.post('/api/admin/chat/quick-replies').send({ title: '', text: 'x' })).status).toBe(400);
    expect((await admin.post('/api/admin/chat/quick-replies').send({ title: 'Empty', text: '   ' })).status).toBe(400);

    // Deleting every reply is respected: the starters don't come back.
    const all = (await admin.get('/api/admin/chat/quick-replies')).body.items;
    expect(all.at(-1).title).toBe('Bulk order');
    for (const reply of all) {
      expect((await admin.delete(`/api/admin/chat/quick-replies/${reply.id}`)).status).toBe(200);
    }
    expect((await admin.get('/api/admin/chat/quick-replies')).body.items).toHaveLength(0);
    expect((await admin.delete('/api/admin/chat/quick-replies/507f1f77bcf86cd799439011')).status).toBe(404);
  });
});
