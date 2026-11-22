import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ShopByCategory from '../pages/ShopByCategory.jsx';
import { CurrencyProvider } from '../store/useStore.jsx';

const mockMedicine = {
  _id: '1',
  slug: 'test-medicine',
  name: 'Test Medicine 100mg',
  category: 'Pain Relief',
  manufacturer: 'Test Pharma',
  form: 'Tablet',
  price: 25,
  image: '',
  images: [],
  inStock: true,
};

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [mockMedicine],
  });
});

describe('ShopByCategory page', () => {
  it('loads and lists medicines from the API', async () => {
    render(
      <MemoryRouter initialEntries={['/shop']}>
        <CurrencyProvider>
          <ShopByCategory />
        </CurrencyProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Test Medicine 100mg')).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/medicines'));
  });

  it('shows an error state when the API call fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });

    render(
      <MemoryRouter initialEntries={['/shop']}>
        <CurrencyProvider>
          <ShopByCategory />
        </CurrencyProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/unable to load medicines/i)).toBeInTheDocument();
  });

  it('shows four rows at a time with a "Show more" button', async () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...mockMedicine,
      _id: String(i + 1),
      slug: `medicine-${i + 1}`,
      name: `Medicine ${String(i + 1).padStart(2, '0')}`,
      price: 10 + i,
    }));
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => many });
    window.innerWidth = 1280; // 3 columns -> 4 rows = 12 products

    render(
      <MemoryRouter initialEntries={['/shop']}>
        <CurrencyProvider>
          <ShopByCategory />
        </CurrencyProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Showing 12 of 20 products')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Medicine \d+$/ })).toHaveLength(12);

    fireEvent.click(screen.getByRole('button', { name: /Show more products/ }));
    expect(screen.getAllByRole('link', { name: /^Medicine \d+$/ })).toHaveLength(20);
    expect(screen.getByText('Showing 20 products')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show more products/ })).not.toBeInTheDocument();

    // A new sort starts again from the first four rows.
    fireEvent.change(screen.getByLabelText('Sort by:'), { target: { value: 'Name: A-Z' } });
    expect(screen.getAllByRole('link', { name: /^Medicine \d+$/ })).toHaveLength(12);

    // List view shows 8 at a time.
    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getAllByRole('link', { name: /^Medicine \d+$/ })).toHaveLength(8);
    expect(screen.getByRole('button', { name: /12 more/ })).toBeInTheDocument();
  });
});
