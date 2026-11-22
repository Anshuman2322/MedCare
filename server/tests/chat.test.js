import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestMedicine } from './helpers.js';

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

async function openSession(productContext) {
  const res = await request(app).post('/api/chat/session').send({ productContext });
  return res.body.sessionToken;
}

const send = (sessionToken, body) =>
  request(app).post('/api/chat/message').send({ sessionToken, ...body });

describe('POST /api/chat/session', () => {
  it('opens a session and greets the visitor', async () => {
    const res = await request(app).post('/api/chat/session').send({});
    expect(res.status).toBe(201);
    expect(res.body.sessionToken).toMatch(/^[a-f0-9]{48}$/);
    expect(res.body.messages[0].text).toMatch(/welcome to cureneed/i);
    expect(res.body.messages[0].quickActions.length).toBeGreaterThan(0);
  });

  it('resumes an existing session with its history', async () => {
    const sessionToken = await openSession();
    await send(sessionToken, { text: 'hello' });

    const res = await request(app).post('/api/chat/session').send({ sessionToken });
    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThan(1);
  });

  it('resolves product context from the catalogue rather than trusting the client', async () => {
    await createTestMedicine({ slug: 'cefixime-200', name: 'Cefixime 200mg Tablet' });

    const res = await request(app)
      .post('/api/chat/session')
      .send({ productContext: { slug: 'cefixime-200', name: 'Totally Made Up Name' } });

    expect(res.body.conversation.productContext.name).toBe('Cefixime 200mg Tablet');
    expect(res.body.messages[0].text).toContain('Cefixime 200mg Tablet');
  });

  it('drops a product context whose slug does not exist', async () => {
    const res = await request(app)
      .post('/api/chat/session')
      .send({ productContext: { slug: 'not-a-real-medicine' } });

    expect(res.body.conversation.productContext.slug).toBe('');
  });
});

describe('medicine search', () => {
  it('returns catalogue matches as cards', async () => {
    await createTestMedicine({ slug: 'azithromycin-500', name: 'Azithromycin 500mg Tablet' });
    const sessionToken = await openSession();

    const res = await send(sessionToken, { text: 'Azithromycin' });
    const assistant = res.body.messages[1];

    expect(assistant.cards).toHaveLength(1);
    expect(assistant.cards[0].name).toBe('Azithromycin 500mg Tablet');
    expect(assistant.cards[0].slug).toBe('azithromycin-500');
  });

  it('matches a strength written without a space', async () => {
    await createTestMedicine({
      slug: 'ibuprofen-400',
      name: 'Ibuprofen 400 mg Tablet',
      variants: [{ strength: '400 mg', form: 'Tablet', price: 35, stock: 10 }],
    });
    const sessionToken = await openSession();

    const res = await send(sessionToken, { text: 'Ibuprofen 400mg' });
    expect(res.body.messages[1].cards).toHaveLength(1);
  });

  it('offers human support when nothing matches', async () => {
    const sessionToken = await openSession();
    const res = await send(sessionToken, { actionId: 'find_medicine', actionLabel: 'Find a Medicine' });
    expect(res.body.messages[1].text).toMatch(/which medicine are you looking for/i);

    const followUp = await send(sessionToken, { text: 'Nonexistentazole' });
    const assistant = followUp.body.messages[1];
    expect(assistant.text).toMatch(/couldn't find "nonexistentazole" in our catalogue/i);
    expect(assistant.quickActions.map((a) => a.id)).toContain('human');
  });
});

describe('medical safety', () => {
  it.each([
    'I have fever, what medicine should I take?',
    'which tablet is best for headache',
    'how much paracetamol should I take',
    'can I take this with my blood pressure medicine',
  ])('refuses to advise: %s', async (text) => {
    await createTestMedicine({ slug: 'paracetamol', name: 'Paracetamol 500mg' });
    const sessionToken = await openSession();

    const res = await send(sessionToken, { text });
    const assistant = res.body.messages[1];

    expect(assistant.text).toMatch(/doctor or pharmacist/i);
    expect(assistant.cards).toBeUndefined();
    expect(assistant.quickActions.map((a) => a.id)).toContain('human');
  });

  it('still treats a plain product name as a search', async () => {
    await createTestMedicine({ slug: 'paracetamol', name: 'Paracetamol 500mg' });
    const sessionToken = await openSession();

    const res = await send(sessionToken, { text: 'Paracetamol 500mg' });
    expect(res.body.messages[1].cards).toHaveLength(1);
  });
});

describe('product context flows', () => {
  it('reports only the fields the medicine actually has', async () => {
    await createTestMedicine({
      slug: 'cefixime-200',
      name: 'Cefixime 200mg Tablet',
      manufacturer: 'Zydus Pharma',
      variants: [{ strength: '200 mg', form: 'Tablet', packSize: '1 x 10', price: 12, stock: 4 }],
    });
    const sessionToken = await openSession({ slug: 'cefixime-200' });

    const res = await send(sessionToken, { actionId: 'product_info', actionLabel: 'Product Information' });
    const text = res.body.messages[1].text;

    expect(text).toContain('Manufacturer: Zydus Pharma');
    expect(text).toContain('Strength: 200 mg');
    expect(text).toContain('Prescription Required: No');
    expect(text).not.toMatch(/Storage:/);
  });

  it('reports availability from the catalogue', async () => {
    await createTestMedicine({ slug: 'out-of-stock-med', name: 'Rare Med', inStock: false });
    const sessionToken = await openSession({ slug: 'out-of-stock-med' });

    const res = await send(sessionToken, { actionId: 'check_availability' });
    expect(res.body.messages[1].text).toMatch(/out of stock/i);
  });

  it('prefills the inquiry form with the medicine being viewed', async () => {
    await createTestMedicine({ slug: 'cefixime-200', name: 'Cefixime 200mg Tablet' });
    const sessionToken = await openSession({ slug: 'cefixime-200' });

    const res = await send(sessionToken, { actionId: 'submit_inquiry' });
    const form = res.body.messages[1].form;

    expect(form.id).toBe('inquiry');
    expect(form.medicine.slug).toBe('cefixime-200');
  });
});

describe('inquiry status lookup', () => {
  async function createInquiry(email) {
    const med = await createTestMedicine();
    const res = await request(app)
      .post('/api/inquiries')
      .send({
        medicineId: med._id.toString(),
        customer: { name: 'Jane Doe', city: 'Metropolis', email, phone: '9876543210' },
        product: { quantity: 2, packagingType: 'box' },
      });
    return res.body.referenceId;
  }

  it('returns the real status when reference and email match', async () => {
    const referenceId = await createInquiry('jane@example.com');
    const sessionToken = await openSession();

    const res = await request(app)
      .post('/api/chat/inquiry-status')
      .send({ sessionToken, referenceId, email: 'jane@example.com' });

    expect(res.body.found).toBe(true);
    expect(res.body.messages[1].text).toMatch(/Received, being reviewed by our team/);
  });

  it('withholds the inquiry when the email does not match', async () => {
    const referenceId = await createInquiry('jane@example.com');
    const sessionToken = await openSession();

    const res = await request(app)
      .post('/api/chat/inquiry-status')
      .send({ sessionToken, referenceId, email: 'attacker@example.com' });

    expect(res.body.found).toBe(false);
    expect(res.body.messages[1].text).toMatch(/couldn't find an inquiry/i);
    expect(res.body.messages[1].text).not.toMatch(/Test Medicine/);
  });
});

describe('human handoff', () => {
  it('queues the conversation and records a contact message', async () => {
    const sessionToken = await openSession();

    const res = await request(app).post('/api/chat/handoff').send({
      sessionToken,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '9876543210',
      message: 'I need help with a bulk order.',
    });

    expect(res.status).toBe(201);
    expect(res.body.conversation.status).toBe('waiting');
    expect(res.body.conversation.handoffRequested).toBe(true);

    const messages = await request(app).post('/api/chat/message').send({ sessionToken, text: 'any update?' });
    // The assistant must stay silent once a human owns the thread.
    expect(messages.body.messages).toHaveLength(1);
    expect(messages.body.messages[0].role).toBe('user');
  });

  it('rejects a handoff without a valid email', async () => {
    const sessionToken = await openSession();
    const res = await request(app)
      .post('/api/chat/handoff')
      .send({ sessionToken, name: 'Jane', email: 'not-an-email', message: 'hi' });

    expect(res.status).toBe(400);
  });
});

describe('session validation', () => {
  it('404s on an unknown session token', async () => {
    const res = await send('f'.repeat(48), { text: 'hello' });
    expect(res.status).toBe(404);
  });

  it('404s on a malformed session token', async () => {
    const res = await send('../../etc/passwd', { text: 'hello' });
    expect(res.status).toBe(404);
  });

  it('refuses to record an inquiry reference that does not exist', async () => {
    const sessionToken = await openSession();
    const res = await request(app)
      .post('/api/chat/inquiry-submitted')
      .send({ sessionToken, referenceId: 'CN-2026-9999' });

    expect(res.status).toBe(404);
  });
});
