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
