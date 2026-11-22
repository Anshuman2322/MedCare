import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin } from './helpers.js';
import { FAQ_ENTRIES, FAQ_CATEGORIES, FAQ_FALLBACK, EMERGENCY_ANSWER } from '../data/faq.js';
import { searchFaq } from '../services/chat/faq.js';

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

async function openSession() {
  const res = await request(app).post('/api/chat/session').send({});
  return res.body.sessionToken;
}

async function say(sessionToken, text) {
  const res = await request(app).post('/api/chat/message').send({ sessionToken, text });
  expect(res.status).toBe(200);
  return res.body.messages[1];
}

describe('FAQ knowledge base', () => {
  it('is complete and consistent', () => {
    const ids = FAQ_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FAQ_CATEGORIES).toHaveLength(20);
    const categories = new Set(FAQ_CATEGORIES.map((category) => category.id));
    for (const entry of FAQ_ENTRIES) {
      expect(categories.has(entry.category)).toBe(true);
      expect(entry.question.length).toBeGreaterThan(5);
      expect(entry.answer.length).toBeGreaterThan(20);
      expect(typeof entry.published).toBe('boolean');
      for (const related of entry.related) expect(ids).toContain(related);
    }
    // every category has at least one published entry
    for (const category of FAQ_CATEGORIES) {
      expect(FAQ_ENTRIES.some((entry) => entry.category === category.id && entry.published)).toBe(true);
    }
  });

  it('never states a price, delivery date or fee that the site does not publish', () => {
    const text = FAQ_ENTRIES.map((entry) => entry.answer).join('\n');
    expect(text).not.toMatch(/\$\s?\d/);
    expect(text).not.toMatch(/\b\d+\s*(?:-|to|–)\s*\d+\s*(?:business\s+)?days\b/i);
    expect(text).not.toMatch(/\b(?:free shipping on|money-back guarantee|30[- ]day)\b/i);
  });
});

describe('FAQ matcher', () => {
  const best = (text) => searchFaq(text).match?.entry.id;

  it('understands rephrasings, short queries, typos and Hinglish', () => {
    expect(best('refund')).toBe('return-policy');
    expect(best('shiping cost')).toBe('shipping-cost');
    expect(best('do u ship to canada')).toBe('ship-countries');
    expect(best('is cureneed legit')).toBe('is-cureneed-verified');
    expect(best('can i buy without prescription')).toBe('prescription-needed');
    expect(best('kya aap india me deliver karte ho')).toBe('ship-india');
  });

  it('does not match unrelated text or medicine names', () => {
    expect(best('what is the capital of france')).toBeUndefined();
    expect(best('cenforce 100 price')).toBeUndefined();
  });
});

describe('FAQ API', () => {
  it('serves the whole knowledge base', async () => {
    const res = await request(app).get('/api/faq');
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(20);
    expect(res.body.items.length).toBe(FAQ_ENTRIES.length);
    expect(res.body.popular.length).toBeGreaterThan(3);
    expect(res.body.support.email).toMatch(/@/);
  });

  it('searches', async () => {
    const res = await request(app).get('/api/faq/search').query({ q: 'refund' });
    expect(res.status).toBe(200);
    expect(res.body.best).toBe('return-policy');
    const none = await request(app).get('/api/faq/search').query({ q: 'zzzzqqq' });
    expect(none.body.results).toEqual([]);
    expect(none.body.best).toBeNull();
  });

  it('records helpful / not helpful votes and validates them', async () => {
    await createTestAdmin({ email: 'boss@test.local', password: 'Passw0rd!23' });
    const url = '/api/faq/how-to-order/feedback';
    expect((await request(app).post(url).send({ helpful: true })).status).toBe(201);
    expect((await request(app).post(url).send({ helpful: true })).status).toBe(201);
    const last = await request(app).post(url).send({ helpful: false });
    expect(last.body).toMatchObject({ helpful: 2, unhelpful: 1 });
    expect((await request(app).post(url).send({ helpful: 'yes' })).status).toBe(400);
    expect((await request(app).post('/api/faq/not-a-real-id/feedback').send({ helpful: true })).status).toBe(404);

    const admin = request.agent(app);
    await admin.post('/api/auth/login').send({ email: 'boss@test.local', password: 'Passw0rd!23' });
    const summary = await admin.get('/api/admin/faq-feedback');
    expect(summary.status).toBe(200);
    const row = summary.body.find((item) => item.id === 'how-to-order');
    expect(row).toMatchObject({ helpful: 2, unhelpful: 1 });
    expect((await request(app).get('/api/admin/faq-feedback')).status).toBe(401);
  });
});

describe('chat assistant uses the FAQ', () => {
  it('answers policy questions from the knowledge base', async () => {
    const token = await openSession();
    const reply = await say(token, 'what is your refund policy?');
    expect(reply.text).toMatch(/don't have a published return or refund policy/i);
    expect(reply.quickActions.map((action) => action.id)).toContain('human');
  });

  it('answers a rephrased and misspelt question', async () => {
    const token = await openSession();
    expect((await say(token, 'wat if my pakage is damaged')).text).toMatch(/sorry/i);
    expect((await say(token, 'minimum order quantity')).text).toMatch(/no fixed minimum/i);
  });

  it('says it has no verified information instead of inventing an answer', async () => {
    const token = await openSession();
    const reply = await say(token, 'what is your loyalty points programme for members');
    expect(reply.text).toBe(FAQ_FALLBACK);
    expect((await say(await openSession(), 'what is your loyalty programme')).text).toBe(FAQ_FALLBACK);
    expect(reply.quickActions.map((action) => action.id)).toContain('human');
  });

  it('never invents tracking or payment status', async () => {
    const token = await openSession();
    const tracking = await say(token, 'where is my order, tracking number please');
    expect(tracking.text).toMatch(/can't look up tracking|tracking details/i);
    expect(tracking.text).not.toMatch(/delivered|out for delivery|in transit/i);
    const payment = await say(token, 'has my payment gone through');
    expect(payment.text).toMatch(/can't see payment status/i);
  });

  it('treats a misspelt supplied country as that country', async () => {
    const token = await openSession();
    expect((await say(token, 'do u deliver in canda?')).text).toMatch(/regularly supply buyers in Canada/);
  });

  it('sends emergencies to local emergency services', async () => {
    const token = await openSession();
    const reply = await say(token, 'help i think i took an overdose, this is an emergency');
    expect(reply.text).toBe(EMERGENCY_ANSWER);
    expect(reply.text).not.toMatch(/quote|price/i);
  });

  it('refuses medical advice and does not bypass prescriptions', async () => {
    const token = await openSession();
    expect((await say(token, 'which tablet should i take for fever')).text).toMatch(/can't give medical advice/i);
    expect((await say(token, 'can i buy without prescription')).text).toMatch(/do not bypass prescription/i);
  });

  it('the FAQs chip offers popular questions and a link to the page', async () => {
    const token = await openSession();
    const res = await request(app).post('/api/chat/message').send({ sessionToken: token, actionId: 'faq', actionLabel: 'FAQs' });
    const actions = res.body.messages[1].quickActions;
    expect(actions.some((action) => action.href === '/faq')).toBe(true);
    expect(actions.filter((action) => action.id.startsWith('say:')).length).toBeGreaterThanOrEqual(4);
  });
});

describe('FAQ admin: what visitors asked, and editing the answers', () => {
  async function loginAdmin() {
    await createTestAdmin({ email: 'boss@test.local', password: 'Passw0rd!23' });
    const admin = request.agent(app);
    await admin.post('/api/auth/login').send({ email: 'boss@test.local', password: 'Passw0rd!23' });
    return admin;
  }
  const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

  it('records what the visitor asked, how the FAQ handled it, and which chat it came from', async () => {
    const admin = await loginAdmin();
    const token = await openSession();
    await say(token, 'what is your refund policy?'); // answered by a FAQ that needs a person
    await say(await openSession(), 'what is your loyalty programme, mail me at jane@example.com'); // no answer
    await settle();

    const res = await admin.get('/api/admin/faq/questions');
    expect(res.status).toBe(200);
    const refund = res.body.questions.find((row) => /refund policy/i.test(row.text));
    expect(refund).toMatchObject({ outcome: 'escalated', faqId: 'return-policy', count: 1, status: 'new' });
    expect(refund.conversations).toHaveLength(1);
    expect(refund.conversations[0].conversationId).toBeTruthy();

    const loyalty = res.body.questions.find((row) => /loyalty/i.test(row.text));
    expect(loyalty.outcome).toBe('unanswered');
    expect(loyalty.text).not.toMatch(/jane@example\.com/);
    expect(loyalty.text).toMatch(/\[email\]/);
    expect(res.body.summary.unanswered).toBeGreaterThanOrEqual(1);

    // The same question again is counted, not duplicated.
    await say(await openSession(), 'what is your refund policy?');
    await settle();
    const again = await admin.get('/api/admin/faq/questions').query({ outcome: 'escalated' });
    expect(again.body.questions.find((row) => /refund policy/i.test(row.text)).count).toBe(2);
  });

  it('does not log emergencies or health statements', async () => {
    const admin = await loginAdmin();
    await say(await openSession(), 'help i think i took an overdose, this is an emergency');
    await say(await openSession(), 'i have fever what tablet should i take');
    await settle();
    expect((await admin.get('/api/admin/faq/questions')).body.total).toBe(0);
  });

  it('logs a FAQ-page search that finds nothing', async () => {
    const admin = await loginAdmin();
    await request(app).get('/api/faq/search').query({ q: 'zzzzqqqq' });
    await settle();
    const res = await admin.get('/api/admin/faq/questions');
    expect(res.body.questions[0]).toMatchObject({ source: 'page', outcome: 'unanswered' });
  });

  it('lets the team answer an unanswered question, and the chat and page use it at once', async () => {
    const admin = await loginAdmin();
    await say(await openSession(), 'what is your loyalty programme');
    await settle();
    const open = (await admin.get('/api/admin/faq/questions')).body.questions[0];

    const created = await admin.post('/api/admin/faq/entries').send({
      fromQuestionId: open._id,
      category: 'pricing',
      question: 'Do you have a loyalty programme?',
      answer: 'Not at the moment. Ask our team about their best price for repeat orders.',
      alternatives: ['what is your loyalty programme', 'rewards for repeat customers'],
      keywords: ['loyalty', 'rewards'],
    });
    expect(created.status).toBe(201);
    expect(created.body.id).toMatch(/^custom-/);

    expect((await say(await openSession(), 'what is your loyalty programme')).text).toMatch(/Not at the moment/);
    expect((await request(app).get('/api/faq')).body.items.some((item) => item.id === created.body.id)).toBe(true);
    const after = (await admin.get('/api/admin/faq/questions').query({ status: 'resolved' })).body.questions;
    expect(after[0]).toMatchObject({ resolvedFaqId: created.body.id });
  });

  it('edits, hides and restores a built-in answer', async () => {
    const admin = await loginAdmin();
    const list = (await admin.get('/api/admin/faq/entries')).body;
    const original = list.entries.find((entry) => entry.id === 'discounts');
    expect(original.edited).toBe(false);

    const edit = await admin.put('/api/admin/faq/entries/discounts').send({ ...original, answer: 'Edited answer from the team about discounts.' });
    expect(edit.status).toBe(200);
    expect((await say(await openSession(), 'do you offer discounts')).text).toMatch(/Edited answer from the team/);

    await admin.put('/api/admin/faq/entries/discounts').send({ ...original, answer: original.answer, published: false });
    expect((await request(app).get('/api/faq')).body.items.some((item) => item.id === 'discounts')).toBe(false);

    expect((await admin.delete('/api/admin/faq/entries/discounts')).status).toBe(200); // restore the original
    const restored = (await admin.get('/api/admin/faq/entries')).body.entries.find((entry) => entry.id === 'discounts');
    expect(restored).toMatchObject({ edited: false, published: true });
    expect((await admin.delete('/api/admin/faq/entries/discounts')).status).toBe(404);
  });

  it('validates input and requires an admin', async () => {
    const admin = await loginAdmin();
    expect((await admin.post('/api/admin/faq/entries').send({ category: 'nope', question: 'Short?', answer: 'x' })).status).toBe(400);
    expect((await admin.put('/api/admin/faq/entries/not-real').send({ category: 'pricing', question: 'A valid question?', answer: 'A valid answer.' })).status).toBe(404);
    expect((await admin.patch('/api/admin/faq/questions/abc').send({ status: 'resolved' })).status).toBe(404);
    for (const path of ['/api/admin/faq/entries', '/api/admin/faq/questions', '/api/admin/faq/summary']) {
      expect((await request(app).get(path)).status).toBe(401);
    }
    expect((await request(app).post('/api/admin/faq/entries').send({})).status).toBe(401);
  });

  it('updates a question\'s status and note', async () => {
    const admin = await loginAdmin();
    await say(await openSession(), 'what is your loyalty programme');
    await settle();
    const row = (await admin.get('/api/admin/faq/questions')).body.questions[0];
    expect((await admin.patch(`/api/admin/faq/questions/${row._id}`).send({ status: 'ignored', note: 'not relevant' })).status).toBe(200);
    expect((await admin.get('/api/admin/faq/questions').query({ status: 'ignored' })).body.questions[0].note).toBe('not relevant');
    expect((await admin.delete(`/api/admin/faq/questions/${row._id}`)).status).toBe(200);
  });
});
