import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin, createTestMedicine } from './helpers.js';

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

describe('admin dashboard', () => {
  it("shows each recent medicine's listed variant price, not 0", async () => {
    await createTestAdmin({ email: 'boss@test.local', password: 'Passw0rd!23' });
    const admin = request.agent(app);
    await admin.post('/api/auth/login').send({ email: 'boss@test.local', password: 'Passw0rd!23' });

    await createTestMedicine({ slug: 'priced', name: 'Priced', variants: [{ strength: '5 mg', form: 'Tablet', packSize: '10', packagingType: 'Strip', price: 12.5, stock: 3 }] });
    await createTestMedicine({ slug: 'unpriced', name: 'Unpriced', variants: [{ strength: '5 mg', form: 'Tablet', packSize: '10', packagingType: 'Strip', price: 0, stock: 3 }] });

    const res = await admin.get('/api/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.totalMedicines).toBe(2);
    const bySlug = Object.fromEntries(res.body.recentMedicines.map((m) => [m.slug, m]));
    expect(bySlug.priced.price).toBe(12.5);
    expect(bySlug.unpriced.price).toBeNull();
    expect(bySlug.priced._id).toBeTruthy();
  });
});
