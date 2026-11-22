import request from 'supertest';
import { startTestDb, stopTestDb, clearCollections } from './setup.js';
import { createTestAdmin, createTestMedicine } from './helpers.js';

let app;
let Review;
let Admin;

const PASSWORD = 'Passw0rd!23';
let clientIp;
let ipCounter = 0;

const post = (body) => request(app).post('/api/reviews').set('X-Forwarded-For', clientIp).send(body);
const valid = (overrides = {}) => ({
  rating: 5,
  title: 'Fast and helpful',
  body: 'Ordered for my father, the team answered every question quickly.',
  name: 'Jane Doe',
  country: 'Canada',
  email: 'jane@example.com',
  ...overrides,
});

async function loginAs(email) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set('X-Forwarded-For', clientIp).send({ email, password: PASSWORD });
  return agent;
}

async function adminAgent() {
  await createTestAdmin({ email: 'admin@test.local', password: PASSWORD });
  return loginAs('admin@test.local');
}

beforeAll(async () => {
  await startTestDb();
  ({ default: app } = await import('../app.js'));
  ({ default: Review } = await import('../models/Review.js'));
  ({ default: Admin } = await import('../models/Admin.js'));
});

afterAll(async () => {
  await stopTestDb();
});

beforeEach(() => {
  ipCounter += 1;
  clientIp = `10.60.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
});

afterEach(async () => {
  await clearCollections();
});

describe('submitting a review', () => {
  it('publishes it straight away', async () => {
    await createTestMedicine({ slug: 'reviewed' });
    const res = await post(valid({ product: 'reviewed' }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'approved', review: { author: 'Jane D.', rating: 5 } });
    expect(res.body.review.email).toBeUndefined();

    const list = await request(app).get('/api/reviews').query({ product: 'reviewed' });
    expect(list.status).toBe(200);
    expect(list.body.reviews.map((r) => r.title)).toEqual(['Fast and helpful']);
    expect(list.body.summary).toMatchObject({ average: 5, count: 1 });
  });

  it.each([
    [{ rating: 6 }, /1 to 5 stars/],
    [{ rating: 0 }, /1 to 5 stars/],
    [{ body: 'too short' }, /10 and 1000/],
    [{ body: 'Great, see more at https://spam.example for deals' }, /remove links/],
    [{ body: 'Great service, visit www.cheap-pills.com today' }, /remove links/],
    [{ body: 'Call me on +1 415 555 0134 for a cheaper price' }, /phone numbers and email/],
    [{ body: 'Write to deals@cheap-pills.example for discounts' }, /phone numbers and email/],
    [{ name: '' }, /your name/],
    [{ email: 'not-an-email' }, /valid email/],
  ])('rejects %j', async (change, message) => {
    const res = await post(valid(change));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
    expect(await Review.countDocuments()).toBe(0);
  });

  it('quietly drops bot submissions that fill the hidden field', async () => {
    const res = await post(valid({ website: 'http://bot.example' }));
    expect(res.status).toBe(201);
    expect(await Review.countDocuments()).toBe(0);
  });

  it('refuses reviews of hidden or unknown products', async () => {
    await createTestMedicine({ slug: 'hidden', isPublished: false });
    expect((await post(valid({ product: 'hidden' }))).status).toBe(404);
    expect((await post(valid({ product: 'no-such-product' }))).status).toBe(404);
    expect((await request(app).get('/api/reviews').query({ product: 'hidden' })).status).toBe(404);
  });

  it('allows one review per email per product, unless the earlier one was rejected', async () => {
    await createTestMedicine({ slug: 'one' });
    await createTestMedicine({ slug: 'two', name: 'Two' });
    expect((await post(valid({ product: 'one' }))).status).toBe(201);
    expect((await post(valid({ product: 'one' }))).status).toBe(409);
    expect((await post(valid({ product: 'two' }))).status).toBe(201);

    await Review.updateMany({}, { status: 'rejected' });
    expect((await post(valid({ product: 'one' }))).status).toBe(201);
  });

  it('accepts a store review without a product and without an email', async () => {
    const res = await post(valid({ email: '' }));
    expect(res.status).toBe(201);
    const saved = await Review.findOne();
    expect(saved.medicine).toBeNull();
    expect(saved.email).toBe('');
  });

  it('limits one address to 5 reviews an hour', async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await post(valid({ email: `p${i}@example.com` }))).status).toBe(201);
    }
    expect((await post(valid({ email: 'p6@example.com' }))).status).toBe(429);
  });
});

describe('topics and suggested drafts', () => {
  const suggest = (body) => request(app).post('/api/reviews/suggest').set('X-Forwarded-For', clientIp).send(body);

  it('drafts reviews from a rating and topics without saving anything', async () => {
    await createTestMedicine({ slug: 'drafted', name: 'Tadalista 20 (Tadalafil Tablets 20 mg)' });
    const res = await suggest({ rating: 5, topics: ['quality', 'delivery'], product: 'drafted' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('builtin');
    expect(res.body.drafts).toHaveLength(4);
    expect(res.body.drafts.map((d) => d.body).join(' ')).toContain('Tadalista 20');
    expect(await Review.countDocuments()).toBe(0);
  });

  it.each([
    [{ topics: ['prices'] }, /star rating/],
    [{ rating: 5, topics: [] }, /up to 4 topics/],
    [{ rating: 5, topics: ['prices', 'quote', 'support', 'delivery', 'packaging'] }, /up to 4 topics/],
    [{ rating: 5, topics: ['free-stuff'] }, /Unknown topic/],
  ])('refuses %j', async (body, message) => {
    const res = await suggest(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
  });

  it('will not draft for a hidden product', async () => {
    await createTestMedicine({ slug: 'secret', isPublished: false });
    expect((await suggest({ rating: 5, topics: ['prices'], product: 'secret' })).status).toBe(404);
  });

  it('saves topics with the review, shows them publicly and tells admins when a draft was used', async () => {
    const res = await post(valid({ topics: ['prices', 'support', 'prices'], assisted: true }));
    expect(res.status).toBe(201);
    expect(res.body.review.topics).toEqual(['prices', 'support']);

    const list = await request(app).get('/api/reviews');
    expect(list.body.reviews[0].topics).toEqual(['prices', 'support']);
    expect(list.body.reviews[0].assisted).toBeUndefined();

    const admin = await adminAgent();
    const mine = await admin.get('/api/admin/reviews');
    expect(mine.body.reviews[0]).toMatchObject({ topics: ['prices', 'support'], assisted: true });

    expect((await post(valid({ email: 'other@example.com', topics: ['bribes'] }))).status).toBe(400);
  });
});

describe('approved reviews on the site', () => {
  async function seed() {
    const med = await createTestMedicine({ slug: 'rated' });
    const base = { medicine: med._id, body: 'Long enough review text here.', status: 'approved', approvedAt: new Date() };
    await Review.create([
      { ...base, rating: 5, name: 'Rahul Sharma', email: 'rahul@example.com', createdAt: new Date('2026-01-01') },
      { ...base, rating: 4, name: 'ana', createdAt: new Date('2026-02-01') },
      { ...base, rating: 2, name: 'Li Wei', createdAt: new Date('2026-03-01') },
      { ...base, rating: 1, name: 'Pending Person', status: 'pending' },
    ]);
    return med;
  }

  it('summarises, shortens surnames and never exposes emails', async () => {
    await seed();
    const res = await request(app).get('/api/reviews').query({ product: 'rated' });
    expect(res.body.summary).toEqual({ average: 3.7, count: 3, distribution: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 1 } });
    expect(res.body.reviews.map((r) => r.author)).toEqual(['Li W.', 'Ana', 'Rahul S.']);
    expect(JSON.stringify(res.body)).not.toMatch(/@example\.com/);
    expect(JSON.stringify(res.body)).not.toMatch(/Pending Person/);
  });

  it('sorts, filters by stars and pages', async () => {
    await seed();
    const highest = await request(app).get('/api/reviews').query({ product: 'rated', sort: 'highest' });
    expect(highest.body.reviews.map((r) => r.rating)).toEqual([5, 4, 2]);

    const twos = await request(app).get('/api/reviews').query({ product: 'rated', rating: 2 });
    expect(twos.body.reviews.map((r) => r.rating)).toEqual([2]);
    expect(twos.body.summary.count).toBe(3); // the summary ignores the star filter

    const page2 = await request(app).get('/api/reviews').query({ product: 'rated', limit: 2, page: 2 });
    expect(page2.body.reviews).toHaveLength(1);
    expect(page2.body.pages).toBe(2);

    expect((await request(app).get('/api/reviews').query({ sort: 'random' })).status).toBe(400);
  });

  it('fills the home page automatically: pinned first, then newest, never hidden ones', async () => {
    const shown = await createTestMedicine({ slug: 'shown' });
    const hiddenProduct = await createTestMedicine({ slug: 'gone', name: 'Gone', isPublished: false });
    const base = { body: 'Long enough review text here.', rating: 5, status: 'approved' };
    await Review.create([
      { ...base, name: 'Old Store', title: 'old', createdAt: new Date('2026-01-01') },
      { ...base, name: 'Pinned One', title: 'pinned', featured: true, createdAt: new Date('2025-06-01') },
      { ...base, name: 'New Product', title: 'newest', medicine: shown._id, createdAt: new Date('2026-05-01') },
      { ...base, name: 'Hidden Review', title: 'hidden', status: 'rejected', createdAt: new Date('2026-06-01') },
      { ...base, name: 'Secret Product', title: 'secret', medicine: hiddenProduct._id, createdAt: new Date('2026-07-01') },
    ]);

    const home = await request(app).get('/api/reviews/featured');
    expect(home.body.reviews.map((r) => r.title)).toEqual(['pinned', 'newest', 'old']);
    expect(home.body.reviews[0].pinned).toBe(true);
    expect(home.body.reviews[1].product).toEqual({ name: 'Test Medicine 100mg', slug: 'shown' });
    expect(home.body.summary.count).toBe(3);
    expect(JSON.stringify(home.body)).not.toMatch(/Gone|secret|hidden/);

    const all = await request(app).get('/api/reviews');
    expect(all.body.reviews.map((r) => r.title).sort()).toEqual(['newest', 'old', 'pinned']);
    expect(all.body.summary.count).toBe(3);
  });

  it('adds the rating to the product list and the product page', async () => {
    await seed();
    await createTestMedicine({ slug: 'unrated', name: 'Unrated' });
    const list = await request(app).get('/api/medicines');
    const rated = list.body.find((m) => m.slug === 'rated');
    expect(rated).toMatchObject({ rating: 3.7, reviewCount: 3 });
    expect(list.body.find((m) => m.slug === 'unrated').rating).toBeUndefined();

    const one = await request(app).get('/api/medicines/rated');
    expect(one.body).toMatchObject({ rating: 3.7, reviewCount: 3, slug: 'rated' });
  });
});

describe('admin moderation', () => {
  it('requires a login and the inquiries permission', async () => {
    expect((await request(app).get('/api/admin/reviews')).status).toBe(401);
    await Admin.create({
      email: 'limited@test.local',
      password: PASSWORD,
      role: 'admin',
      permissions: { dashboard: true, medicines: true, categories: false, inquiries: false, adminManagement: false },
    });
    const limited = await loginAs('limited@test.local');
    expect((await limited.get('/api/admin/reviews')).status).toBe(403);
  });

  it('flags new reviews until the admin has seen them', async () => {
    await post(valid());
    const admin = await adminAgent();

    const first = await admin.get('/api/admin/reviews');
    expect(first.body.counts).toEqual({ pending: 0, approved: 1, rejected: 0, unseen: 1 });
    expect(first.body.reviews[0].isNew).toBe(true);

    expect((await admin.post('/api/admin/reviews/mark-seen')).body).toEqual({ updated: 1 });
    const second = await admin.get('/api/admin/reviews');
    expect(second.body.counts.unseen).toBe(0);
    expect(second.body.reviews[0].isNew).toBe(false);
    expect((await request(app).post('/api/admin/reviews/mark-seen')).status).toBe(401);
  });

  it('hides, shows again, replies, marks verified, features and deletes', async () => {
    const med = await createTestMedicine({ slug: 'moderated' });
    await post(valid({ product: 'moderated' }));
    const admin = await adminAgent();

    const all = await admin.get('/api/admin/reviews');
    const [review] = all.body.reviews;
    expect(review).toMatchObject({ status: 'approved', email: 'jane@example.com', name: 'Jane Doe', product: { slug: 'moderated' } });

    // Hiding takes it off the site; a hidden review cannot be featured.
    await admin.patch(`/api/admin/reviews/${review.id}`).send({ status: 'rejected' });
    expect((await request(app).get('/api/reviews').query({ product: 'moderated' })).body.reviews).toEqual([]);
    expect((await admin.patch(`/api/admin/reviews/${review.id}`).send({ featured: true })).status).toBe(400);

    const approved = await admin
      .patch(`/api/admin/reviews/${review.id}`)
      .send({ status: 'approved', featured: true, verifiedBuyer: true, reply: 'Thank you, Jane!' });
    expect(approved.body).toMatchObject({ status: 'approved', featured: true, verifiedBuyer: true, reply: 'Thank you, Jane!' });

    const page = await request(app).get('/api/reviews').query({ product: 'moderated' });
    expect(page.body.reviews[0]).toMatchObject({ author: 'Jane D.', verifiedBuyer: true, reply: 'Thank you, Jane!' });

    const featured = await request(app).get('/api/reviews/featured');
    expect(featured.body.reviews[0]).toMatchObject({ author: 'Jane D.', product: { slug: 'moderated' } });

    // Hiding the product takes its reviews off the home page too.
    await med.updateOne({ isPublished: false });
    expect((await request(app).get('/api/reviews/featured')).body.reviews).toEqual([]);
    await med.updateOne({ isPublished: true });

    // Hiding also un-features.
    const rejected = await admin.patch(`/api/admin/reviews/${review.id}`).send({ status: 'rejected' });
    expect(rejected.body).toMatchObject({ status: 'rejected', featured: false });
    expect((await request(app).get('/api/reviews/featured')).body.reviews).toEqual([]);

    expect((await admin.delete(`/api/admin/reviews/${review.id}`)).status).toBe(204);
    expect((await admin.delete(`/api/admin/reviews/${review.id}`)).status).toBe(404);
    expect((await admin.patch('/api/admin/reviews/not-an-id').send({ status: 'approved' })).status).toBe(404);
  });
});
