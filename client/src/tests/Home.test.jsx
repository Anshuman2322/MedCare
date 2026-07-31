import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';

const mockMedicine = {
  _id: '1',
  slug: 'test-medicine',
  name: 'Test Medicine 100mg',
  category: 'Pain Relief',
  price: 25,
  image: 'https://example.com/test.jpg',
  images: ['https://example.com/test.jpg'],
  inStock: true,
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [mockMedicine],
  });
});

describe('Home page', () => {
  it('renders the hero and featured medicines without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/Trusted medicines\./i)).toBeInTheDocument();
    expect(await screen.findByText('Test Medicine 100mg')).toBeInTheDocument();
  });
});
