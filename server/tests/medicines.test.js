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

describe('GET /api/medicines', () => {
  it('is public and lists medicines', async () => {
    await createTestMedicine();
    const res = await request(app).get('/api/medicines');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('test-medicine');
  });

  it('filters by category', async () => {
    await createTestMedicine({ slug: 'a', category: 'Pain Relief' });
    await createTestMedicine({ slug: 'b', category: 'Antibiotics' });
    const res = await request(app).get('/api/medicines').query({ category: 'Antibiotics' });
    expect(res.status).toBe(200);
    expect(res.body.map((m) => m.slug)).toEqual(['b']);
  });
});

describe('GET /api/medicines/:slug', () => {
  it('404s for an unknown slug', async () => {
    const res = await request(app).get('/api/medicines/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('write routes require admin auth', () => {
  it('rejects an unauthenticated create', async () => {
    const res = await request(app)
      .post('/api/medicines')
      .send({ slug: 'x', name: 'X', variants: [{ price: 1, stock: 1 }] });
    expect(res.status).toBe(401);
  });

  it('rejects an unauthenticated delete', async () => {
    const med = await createTestMedicine();
    const res = await request(app).delete(`/api/medicines/${med._id}`);
    expect(res.status).toBe(401);
  });

  it('allows a logged-in admin to create a medicine', async () => {
    await createTestAdmin({ email: 'admin@test.local', password: 'Passw0rd!23' });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@test.local', password: 'Passw0rd!23' });

    const res = await agent.post('/api/medicines').send({
      slug: 'new-med',
      name: 'New Medicine',
      variants: [{ price: 20, stock: 5 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('new-med');
  });
});
