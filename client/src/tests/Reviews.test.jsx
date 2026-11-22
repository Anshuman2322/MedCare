import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProductReviews from '../components/reviews/ProductReviews.jsx';
import ReviewModal from '../components/reviews/ReviewModal.jsx';
import Testimonials from '../components/Testimonials.jsx';
import AllReviews from '../components/reviews/AllReviews.jsx';
import { combinedRating, sortReviews } from '../components/reviews/combined.js';
import { BUSINESS } from '../config/business.js';

const medicine = { _id: 'm1', slug: 'tadalista-20', name: 'Tadalista 20 (Tadalafil Tablets 20 mg)', brand: 'Tadalista' };

const review = (id, rating, extra = {}) => ({
  id: String(id),
  rating,
  title: `Title ${id}`,
  body: `Review body number ${id} with enough words.`,
  author: 'Jane D.',
  country: 'Canada',
  verifiedBuyer: false,
  reply: '',
  createdAt: '2026-03-12T10:00:00.000Z',
  ...extra,
});

const summary = { average: 4.3, count: 3, distribution: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 2 } };
let calls;

function mockApi({ list = { summary, reviews: [review(1, 5, { verifiedBuyer: true, reply: 'Thank you!' }), review(2, 5), review(3, 3)], page: 1, pages: 1, total: 3 }, post } = {}) {
  calls = [];
  globalThis.fetch = vi.fn(async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (options.method === 'POST' && String(url).endsWith('/suggest')) {
      const drafts = ['Great prices', 'Helpful team', 'Easy order', 'Happy customer'].map((title, i) => ({
        title,
        body: `Suggested review number ${i + 1} about the service.`,
      }));
      return { ok: true, json: async () => ({ drafts, source: 'builtin' }) };
    }
    if (options.method === 'POST') {
      if (post) return post;
      // Like the server: the review is live at once.
      const sent = JSON.parse(options.body);
      const created = review(99, sent.rating, { title: sent.title, body: sent.body, author: 'Sarah M.' });
      list.reviews = [created, ...list.reviews];
      list.summary = { ...list.summary, count: list.summary.count + 1 };
      return { ok: true, json: async () => ({ message: 'ok', status: 'approved', review: created }) };
    }
    const rating = new URL(String(url)).searchParams.get('rating');
    const reviews = rating ? list.reviews.filter((r) => String(r.rating) === rating) : list.reviews;
    return { ok: true, json: async () => ({ ...list, reviews, total: reviews.length }) };
  });
}

const renderReviews = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <ProductReviews medicine={medicine} />
      </MemoryRouter>
    </HelmetProvider>
  );

beforeEach(() => mockApi());

describe('product reviews', () => {
  it('shows the summary, the reviews, topics, verified badges and replies', async () => {
    mockApi({
      list: {
        summary,
        reviews: [review(1, 5, { verifiedBuyer: true, reply: 'Thank you!', topics: ['prices', 'support'] }), review(2, 5), review(3, 3)],
        page: 1,
        pages: 1,
        total: 3,
      },
    });
    renderReviews();
    expect(await screen.findByText('Customer support')).toBeInTheDocument();
    expect(screen.getByText('Prices')).toBeInTheDocument();
    expect(await screen.findByText('4.3')).toBeInTheDocument();
    expect(screen.getByText('Based on 3 reviews')).toBeInTheDocument();
    expect(screen.getByText('Title 1')).toBeInTheDocument();
    expect(screen.getByText('Verified buyer')).toBeInTheDocument();
    expect(screen.getByText('Response from CureNeed')).toBeInTheDocument();
    expect(screen.getByText('Thank you!')).toBeInTheDocument();
    expect(calls[0].url).toContain('product=tadalista-20');
  });

  it('filters by star rating from the breakdown and clears the filter', async () => {
    renderReviews();
    await screen.findByText('Title 1');
    fireEvent.click(screen.getByRole('button', { name: /3 star/ }));
    await waitFor(() => expect(screen.queryByText('Title 1')).not.toBeInTheDocument());
    expect(screen.getByText('Title 3')).toBeInTheDocument();
    expect(calls.at(-1).url).toContain('rating=3');

    fireEvent.click(screen.getByRole('button', { name: /3-star only/ }));
    expect(await screen.findByText('Title 1')).toBeInTheDocument();
  });

  it('shows a new review straight away, at the top of the list', async () => {
    renderReviews();
    await screen.findByText('Title 1');
    fireEvent.click(screen.getByRole('button', { name: /Write a review/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('radio', { name: /4 stars/ }));
    fireEvent.change(within(dialog).getByLabelText(/Headline/), { target: { value: 'Fresh review' } });
    fireEvent.change(within(dialog).getByLabelText(/Your review/), { target: { value: 'Posted just now and visible at once.' } });
    fireEvent.change(within(dialog).getByLabelText(/Your name/), { target: { value: 'Sarah Miller' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit review' }));

    await within(dialog).findByText('Thank you, Sarah!');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 4 })[0]).toHaveTextContent('Fresh review'));
    expect(screen.getByText('Based on 4 reviews')).toBeInTheDocument();
  });

  it('invites the first review when there are none', async () => {
    mockApi({ list: { summary: { average: 0, count: 0, distribution: {} }, reviews: [], page: 1, pages: 1, total: 0 } });
    renderReviews();
    expect(await screen.findByText('No reviews yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Write a review/ }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});

describe('reviews across the site', () => {
  it('puts the latest live reviews on the home page automatically, with a link to all of them', async () => {
    const latest = review(7, 4, { title: '', body: 'perfect website to know the real and best price', author: 'John', country: 'United States' });
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ reviews: [latest], summary: { ...summary, count: 3 } }) }));
    render(
      <MemoryRouter>
        <Testimonials />
      </MemoryRouter>
    );
    expect(await screen.findByText('perfect website to know the real and best price')).toBeInTheDocument();
    expect(screen.getByText('On CureNeed')).toBeInTheDocument();
    const seeAll = screen.getByRole('link', { name: /See all customer reviews/ });
    expect(seeAll).toHaveAttribute('href', '/reviews');
    expect(seeAll.textContent).not.toMatch(/\d/);
  });

  it('lists website and IndiaMART reviews together with badges and one combined rating', async () => {
    mockApi({
      list: {
        summary,
        reviews: [
          review(1, 5, { product: { name: 'Tadalista 20', slug: 'tadalista-20' }, createdAt: '2026-11-11T10:00:00.000Z', verifiedBuyer: true }),
          review(2, 4, { createdAt: '2026-01-05T10:00:00.000Z' }),
        ],
        page: 1,
        pages: 1,
        total: 2,
      },
    });
    render(
      <MemoryRouter>
        <AllReviews />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: 'All customer reviews' })).toBeInTheDocument();

    // One list, newest first, mixing sources.
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2 + BUSINESS.externalReviews.length);
    expect(within(cards[0]).getByText('Title 1')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Very helpful and responds back fast.')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Verified buyer')).toBeInTheDocument();
    expect(within(cards[1]).getByRole('link', { name: 'Verified via IndiaMART' })).toHaveAttribute('href', BUSINESS.indiamart.reviewsUrl);
    expect(within(cards[0]).getByRole('link', { name: 'Tadalista 20' })).toHaveAttribute('href', '/medicine/tadalista-20');
    expect(screen.getAllByText('On CureNeed').length).toBeGreaterThan(0);

    // (4.3 x 3 + 4.8 x 42) / 45 = 4.77 -> 4.8, with each platform listed.
    const platforms = screen.getByRole('list', { name: 'Rating on each platform' });
    expect(within(platforms).getByText('CureNeed')).toBeInTheDocument();
    expect(within(platforms).getByText('4.3')).toBeInTheDocument();
    expect(within(platforms).getByRole('link', { name: /IndiaMART/ })).toBeInTheDocument();
    expect(screen.getByText('Combined across CureNeed and IndiaMART')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\b42\b|reviews?\)/);

    fireEvent.click(screen.getByRole('button', { name: 'IndiaMART' }));
    expect(screen.getAllByRole('article')).toHaveLength(BUSINESS.externalReviews.length);
    fireEvent.click(screen.getByRole('button', { name: 'CureNeed' }));
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});

describe('combining review platforms', () => {
  it('weights each platform by its number of ratings', () => {
    const { average, platforms } = combinedRating({ average: 4, count: 8 });
    expect(average).toBeCloseTo((4 * 8 + 4.8 * 42) / 50, 1);
    expect(platforms.map((p) => [p.name, p.rating])).toEqual([
      ['CureNeed', 4],
      ['IndiaMART', 4.8],
    ]);
    expect(combinedRating(null).platforms.map((p) => p.name)).toEqual(['IndiaMART']);
  });

  it('puts unrated reviews after rated ones when sorting by stars', () => {
    const list = [
      { id: 'a', rating: null, date: '2026-10-01' },
      { id: 'b', rating: 3, date: '2026-01-01' },
      { id: 'c', rating: 5, date: '2026-02-01' },
    ];
    expect(sortReviews(list, 'highest').map((r) => r.id)).toEqual(['c', 'b', 'a']);
    expect(sortReviews(list, 'lowest').map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(sortReviews(list, 'newest').map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('review form', () => {
  const renderModal = (props = {}) => render(<ReviewModal open onClose={vi.fn()} product={{ name: medicine.name, slug: medicine.slug }} {...props} />);

  it('explains what is missing instead of sending an incomplete review', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(await screen.findByText('Please choose a star rating.')).toBeInTheDocument();
    expect(screen.getByText('Please write at least 10 characters.')).toBeInTheDocument();
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
    expect(calls.filter((c) => c.options.method === 'POST')).toHaveLength(0);
  });

  it('keeps phone numbers and emails out of public reviews', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('radio', { name: /4 stars/ }));
    fireEvent.change(screen.getByLabelText(/Your review/), { target: { value: 'Good seller, call +1 415 555 0134 anytime' } });
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: 'Sam Lee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(await screen.findByText('Please remove phone numbers and email addresses from your review.')).toBeInTheDocument();
  });

  it('blocks links before they reach the server', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('radio', { name: /4 stars/ }));
    fireEvent.change(screen.getByLabelText(/Your review/), { target: { value: 'Great deals at www.spam-pills.com right now' } });
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: 'Sam Lee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(await screen.findByText('Please remove links from your review.')).toBeInTheDocument();
  });

  it('sends a complete review for moderation and thanks the customer', async () => {
    renderModal();
    const stars = screen.getByRole('radiogroup', { name: 'Your rating' });
    fireEvent.click(within(stars).getByRole('radio', { name: /5 stars/ }));
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Headline/), { target: { value: 'Smooth order' } });
    fireEvent.change(screen.getByLabelText(/Your review/), { target: { value: 'Quick replies and the pack arrived sealed.' } });
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: 'sarah miller' } });
    fireEvent.change(screen.getByLabelText(/Country/), { target: { value: 'Australia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));

    expect(await screen.findByText('Thank you, Sarah!')).toBeInTheDocument();
    expect(screen.getByText(/We've received your review/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/once our team|checked/i);
    const sent = JSON.parse(calls.find((c) => c.options.method === 'POST').options.body);
    expect(sent).toMatchObject({
      rating: 5,
      title: 'Smooth order',
      body: 'Quick replies and the pack arrived sealed.',
      name: 'sarah miller',
      country: 'Australia',
      email: '',
      website: '',
      product: 'tadalista-20',
    });
  });

  it('writes it for the customer from their rating and topics', async () => {
    renderModal();
    const writeForMe = screen.getByRole('button', { name: /Write it for me/ });
    expect(writeForMe).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: /5 stars/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Product quality' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delivery' }));
    expect(screen.getByRole('button', { name: 'Delivery' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(writeForMe);

    const options = await screen.findByRole('list', { name: 'Suggested reviews' });
    expect(within(options).getAllByRole('button')).toHaveLength(4);
    const sent = JSON.parse(calls.find((c) => c.url.endsWith('/suggest')).options.body);
    expect(sent).toEqual({ rating: 5, topics: ['quality', 'delivery'], product: 'tadalista-20' });

    fireEvent.click(within(options).getByRole('button', { name: /Helpful team/ }));
    expect(screen.getByLabelText(/Your review/)).toHaveValue('Suggested review number 2 about the service.');
    expect(screen.getByLabelText(/Headline/)).toHaveValue('Helpful team');
    expect(screen.getByRole('button', { name: /Try different wording/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: 'Sam Lee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    await screen.findByText('Thank you, Sam!');
    const posted = JSON.parse(calls.find((c) => c.options.method === 'POST' && !c.url.endsWith('/suggest')).options.body);
    expect(posted).toMatchObject({ topics: ['quality', 'delivery'], assisted: true, title: 'Helpful team' });
  });

  it('polishes the words the customer already typed, and caps topics at four', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('radio', { name: /4 stars/ }));
    for (const name of ['Product quality', 'Packaging', 'Delivery', 'Prices']) fireEvent.click(screen.getByRole('button', { name }));
    expect(screen.getByRole('button', { name: 'Customer support' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Your review/), { target: { value: 'good pack fast reply' } });
    fireEvent.click(screen.getByRole('button', { name: /Polish my words/ }));
    await screen.findByRole('list', { name: 'Suggested reviews' });
    const sent = JSON.parse(calls.find((c) => c.url.endsWith('/suggest')).options.body);
    expect(sent.notes).toBe('good pack fast reply');
  });

  it('shows the server message when a review is refused', async () => {
    mockApi({ post: { ok: false, status: 409, json: async () => ({ error: 'You have already reviewed this product. Thank you!' }) } });
    renderModal();
    fireEvent.click(screen.getByRole('radio', { name: /5 stars/ }));
    fireEvent.change(screen.getByLabelText(/Your review/), { target: { value: 'Second review of the same product.' } });
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: 'Sarah Miller' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already reviewed');
  });
});
