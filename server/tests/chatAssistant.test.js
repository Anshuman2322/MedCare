import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestMedicine } from './helpers.js';

// The rule-based assistant (no ANTHROPIC_API_KEY in tests): it should read
// what visitors mean, remember what was just discussed, and never answer a
// greeting or "new chat" as if it were a medicine name.

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

// Sends one message and returns the assistant's reply.
async function say(sessionToken, text) {
  const res = await request(app).post('/api/chat/message').send({ sessionToken, text });
  expect(res.status).toBe(200);
  return res.body.messages[1];
}

async function tap(sessionToken, actionId) {
  const res = await request(app).post('/api/chat/message').send({ sessionToken, actionId, actionLabel: actionId });
  return res.body.messages[1];
}

const ids = (reply) => (reply.quickActions || []).map((action) => action.id);

const medicines = {
  ibuprofen: () =>
    createTestMedicine({
      slug: 'ibuprofen-400',
      name: 'Ibuprofen Tablets BP 400 mg',
      composition: 'Ibuprofen BP 400 mg per sugar-coated tablet.',
      category: 'Pain Relief',
      variants: [{ strength: '400 mg', form: 'Tablet', packSize: 'Strip of 10 Tablets', packagingType: 'Strip', price: 15.28, stock: 10 }],
    }),
  cenforce: () =>
    createTestMedicine({
      slug: 'cenforce-100',
      name: 'Cenforce 100 (Sildenafil Citrate Tablets IP 100 mg)',
      composition: 'Sildenafil 100 mg per tablet.',
      category: 'ED',
      variants: [{ strength: '100 mg', form: 'Tablet', packSize: '10 x 10 Tablets', packagingType: 'Box', price: 28, stock: 10 }],
    }),
  fildena: () =>
    createTestMedicine({
      slug: 'fildena-100',
      name: 'Fildena 100 (Sildenafil Citrate Tablets 100 mg)',
      composition: 'Sildenafil 100 mg per tablet.',
      category: 'ED',
      variants: [{ strength: '100 mg', form: 'Tablet', packSize: '10 x 10 Tablets', packagingType: 'Box', price: 9.5, stock: 10 }],
    }),
  winolap: () =>
    createTestMedicine({
      slug: 'winolap',
      name: 'Winolap (Olopatadine Hydrochloride Ophthalmic Solution IP 0.1% w/v)',
      composition: 'Olopatadine Hydrochloride 0.1% w/v.',
      category: 'Eye Care',
      variants: [{ strength: '0.1% w/v', form: 'Eye Drops', packSize: '5 ml Bottle', packagingType: 'Bottle', price: 16.8, stock: 10 }],
    }),
};

describe('conversation basics', () => {
  it('treats "new" and "new chat" as starting over, not as a medicine search', async () => {
    const token = await openSession();
    for (const text of ['new', 'new chat', 'start over']) {
      const reply = await say(token, text);
      expect(reply.text).not.toMatch(/couldn't find/i);
      expect(reply.text).toMatch(/fresh|start|begin/i);
      expect(ids(reply)).toContain('find_medicine');
    }
  });

  it('answers greetings, thanks and goodbyes like a person would', async () => {
    const token = await openSession();
    expect((await say(token, 'hii')).text).toMatch(/welcome to cureneed/i);
    expect((await say(token, 'thank you so much')).text).toMatch(/welcome|happy to help|anytime/i);
    expect((await say(token, 'bye')).text).toMatch(/thanks for chatting|have a great day/i);
  });

  it('is honest about being a virtual assistant and offers a person', async () => {
    const token = await openSession();
    const reply = await say(token, 'are you a bot?');
    expect(reply.text).toMatch(/virtual assistant/i);
    expect(ids(reply)).toContain('human');
  });

  it('offers a person when the visitor is frustrated, and "yes" opens the form', async () => {
    const token = await openSession();
    const reply = await say(token, 'this is useless');
    expect(reply.text).toMatch(/connect you|put you in touch/i);
    expect((await say(token, 'yes')).form).toEqual({ id: 'handoff' });
  });

  it('stops asking to rephrase after two misses and offers the team', async () => {
    const token = await openSession();
    expect((await say(token, 'what is the meaning of all this then')).text).toMatch(/verified information|not sure|didn't quite|make sure/i);
    const second = await say(token, 'and why would anyone do that at all');
    expect(second.text).toMatch(/talk to someone from our team/i);
    expect(ids(second)).toContain('human');
  });
});

describe('finding products', () => {
  it('forgives a typo and says "did you mean"', async () => {
    await medicines.ibuprofen();
    const token = await openSession();
    const reply = await say(token, 'ibuprofin');
    expect(reply.text).toMatch(/did you mean ibuprofen/i);
    expect(reply.cards.map((card) => card.slug)).toEqual(['ibuprofen-400']);
  });

  it('maps a brand we do not sell to products with the same ingredient', async () => {
    await medicines.cenforce();
    await medicines.fildena();
    const token = await openSession();
    const reply = await say(token, 'do you have viagra?');
    expect(reply.text).toMatch(/don't sell Viagra itself/i);
    expect(reply.text).toMatch(/sildenafil/i);
    expect(reply.cards).toHaveLength(2);
  });

  it('suggests close names and offers sourcing when nothing matches', async () => {
    await medicines.cenforce();
    const token = await openSession();
    const reply = await say(token, 'cenfort');
    expect(reply.text).toMatch(/did you mean/i);
    expect(reply.quickActions[0]).toMatchObject({ id: 'search:Cenforce 100' });

    const unknown = await say(token, 'zzqxmed');
    expect(unknown.text).toMatch(/couldn't find "zzqxmed"/i);
    expect(ids(unknown)).toContain('human');
  });

  it('shows a category from everyday words', async () => {
    await medicines.winolap();
    const token = await openSession();
    const reply = await say(token, 'show me eye drops');
    expect(reply.text).toMatch(/Eye Care/);
    expect(reply.cards[0].slug).toBe('winolap');
  });

  it('lists categories when asked what we sell', async () => {
    await medicines.winolap();
    await medicines.cenforce();
    const token = await openSession();
    const reply = await say(token, 'what do you sell?');
    expect(reply.text).toMatch(/2 medicines across 2 categories/);
    expect(ids(reply)).toEqual(expect.arrayContaining(['category:Eye Care', 'category:ED']));
  });
});

describe('remembering the conversation', () => {
  it('answers a follow-up price question about the product just found, and "yes" starts the quote', async () => {
    await medicines.ibuprofen();
    const token = await openSession();
    await say(token, 'do you have ibuprofen?');

    const price = await say(token, 'how much is it?');
    expect(price.text).toMatch(/listed at \$15\.28 per strip/);

    const quote = await say(token, 'yes please');
    expect(quote.form.id).toBe('inquiry');
    expect(quote.form.medicine.slug).toBe('ibuprofen-400');
  });

  it('works out a total for a quantity at the listed price', async () => {
    await medicines.ibuprofen();
    const token = await openSession();
    const reply = await say(token, 'price of 20 strips of ibuprofen');
    expect(reply.text).toMatch(/20 strips come to \$305\.60 at the listed price/);

    // "yes" opens the quote form with that quantity already filled in.
    const quote = await say(token, 'yes');
    expect(quote.form).toMatchObject({ id: 'inquiry', quantity: 20, medicine: { slug: 'ibuprofen-400', packagingType: 'Strip' } });
  });

  it('asks "which one?" with buttons when several products were just listed', async () => {
    await medicines.cenforce();
    await medicines.fildena();
    const token = await openSession();
    await say(token, 'sildenafil');

    const reply = await say(token, 'what is the price?');
    expect(reply.text).toMatch(/which one/i);
    expect(ids(reply)).toEqual(expect.arrayContaining(['price:cenforce-100', 'price:fildena-100']));

    const chosen = await tap(token, 'price:fildena-100');
    expect(chosen.text).toMatch(/Fildena 100 is listed at \$9\.50 per box/);
  });

  it('answers about the product page the visitor is on', async () => {
    await medicines.winolap();
    const token = await openSession({ slug: 'winolap' });
    expect((await say(token, 'price?')).text).toMatch(/Winolap is listed at \$16\.80 per bottle/);
    expect((await say(token, 'is it in stock')).text).toMatch(/Winolap 0\.1% w\/v is listed as in stock/);
    expect((await say(token, 'I want to order 10 bottles')).form.medicine.slug).toBe('winolap');
  });

  it('turns "I want 3 bottles" or "need 5 boxes" into a prefilled quote form', async () => {
    await medicines.winolap();
    const token = await openSession({ slug: 'winolap' });
    expect((await say(token, 'I want 3 bottles')).form).toMatchObject({ id: 'inquiry', quantity: 3, packagingType: 'bottle', medicine: { slug: 'winolap' } });
    expect((await say(token, 'need 5 boxes')).form).toMatchObject({ quantity: 5, packagingType: 'box' });
  });

  it('a "no" to an offer closes it politely', async () => {
    await medicines.ibuprofen();
    const token = await openSession();
    await say(token, 'ibuprofen price');
    const reply = await say(token, 'no thanks');
    expect(reply.text).toMatch(/no problem/i);
    expect(reply.form).toBeUndefined();
  });
});

describe('business questions', () => {
  it('answers shipping by country from the confirmed list', async () => {
    const token = await openSession();
    expect((await say(token, 'do you ship to canada?')).text).toMatch(/regularly supply buyers in Canada/);
    expect((await say(token, 'can you deliver to brazil')).text).toMatch(/Brazil isn't on our regular list/);
  });

  it('never invents delivery times, shipping costs or payment methods', async () => {
    const token = await openSession();
    expect((await say(token, 'how long does delivery take?')).text).toMatch(/confirms an estimated timeline in your quote/);
    expect((await say(token, 'what are the shipping charges')).text).toMatch(/includes them in your quote/);
    expect((await say(token, 'do you accept paypal?')).text).toMatch(/shares the available methods together with your quote/);
  });

  it('explains how ordering works, bulk orders and trust', async () => {
    const token = await openSession();
    expect((await say(token, 'how do I order?')).text).toMatch(/quotes rather than instant checkout/);
    expect((await say(token, 'what is the minimum order quantity')).text).toMatch(/no fixed minimum/);
    expect((await say(token, 'is cureneed legit?')).text).toMatch(/TrustSEAL verified/);
  });

  it('opens the status form with the reference already filled in', async () => {
    const token = await openSession();
    const reply = await say(token, 'what is the status of CN-2026-0042?');
    expect(reply.form).toEqual({ id: 'status', referenceId: 'CN-2026-0042' });
  });

  it('gives contact details and routes "call me" to the team', async () => {
    const token = await openSession();
    expect((await say(token, 'what is your phone number?')).text).toMatch(/\+91 77190 82210/);
    expect((await say(token, 'please call me back')).form).toEqual({ id: 'handoff' });
  });
});

describe('Hinglish', () => {
  it('understands a price question in Hinglish', async () => {
    await medicines.ibuprofen();
    const token = await openSession();
    expect((await say(token, 'ibuprofen ka price kya hai')).text).toMatch(/listed at \$15\.28/);
  });

  it('refuses medical advice asked in Hinglish', async () => {
    await medicines.ibuprofen();
    const token = await openSession();
    const reply = await say(token, 'mujhe bukhar hai kya lu');
    expect(reply.text).toMatch(/doctor or pharmacist/i);
    expect(reply.cards).toBeUndefined();
  });
});
