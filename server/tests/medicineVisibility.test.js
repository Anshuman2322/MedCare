import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin, createTestMedicine } from './helpers.js';

let app;
let Medicine;
let Admin;

const PASSWORD = 'Passw0rd!23';
let clientIp;
let ipCounter = 0;

const post = (url, body) => request(app).post(url).set('X-Forwarded-For', clientIp).send(body);

async function loginAs(email) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set('X-Forwarded-For', clientIp).send({ email, password: PASSWORD });
  return agent;
}

const createHidden = (overrides = {}) =>
  createTestMedicine({ slug: 'hidden-med', name: 'Hiddenbrand 80 mg Tablet', isPublished: false, ...overrides });

beforeAll(async () => {
  await startTestDb();
  ({ default: app } = await import('../app.js'));
  ({ default: Medicine } = await import('../models/Medicine.js'));
  ({ default: Admin } = await import('../models/Admin.js'));
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(() => {
  ipCounter += 1;
  clientIp = `10.40.0.${ipCounter}`;
});

afterEach(async () => {
  await clearCollections();
});

describe('public site', () => {
  it('leaves hidden products out of the catalogue and search', async () => {
    await createTestMedicine({ slug: 'visible-med' });
    await createHidden();

    const list = await request(app).get('/api/medicines');
    expect(list.body.map((m) => m.slug)).toEqual(['visible-med']);

    const search = await request(app).get('/api/medicines').query({ search: 'Hiddenbrand' });
    expect(search.body).toEqual([]);
  });

  it('404s a hidden product by slug and by id', async () => {
    const hidden = await createHidden();
    expect((await request(app).get('/api/medicines/hidden-med')).status).toBe(404);
    expect((await request(app).get(`/api/medicines/${hidden._id}`)).status).toBe(404);
  });

  it('keeps products saved before the field existed visible', async () => {
    const { insertedId } = await Medicine.collection.insertOne({
      slug: 'legacy-med',
      name: 'Legacy Medicine',
      variants: [{ price: 5, stock: 1 }],
    });

    const list = await request(app).get('/api/medicines');
    expect(list.body.map((m) => m.slug)).toEqual(['legacy-med']);
    expect((await request(app).get(`/api/medicines/${insertedId}`)).status).toBe(200);
  });

  it('never shows a hidden product in support chat', async () => {
    await createHidden();
    const session = await post('/api/chat/session', {});
    const { sessionToken } = session.body;

    const res = await post('/api/chat/message', { sessionToken, text: 'do you have hiddenbrand' });
    expect(JSON.stringify(res.body)).not.toMatch(/hidden-med/i);
    expect(JSON.stringify(res.body)).not.toMatch(/Hiddenbrand 80/i);

    const resumed = await post('/api/chat/session', { productContext: { slug: 'hidden-med' } });
    expect(resumed.body.conversation.productContext.slug).toBe('');
  });

  it('refuses requests and orders for a hidden product', async () => {
    const hidden = await createHidden();
    const medicineId = hidden._id.toString();
    const customer = { name: 'Jane', city: 'Metropolis', email: 'jane@example.com', phone: '9876543210' };

    const inquiry = await post('/api/inquiries', {
      medicineId,
      customer,
      product: { quantity: 1, packagingType: 'strip' },
    });
    expect(inquiry.status).toBe(404);

    const bulk = await post('/api/inquiries/bulk', { customer, items: [{ medicineId, quantity: 1 }] });
    expect(bulk.status).toBe(404);

    const order = await post('/api/orders', {
      medicineId,
      customerName: 'Jane',
      customerEmail: 'jane@example.com',
      customerPhone: '9876543210',
    });
    expect(order.status).toBe(404);
  });
});

describe('admin catalogue', () => {
  beforeEach(async () => {
    await createTestAdmin({ email: 'admin@test.local', password: PASSWORD });
  });

  it('requires a login', async () => {
    expect((await request(app).get('/api/admin/medicines')).status).toBe(401);
    expect((await request(app).get('/api/admin/medicines/hidden-med')).status).toBe(401);
  });

  it('requires the medicines permission', async () => {
    await Admin.create({
      email: 'limited@test.local',
      password: PASSWORD,
      role: 'admin',
      permissions: { dashboard: true, medicines: false, categories: false, inquiries: false, adminManagement: false },
    });
    const agent = await loginAs('limited@test.local');
    expect((await agent.get('/api/admin/medicines')).status).toBe(403);
  });

  it('shows hidden and visible products to an admin', async () => {
    await createTestMedicine({ slug: 'visible-med' });
    const hidden = await createHidden();
    const agent = await loginAs('admin@test.local');

    const list = await agent.get('/api/admin/medicines');
    expect(list.body.map((m) => m.slug).sort()).toEqual(['hidden-med', 'visible-med']);

    const one = await agent.get(`/api/admin/medicines/${hidden._id}`);
    expect(one.status).toBe(200);
    expect(one.body.isPublished).toBe(false);
  });

  it('publishes new products by default', async () => {
    const agent = await loginAs('admin@test.local');
    await agent.post('/api/medicines').send({ slug: 'plain', name: 'Plain', variants: [{ price: 1, stock: 1 }] });
    expect((await request(app).get('/api/medicines/plain')).status).toBe(200);
  });

  it('changes only visibility from the list toggle', async () => {
    // Stock is 5, so anything recalculating inStock would turn this back to true.
    const med = await createTestMedicine({ slug: 'toggle-me', inStock: false });
    const agent = await loginAs('admin@test.local');
    const url = `/api/medicines/${med._id}/visibility`;

    const hide = await agent.patch(url).send({ isPublished: false });
    expect(hide.status).toBe(200);
    expect(hide.body.isPublished).toBe(false);
    expect((await request(app).get('/api/medicines/toggle-me')).status).toBe(404);

    const show = await agent.patch(url).send({ isPublished: true });
    expect(show.body.isPublished).toBe(true);
    const visible = await request(app).get('/api/medicines/toggle-me');
    expect(visible.status).toBe(200);
    expect(visible.body.inStock).toBe(false);
  });

  it('guards the list toggle', async () => {
    const med = await createTestMedicine({ slug: 'guarded' });
    const url = `/api/medicines/${med._id}/visibility`;

    expect((await request(app).patch(url).send({ isPublished: false })).status).toBe(401);

    await Admin.create({
      email: 'limited@test.local',
      password: PASSWORD,
      role: 'admin',
      permissions: { dashboard: true, medicines: false, categories: false, inquiries: false, adminManagement: false },
    });
    const limited = await loginAs('limited@test.local');
    expect((await limited.patch(url).send({ isPublished: false })).status).toBe(403);

    const agent = await loginAs('admin@test.local');
    expect((await agent.patch(url).send({ isPublished: 'no' })).status).toBe(400);
    expect((await agent.patch('/api/medicines/no-such-slug/visibility').send({ isPublished: false })).status).toBe(404);

    expect((await request(app).get('/api/medicines/guarded')).status).toBe(200);
  });

  it('can create a hidden product and later change its visibility', async () => {
    const agent = await loginAs('admin@test.local');
    const created = await agent
      .post('/api/medicines')
      .send({ slug: 'draft', name: 'Draft', isPublished: false, variants: [{ price: 1, stock: 1 }] });
    expect(created.body.isPublished).toBe(false);
    expect((await request(app).get('/api/medicines/draft')).status).toBe(404);

    await agent.put(`/api/medicines/${created.body._id}`).send({ name: 'Draft 2' });
    expect((await request(app).get('/api/medicines/draft')).status).toBe(404);

    await agent.put(`/api/medicines/${created.body._id}`).send({ isPublished: true });
    expect((await request(app).get('/api/medicines/draft')).status).toBe(200);
  });
});
