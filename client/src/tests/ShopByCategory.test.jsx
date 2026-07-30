import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  global.fetch = vi.fn().mockResolvedValue({
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
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/medicines'));
  });

  it('shows an error state when the API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });

    render(
      <MemoryRouter initialEntries={['/shop']}>
        <CurrencyProvider>
          <ShopByCategory />
        </CurrencyProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/unable to load medicines/i)).toBeInTheDocument();
  });
});
