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

function validPayload(medicineId) {
  return {
    medicineId,
    customer: { name: 'Jane Doe', city: 'Metropolis', email: 'jane@example.com', phone: '9876543210' },
    product: { quantity: 1, packagingType: 'strip', strength: '100 mg', brand: 'Test' },
    notes: 'test inquiry',
  };
}

describe('POST /api/inquiries', () => {
  it('rejects a missing medicineId', async () => {
    const res = await request(app).post('/api/inquiries').send({ customer: { name: 'x', city: 'y' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/medicine id/i);
  });

  it('rejects an invalid packaging type', async () => {
    const med = await createTestMedicine();
    const payload = validPayload(med._id.toString());
    payload.product.packagingType = 'box-of-nonsense';
    const res = await request(app).post('/api/inquiries').send(payload);
    expect(res.status).toBe(400);
  });

  it('needs an email or a phone number to reply to', async () => {
    const med = await createTestMedicine();
    const none = validPayload(med._id.toString());
    none.customer.email = '';
    none.customer.phone = '';
    const res = await request(app).post('/api/inquiries').send(none);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email or a phone/);

    const phoneOnly = validPayload(med._id.toString());
    phoneOnly.customer.email = '';
    expect((await request(app).post('/api/inquiries').send(phoneOnly)).status).toBe(201);
  });

  it("accepts the product's own pack and records its size and listed price", async () => {
    const Inquiry = (await import('../models/Inquiry.js')).default;
    const drops = await createTestMedicine({
      slug: 'eye-drops',
      variants: [{ strength: '10 ml', form: 'Eye Drops', packSize: '10 ml Bottle', packagingType: 'Bottle', price: 18.4, stock: 5 }],
    });
    const payload = validPayload(drops._id.toString());
    payload.product = { quantity: 3, packagingType: 'bottle', strength: '10 ml' };
    expect((await request(app).post('/api/inquiries').send(payload)).status).toBe(201);
    const saved = await Inquiry.findOne({ slug: 'eye-drops' }).lean();
    expect(saved.selectedVariant).toMatchObject({ packagingType: 'bottle', packSize: '10 ml Bottle', price: 18.4, form: 'Eye Drops' });
    expect(saved.quantity).toBe(3);

    // A different pack is quoted, so no listed price is attached to it.
    payload.product.packagingType = 'box';
    expect((await request(app).post('/api/inquiries').send(payload)).status).toBe(201);
    const boxed = await Inquiry.findOne({ slug: 'eye-drops', 'selectedVariant.packagingType': 'box' }).lean();
    expect(boxed.selectedVariant.price).toBeUndefined();
    expect(boxed.selectedVariant.packSize).toBe('');
  });

  it('404s when the medicine does not exist', async () => {
    const res = await request(app).post('/api/inquiries').send(validPayload('507f1f77bcf86cd799439011'));
    expect(res.status).toBe(404);
  });

  it('creates an inquiry and returns a reference id', async () => {
    const med = await createTestMedicine();
    const res = await request(app).post('/api/inquiries').send(validPayload(med._id.toString()));
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.referenceId).toMatch(/^CN-\d{4}-\d{4}$/);
  });

  it('never reuses a reference id after an older inquiry is removed', async () => {
    const Inquiry = (await import('../models/Inquiry.js')).default;
    const med = await createTestMedicine();
    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      ids.push((await request(app).post('/api/inquiries').send(validPayload(med._id.toString()))).body.referenceId);
    }
    expect(ids.map((id) => id.split('-').pop())).toEqual(['0001', '0002', '0003']);

    // Cleaning out an old record (e.g. in the database console) must not make 0003 come round again.
    await Inquiry.deleteOne({ referenceId: ids[0] });
    const next = await request(app).post('/api/inquiries').send(validPayload(med._id.toString()));
    expect(next.status).toBe(201);
    expect(next.body.referenceId.split('-').pop()).toBe('0004');
  });

  it('gives every one of several simultaneous inquiries its own reference id', async () => {
    const med = await createTestMedicine();
    const results = await Promise.all(
      Array.from({ length: 6 }, () => request(app).post('/api/inquiries').send(validPayload(med._id.toString())))
    );
    expect(results.map((r) => r.status)).toEqual([201, 201, 201, 201, 201, 201]);
    expect(new Set(results.map((r) => r.body.referenceId)).size).toBe(6);
  });

  // Regression test: generateReferenceId() used to build its uniqueness-check
  // regex from a plain template string ("\d{4}"), which silently drops the
  // backslash and never matches anything — so every single inquiry got the
  // same referenceId ("...-0001"). This asserts consecutive submissions get
  // distinct, incrementing reference ids.
  it('gives consecutive inquiries distinct, incrementing reference ids', async () => {
    const med = await createTestMedicine();

    const first = await request(app).post('/api/inquiries').send(validPayload(med._id.toString()));
    const second = await request(app).post('/api/inquiries').send(validPayload(med._id.toString()));

    expect(first.body.referenceId).not.toBe(second.body.referenceId);

    const firstSeq = Number(first.body.referenceId.split('-').pop());
    const secondSeq = Number(second.body.referenceId.split('-').pop());
    expect(secondSeq).toBe(firstSeq + 1);
  });
});
