import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MedicineDetails from '../pages/MedicineDetails.jsx';
import { CurrencyProvider } from '../store/useStore.jsx';

const open = (slug) =>
  render(
    <MemoryRouter initialEntries={[`/medicine/${slug}`]}>
      <CurrencyProvider>
        <Routes>
          <Route path="/medicine/:slug" element={<MedicineDetails />} />
        </Routes>
      </CurrencyProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('product page when the medicine cannot be shown', () => {
  it('shows the site 404 page, not a temporary-error message, for a slug that does not exist', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found', text: async () => '{"error":"Medicine not found"}' });
    open('no-such-medicine');

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Medicines' })).toHaveAttribute('href', '/shop');
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    // An unknown URL is expected, so it is not logged as a failure.
    expect(console.error).not.toHaveBeenCalled();
  });

  it('keeps a retry message for real server trouble', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable', text: async () => '{"error":"Service temporarily unavailable."}' });
    open('some-medicine');

    expect(await screen.findByText(/Unable to load medicine details right now/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to shop' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument();
  });
});
