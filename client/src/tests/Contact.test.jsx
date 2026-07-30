import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from '../pages/Contact.jsx';

describe('Contact page', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <Contact />
      </MemoryRouter>
    );

    expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
  });
});
