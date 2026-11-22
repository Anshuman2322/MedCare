import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import FAQ from '../pages/FAQ.jsx';

const items = [
  { id: 'how-to-order', category: 'ordering', question: 'How do I place an order?', answer: 'Send a quote request.', alternatives: ['how to buy'], keywords: ['order'], priority: 10, related: ['payment-methods'], links: [], escalate: false },
  { id: 'payment-methods', category: 'payments', question: 'What payment methods do you accept?', answer: 'The team shares them with your quote.', alternatives: [], keywords: ['pay'], priority: 9, related: [], links: [], escalate: true },
  { id: 'return-policy', category: 'returns', question: 'What is your return or refund policy?', answer: "We don't have a published return or refund policy.", alternatives: ['refund'], keywords: ['refund'], priority: 8, related: [], links: [], escalate: true },
];
const payload = {
  categories: [
    { id: 'ordering', label: 'Ordering & Quotes', icon: '🧭', count: 1 },
    { id: 'payments', label: 'Payments', icon: '💳', count: 1 },
    { id: 'returns', label: 'Returns & Problems', icon: '↩️', count: 1 },
  ],
  items,
  popular: ['how-to-order', 'payment-methods'],
  support: { email: 'team@example.com', phone: '+91 00000 00000' },
};

let calls;
function mockApi({ failList = false, search } = {}) {
  calls = [];
  globalThis.fetch = vi.fn(async (url, options = {}) => {
    const u = String(url);
    calls.push({ url: u, options });
    if (u.includes('/feedback')) return { ok: true, status: 201, json: async () => ({ ok: true }) };
    if (u.includes('/search')) return { ok: true, json: async () => search || { results: [] } };
    if (failList) return { ok: false, status: 500, json: async () => ({}) };
    return { ok: true, json: async () => payload };
  });
}

const renderPage = (route = '/faq') =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <FAQ />
      </MemoryRouter>
    </HelmetProvider>
  );

// The question text also appears as a "popular" shortcut; the accordion header is the one with aria-expanded.
const question = (name) => screen.getAllByRole('button', { name }).find((button) => button.hasAttribute('aria-expanded'));
const findQuestion = async (name) => {
  await waitFor(() => expect(question(name)).toBeTruthy());
  return question(name);
};

beforeEach(() => {
  window.localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});

describe('FAQ page', () => {
  it('shows a loading state, then the questions, with popular ones first', async () => {
    mockApi();
    renderPage();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    expect(await findQuestion('How do I place an order?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Popular questions' })).toBeInTheDocument();
    expect(screen.getByText('3 questions')).toBeInTheDocument();
  });

  it('opens an answer as an accordion', async () => {
    mockApi();
    renderPage();
    const button = await findQuestion('How do I place an order?');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Send a quote request.')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Send a quote request.')).not.toBeInTheDocument();
  });

  it('filters by category', async () => {
    mockApi();
    renderPage();
    await findQuestion('How do I place an order?');
    fireEvent.click(screen.getByRole('button', { name: /Payments/ }));
    expect(screen.queryAllByRole('button', { name: 'How do I place an order?' })).toHaveLength(0);
    expect(question('What payment methods do you accept?')).toBeInTheDocument();
  });

  it('searches, and shows the verified fallback when nothing matches', async () => {
    mockApi({ search: { results: [{ id: 'return-policy', score: 1 }] } });
    renderPage();
    await findQuestion('How do I place an order?');
    fireEvent.change(screen.getByLabelText('Search questions'), { target: { value: 'refund' } });
    await waitFor(() => expect(screen.getByText('1 question for “refund”')).toBeInTheDocument());
    expect(question('What is your return or refund policy?')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search questions'), { target: { value: 'zzzqq' } });
    expect(await screen.findByText('No matching question')).toBeInTheDocument();
    expect(screen.getByText(/I don't have verified information about that yet/)).toBeInTheDocument();
  });

  it('records helpful feedback once per question', async () => {
    mockApi();
    renderPage();
    fireEvent.click(await findQuestion('How do I place an order?'));
    fireEvent.click(screen.getByRole('button', { name: /Yes/ }));
    expect(await screen.findByText('Thanks for your feedback!')).toBeInTheDocument();
    const vote = calls.find((call) => call.url.endsWith('/api/faq/how-to-order/feedback'));
    expect(JSON.parse(vote.options.body)).toEqual({ helpful: true });
    expect(screen.queryByRole('button', { name: /Yes/ })).not.toBeInTheDocument();
  });

  it('offers the team on questions that need a person', async () => {
    mockApi();
    renderPage();
    fireEvent.click(await findQuestion('What payment methods do you accept?'));
    const handler = vi.fn();
    window.addEventListener('cureneed:open-chat', handler);
    fireEvent.click(screen.getByRole('button', { name: 'Talk to our team' }));
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('cureneed:open-chat', handler);
  });

  it('shows contact details for support', async () => {
    mockApi();
    renderPage();
    await findQuestion('How do I place an order?');
    expect(screen.getByRole('link', { name: /team@example\.com/ })).toHaveAttribute('href', 'mailto:team@example.com');
  });

  it('shows an error with a retry when the questions cannot be loaded', async () => {
    mockApi({ failList: true });
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load/i);
    mockApi();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await findQuestion('How do I place an order?')).toBeInTheDocument();
  });
});
