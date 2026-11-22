import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import InquiryModal from '../components/InquiryModal.jsx';
import { downloadInquiryPdf } from '../utils/inquiryPdf.js';

vi.mock('../utils/inquiryPdf.js', () => ({
  SITE_URL: 'https://www.cureneed.com',
  downloadInquiryPdf: vi.fn(async () => {}),
}));

const medicine = {
  _id: 'm1',
  slug: 'ibuprofen-400-mg-tablet',
  name: 'Ibuprofen Tablets BP 400 mg',
  manufacturer: 'Strava',
  variants: [{ strength: '400 mg', form: 'Tablet', packSize: 'Strip of 10 Tablets', packagingType: 'Strip', price: 15.28, stock: 100 }],
};

let posted;
beforeEach(() => {
  posted = null;
  downloadInquiryPdf.mockClear();
  globalThis.fetch = vi.fn(async (_url, options) => {
    posted = JSON.parse(options.body);
    return { ok: true, json: async () => ({ success: true, referenceId: 'CN-2026-0042', confirmationEmail: Boolean(posted.customer.email) }) };
  });
});

const open = () => render(<InquiryModal isOpen onClose={vi.fn()} medicine={medicine} currency="USD" />);

function goToQuantity() {
  fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByLabelText(/City/), { target: { value: 'Mumbai' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('inquiry modal', () => {
  it("prices the product's own pack by quantity and quotes the other pack", () => {
    open();
    goToQuantity();

    const packs = screen.getByRole('radiogroup', { name: 'Packaging' });
    const strip = within(packs).getByRole('radio', { name: /Strip/ });
    expect(strip).toHaveAttribute('aria-checked', 'true');
    expect(strip).toHaveTextContent('$15.28 per strip · Strip of 10 Tablets');
    expect(screen.getAllByText('$15.28').length).toBeGreaterThan(0); // total for 1

    fireEvent.change(screen.getByLabelText('Number of strips'), { target: { value: '12' } });
    expect(screen.getAllByText('$183.36').length).toBeGreaterThan(0);
    expect(screen.getByText('$15.28 per strip × 12 strips')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.getAllByText('$198.64').length).toBeGreaterThan(0);

    fireEvent.click(within(packs).getByRole('radio', { name: /Box/ }));
    expect(screen.getAllByText('Quoted on request').length).toBeGreaterThan(0);
    expect(screen.getByText(/Box pricing isn't listed/)).toBeInTheDocument();
    expect(screen.getByLabelText('Number of boxes')).toHaveValue(13);
  });

  it('needs an email or a phone number before going on, and sends what was chosen', async () => {
    open();
    goToQuantity();
    fireEvent.change(screen.getByLabelText('Number of strips'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> notes
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> contact

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please add your email or phone number');

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+91 77190 82210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> review
    expect(screen.getAllByText('3 strips').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$45.84').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }));
    expect(await screen.findByText(/CN-2026-0042/)).toBeInTheDocument();
    expect(posted.product).toMatchObject({ quantity: 3, packagingType: 'strip', strength: '400 mg' });
    expect(posted.customer).toMatchObject({ phone: '+91 77190 82210', email: null });

    // No email given, so no "on its way" line; the PDF has what was sent.
    expect(screen.queryByText(/on its way to/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => expect(downloadInquiryPdf).toHaveBeenCalledTimes(1));
    const [summary] = downloadInquiryPdf.mock.calls[0];
    expect(summary).toMatchObject({
      kind: 'inquiry',
      referenceId: 'CN-2026-0042',
      total: '$45.84',
      customer: { name: 'Jane Doe', city: 'Mumbai', phone: '+91 77190 82210', email: '' },
    });
    expect(summary.lines[0]).toMatchObject({
      name: 'Ibuprofen Tablets BP 400 mg',
      url: 'https://www.cureneed.com/medicine/ibuprofen-400-mg-tablet',
      variant: '400 mg · Tablet · Strip of 10 Tablets',
      packaging: 'Strip (Strip of 10 Tablets)',
      unitPrice: '$15.28 per strip',
      quantity: '3 strips',
      total: '$45.84',
    });
  });

  it('says where the confirmation email went and reports a failed PDF', async () => {
    downloadInquiryPdf.mockRejectedValueOnce(new Error('no canvas'));
    open();
    goToQuantity();
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Packaging' })).getByRole('radio', { name: /Box/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> notes
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> contact
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // -> review
    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }));

    expect(await screen.findByText(/on its way to/)).toHaveTextContent('A confirmation with these details is on its way to jane@example.com.');
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't create the PDF");

    const summary = downloadInquiryPdf.mock.calls.at(-1)[0];
    // Another pack than the listed one: no pack size, no listed price.
    expect(summary.lines[0]).toMatchObject({ variant: '400 mg · Tablet', packaging: 'Box', unitPrice: 'On request', total: null });
    expect(summary.total).toBe('Quoted on request');
  });
});
