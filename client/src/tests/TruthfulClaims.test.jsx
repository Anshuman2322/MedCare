import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { CAROUSEL_CATEGORIES, categoriesWithProducts } from '../components/category/categoryData.js';
import { BUSINESS } from '../config/business.js';

// Claims the site used to make that the business cannot back up.
const UNSUPPORTED = [
  /FDA/i,
  /WHO Compliant/i,
  /Licensed Pharmac/i,
  /licensed pharmacists/i,
  /Happy Customers/i,
  /500K/i,
  /since 2010/i,
  /families across America/i,
  /online pharmacy/i,
  /Trusted by healthcare professionals/i,
  /Verified Healthcare Marketplace/i,
  /Certified Partner/i,
  /150\+/,
  /5,?000\+/,
  /1-800/,
  /\bEST\b/,
  // No mail forwarding exists for these yet, so mail sent to them is lost.
  /support@cureneed\.com/,
  /orders@cureneed\.com/,
];

const med = (i, category, brand) => ({
  _id: String(i),
  slug: `med-${i}`,
  name: `${brand} ${i} (Test Tablets)`,
  brand,
  category,
  price: 10,
  image: 'https://example.com/test.jpg',
  images: ['https://example.com/test.jpg'],
  inStock: true,
});

const catalogue = [
  med(1, 'ED', 'Tadalista'),
  med(2, 'ED', 'Cenforce'),
  med(3, 'Eye Care', 'Ocumoist'),
  med(4, 'Antibiotics', 'Azicip'),
];

beforeEach(() => {
  globalThis.fetch = vi.fn(async (url) => {
    // The site's own reviews: average 4.0 over 8 reviews.
    if (String(url).includes('/api/reviews')) {
      return { ok: true, json: async () => ({ reviews: [], summary: { average: 4, count: 8, distribution: {} }, page: 1, pages: 1, total: 0 }) };
    }
    return { ok: true, json: async () => catalogue };
  });
});

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

function expectNoUnsupportedClaims() {
  const text = document.body.textContent;
  for (const claim of UNSUPPORTED) expect(text).not.toMatch(claim);
}

describe('home page', () => {
  it('backs every number with the catalogue or the IndiaMART profile', async () => {
    renderAt('/');
    const label = await screen.findByText('Online chat');
    const strip = label.closest('.coverflow-stats');
    expect(within(strip).getByText('Products')).toBeInTheDocument();
    expect(within(strip).getByText('Countries')).toBeInTheDocument();
    expect(within(strip).getByText('24/7')).toBeInTheDocument();

    // Website 4.0 over 8 reviews mixed with IndiaMART 4.8 over 42: (32 + 201.6) / 50 = 4.67.
    const rating = (await screen.findByText(/by our buyers/)).closest('a');
    expect(rating).toHaveTextContent('Rated 4.7/5 by our buyers');
    expect(rating).toHaveAttribute('href', '/reviews');
    expect(document.body.textContent).not.toMatch(/42 buyer|IndiaMART rating|on IndiaMART\b(?! profile)/i);
    expectNoUnsupportedClaims();
  });

  it('quotes real IndiaMART reviews and links to all of them', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'What our buyers say' })).toBeInTheDocument();
    for (const review of BUSINESS.externalReviews) expect(screen.getByText(review.text)).toBeInTheDocument();
    const tags = screen.getAllByRole('link', { name: 'Verified via IndiaMART' });
    expect(tags).toHaveLength(BUSINESS.externalReviews.length);
    tags.forEach((tag) => expect(tag).toHaveAttribute('href', BUSINESS.indiamart.reviewsUrl));
    expect(screen.getByRole('link', { name: /Read all customer reviews/ })).toHaveAttribute('href', '/reviews');
    expect(screen.getByText('Overall rating')).toBeInTheDocument();
    const platforms = screen.getByRole('list', { name: 'Rating on each platform' });
    expect(within(platforms).getByText('CureNeed')).toBeInTheDocument();
    expect(within(platforms).getByText('IndiaMART')).toBeInTheDocument();
    expect(screen.getByText(`Buyers in ${BUSINESS.countries.length}+ countries`)).toBeInTheDocument();
  });

  it('only offers categories that have products, with their counts', async () => {
    renderAt('/');
    // The carousel renders each card twice for a seamless loop.
    expect((await screen.findAllByText('Browse 2 products')).length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Cardiology')).toHaveLength(0);
  });
});

describe('about page', () => {
  it('states only checkable facts', async () => {
    renderAt('/about');
    expect(await screen.findByText('Registered Exporter')).toBeInTheDocument();
    expect(screen.getByText('Products Listed')).toBeInTheDocument();
    expect(screen.getByAltText('IndiaMART TrustSEAL badge')).toHaveAttribute('src', '/indiamart_one.png');
    expect(screen.getByAltText('IndiaMART Verified Exporter badge')).toHaveAttribute('src', '/indiamart_two.png');
    // Badges carry no outbound links and no expiry date.
    expect(screen.queryByRole('link', { name: /View certificate|View profile/ })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/valid till/i);
    // GST and IEC are masked to their last 4 characters; the full numbers never render.
    expect(screen.getByText('•••••••••••N1ZD')).toBeInTheDocument();
    expect(screen.getByText('••••••766N')).toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/GHJPP|09GH/);
    expect(screen.queryByRole('button', { name: /Copy/ })).not.toBeInTheDocument();
    expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Rated 4.7\/5 by our buyers/ })).toHaveAttribute('href', '/reviews');
    // The IndiaMART profile and the GST record both say established 2024.
    expect(document.body.textContent).not.toMatch(/since 20(0|1)\d/i);
    expectNoUnsupportedClaims();
  });
});

describe('contact details', () => {
  it('show a working inbox and an internationally dialable number', async () => {
    renderAt('/contact');
    await screen.findByText('Contact Person');
    const emails = screen.getAllByRole('link', { name: 'cureneed@gmail.com' });
    emails.forEach((a) => expect(a).toHaveAttribute('href', 'mailto:cureneed@gmail.com'));
    expect(emails.length).toBeGreaterThan(1); // contact page and footer
    screen.getAllByRole('link', { name: '+91 77190 82210' }).forEach((a) => expect(a).toHaveAttribute('href', 'tel:+917719082210'));
    expect(screen.getByText('Henry Davis (CEO)')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Kanhaiya|Chandauli|Sakaldiha|4928 2406/);
    expectNoUnsupportedClaims();
  });
});

describe('categoriesWithProducts', () => {
  it('keeps every card until the catalogue has loaded', () => {
    expect(categoriesWithProducts(CAROUSEL_CATEGORIES, [], false)).toBe(CAROUSEL_CATEGORIES);
  });

  it('drops empty categories and maps ED to its card', () => {
    const cards = categoriesWithProducts(CAROUSEL_CATEGORIES, catalogue, true);
    expect(cards.map((c) => [c.name, c.count])).toEqual([
      ['Antibiotics', 1],
      ['Erectile Dysfunction', 2],
      ['Eye Care', 1],
    ]);
  });
});
