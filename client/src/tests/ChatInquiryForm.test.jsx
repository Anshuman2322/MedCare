import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { InquiryForm } from '../components/chat/ChatForms.jsx';
import { createInquiry } from '../services/api';

vi.mock('../services/api', () => ({ createInquiry: vi.fn(async () => ({ referenceId: 'CN-2026-0077' })) }));

// The card the assistant sends with a quote form (see catalog.toMedicineCard).
const winolap = {
  id: 'm1',
  slug: 'winolap',
  name: 'Winolap (Olopatadine Hydrochloride Ophthalmic Solution IP 0.1% w/v)',
  price: 16.8,
  strength: '0.1% w/v',
  packSize: '5 ml Bottle',
  packagingType: 'Bottle',
};

beforeEach(() => createInquiry.mockClear());

const open = (props = {}) =>
  render(<InquiryForm medicine={winolap} currency="USD" onCancel={vi.fn()} onSubmitted={vi.fn()} {...props} />);

describe('chat quote form', () => {
  it("offers the product's own pack first, prefilled with the quantity from the chat", () => {
    open({ initialQuantity: 3 });
    const packs = screen.getByRole('radiogroup', { name: 'Packaging' });
    const [own, other] = within(packs).getAllByRole('radio');
    expect(own).toHaveTextContent('Bottle');
    expect(own).toHaveAttribute('aria-checked', 'true');
    expect(other).toHaveTextContent('Box');

    expect(screen.getByLabelText(/Quantity \(bottles\)/)).toHaveValue(3);
    expect(screen.getByText('$50.40')).toBeInTheDocument();
    expect(screen.getByText('$16.80 per bottle × 3 bottles')).toBeInTheDocument();

    fireEvent.click(other);
    expect(screen.getByText('On request')).toBeInTheDocument();
  });

  it('preselects the pack the customer named in the chat', () => {
    open({ initialQuantity: 5, initialPackaging: 'box' });
    const box = within(screen.getByRole('radiogroup', { name: 'Packaging' })).getByRole('radio', { name: 'Box' });
    expect(box).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText(/Quantity \(boxes\)/)).toHaveValue(5);
  });

  it('needs an email or a phone, and either one is enough', async () => {
    const onSubmitted = vi.fn();
    open({ onSubmitted, visitor: { name: 'Jane Doe', email: '' } });
    fireEvent.change(screen.getByLabelText(/Delivery Location/), { target: { value: 'Austin, USA' } });

    fireEvent.click(screen.getByRole('button', { name: 'Send Quote Request' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add your email or phone number');
    expect(createInquiry).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+1 512 555 0142' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Quote Request' }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith('CN-2026-0077'));
    expect(createInquiry.mock.calls[0][0]).toMatchObject({
      medicineId: 'm1',
      customer: { name: 'Jane Doe', city: 'Austin, USA', email: '', phone: '+1 512 555 0142' },
      product: { quantity: 1, packagingType: 'bottle', strength: '0.1% w/v' },
    });
  });
});
