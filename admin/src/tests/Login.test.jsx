import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';

// AuthProvider calls GET /api/auth/me on mount to check for an existing
// session — mock the shared axios instance so the test doesn't hit a real
// server, and resolves to "not logged in" (matches a fresh visit).
vi.mock('../api/axios.js', () => ({
  default: {
    get: vi.fn().mockRejectedValue({ response: { status: 401 } }),
    post: vi.fn(),
  },
}));

describe('Admin Login page', () => {
  it('renders the login form', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
