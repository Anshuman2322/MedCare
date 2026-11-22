import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestMedicine } from './helpers.js';
import Inquiry from '../models/Inquiry.js';

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

const customer = { name: 'Jane Doe', city: 'Austin, USA', email: 'jane@example.com', phone: '5551234567' };

const post = (body) => request(app).post('/api/inquiries/bulk').send(body);

async function seedCatalogue() {
  const cefixime = await createTestMedicine({
    slug: 'cefixime-200',
    name: 'Cefixime 200mg Tablet',
    variants: [{ strength: '200 mg', form: 'Tablet', packSize: '1x10', price: 20.5, stock: 60 }],
  });
  const ibuprofen = await createTestMedicine({
    slug: 'ibuprofen-400',
    name: 'Ibuprofen 400 mg Tablet',
    variants: [{ strength: '400 mg', form: 'Tablet', packSize: '1x15', price: 35, stock: 20 }],
  });
  return { cefixime, ibuprofen };
}

describe('POST /api/inquiries/bulk', () => {
  it('creates ONE combined inquiry for several medicines', async () => {
    const { cefixime, ibuprofen } = await seedCatalogue();

    const res = await post({
      customer,
      notes: 'Need delivery before month end',
      items: [
        { medicineId: cefixime._id.toString(), quantity: 10 },
        { medicineId: ibuprofen._id.toString(), quantity: 20 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.itemCount).toBe(2);
    expect(res.body.referenceId).toMatch(/^CN-\d{4}-\d{4}$/);

    const saved = await Inquiry.find({});
    expect(saved).toHaveLength(1);
    expect(saved[0].items).toHaveLength(2);
    expect(saved[0].requestType).toBe('inquiry');
    // Flat fields stay populated so the existing admin list still renders.
    expect(saved[0].medicineName).toBe('Cefixime 200mg Tablet + 1 more');
    expect(saved[0].quantity).toBe(30);
  });

  it('marks best-price requests and gives them their own reference series', async () => {
    const { cefixime } = await seedCatalogue();

    const res = await post({
      requestType: 'best_price',
      customer,
      items: [{ medicineId: cefixime._id.toString(), quantity: 500 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.requestType).toBe('best_price');
    expect(res.body.referenceId).toMatch(/^BP-\d{4}-\d{4}$/);
  });

  it('ignores prices and names sent by the client and uses the catalogue', async () => {
    const { cefixime } = await seedCatalogue();

    const res = await post({
      customer,
      items: [
        {
          medicineId: cefixime._id.toString(),
          quantity: 2,
          listedPrice: 0.01,
          medicineName: 'Free Medicine',
        },
      ],
    });

    expect(res.status).toBe(201);
    const [saved] = await Inquiry.find({});
    expect(saved.items[0].listedPrice).toBe(20.5);
    expect(saved.items[0].medicineName).toBe('Cefixime 200mg Tablet');
  });

  it('rejects an empty cart', async () => {
    const res = await post({ customer, items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least one medicine/i);
  });

  it.each([
    [{ quantity: 0 }, /quantity of at least 1/i],
    [{ quantity: -3 }, /quantity of at least 1/i],
  ])('rejects quantity %p', async (override, message) => {
    const { cefixime } = await seedCatalogue();
    const res = await post({ customer, items: [{ medicineId: cefixime._id.toString(), ...override }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
  });

  it('rejects a medicine id that is not in the catalogue', async () => {
    const res = await post({
      customer,
      items: [{ medicineId: '507f1f77bcf86cd799439011', quantity: 1 }],
    });
    expect(res.status).toBe(404);
  });

  it('rejects a malformed medicine id without throwing', async () => {
    const res = await post({ customer, items: [{ medicineId: '../../etc/passwd', quantity: 1 }] });
    expect(res.status).toBe(400);
  });

  it('requires a valid email and a delivery location', async () => {
    const { cefixime } = await seedCatalogue();
    const items = [{ medicineId: cefixime._id.toString(), quantity: 1 }];

    const noEmail = await post({ customer: { ...customer, email: 'nope' }, items });
    expect(noEmail.status).toBe(400);

    const noCity = await post({ customer: { ...customer, city: '' }, items });
    expect(noCity.status).toBe(400);
  });

  it('keeps the existing single-medicine endpoint untouched', async () => {
    const { cefixime } = await seedCatalogue();

    const res = await request(app)
      .post('/api/inquiries')
      .send({
        medicineId: cefixime._id.toString(),
        customer: { name: 'Solo Buyer', city: 'Dallas', email: 'solo@example.com', phone: '5550001111' },
        product: { quantity: 1, packagingType: 'box' },
      });

    expect(res.status).toBe(201);
    expect(res.body.referenceId).toMatch(/^CN-\d{4}-\d{4}$/);

    const [saved] = await Inquiry.find({});
    expect(saved.requestType).toBe('inquiry');
    expect(saved.items).toHaveLength(0);
    expect(saved.medicineName).toBe('Cefixime 200mg Tablet');
  });
});
