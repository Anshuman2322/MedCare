import { describe, it, expect } from 'vitest';
import { buildInquiryPdf, pdfText, pdfFileName } from '../utils/inquiryPdf.js';

const summary = {
  kind: 'inquiry',
  referenceId: 'CN-2026-0018',
  submittedAt: new Date('2026-11-11T16:16:00'),
  currency: 'USD',
  lines: [
    {
      name: 'Winolap Eye Drops',
      url: 'https://www.cureneed.com/medicine/winolap-eye-drops-5-ml',
      variant: '0.1% w/v · Eye Drops · 5 ml Bottle',
      packaging: 'Bottle (5 ml Bottle)',
      unitPrice: '$16.80 per bottle',
      quantity: '3 bottles',
      total: '$50.40',
    },
  ],
  total: '$50.40',
  customer: { name: 'Jane Doe', city: 'Austin', email: 'jane@example.com', phone: '+1 512 555 0142' },
  notes: 'Need it within 2 weeks',
};

// jsPDF writes each text run as "(text) Tj" when the file isn't compressed.
async function rawPdf(input) {
  const doc = await buildInquiryPdf(input, { compress: false });
  return { doc, raw: doc.output() };
}

describe('inquiry PDF', () => {
  it('has the company, reference, request, total, customer and links', async () => {
    const { doc, raw } = await rawPdf(summary);
    expect(doc.getNumberOfPages()).toBe(1);
    for (const text of [
      'CureNeed',
      'CN-2026-0018',
      'Thank you for your inquiry',
      'Winolap Eye Drops',
      '$16.80 per bottle',
      '3 bottles',
      '$50.40',
      'Jane Doe',
      'jane@example.com',
      'Need it within 2 weeks',
      'cureneed@gmail.com',
      'IndiaMART profile',
    ]) {
      expect(raw).toContain(text);
    }
    expect(raw).toContain('/URI (https://www.cureneed.com/medicine/winolap-eye-drops-5-ml)');
    expect(raw).toContain('/URI (https://www.indiamart.com/cureneed/)');
    expect(raw).toContain('/URI (https://www.cureneed.com)');
    expect(raw).toContain('www.cureneed.com');
  });

  it('lists every medicine of a multi-medicine request', async () => {
    const { raw } = await rawPdf({
      ...summary,
      kind: 'best_price',
      referenceId: 'BP-2026-0003',
      lines: [
        { name: 'First Med', quantity: '10 strips', unitPrice: '$4.00', total: '$40.00' },
        { name: 'Second Med', quantity: '2 boxes', unitPrice: null, total: null },
      ],
      total: '$40.00',
      totalNote: 'Items without a listed price are quoted separately.',
    });
    for (const text of ['Thank you for your best-price request', 'BP-2026-0003', 'First Med', '$40.00', 'Second Med', 'On request', 'quoted separately']) {
      expect(raw).toContain(text);
    }
  });

  it('runs onto a second page when the request is long', async () => {
    const lines = Array.from({ length: 14 }, (_, i) => ({ name: `Medicine ${i + 1}`, variant: '10 mg · Tablet', quantity: '1 strip', unitPrice: '$1.00', total: '$1.00' }));
    const { doc } = await rawPdf({ ...summary, lines, total: '$14.00' });
    expect(doc.getNumberOfPages()).toBe(2);
  });

  it('keeps text printable with the built-in fonts', () => {
    expect(pdfText('₹1356.95')).toBe('Rs. 1356.95');
    expect(pdfText('José Müller')).toBe('José Müller');
    expect(pdfText('Łukasz – “quote”')).toBe('Lukasz - "quote"');
    expect(pdfText('张伟')).toBe('??');
    expect(pdfFileName('CN-2026-0018')).toBe('CureNeed-CN-2026-0018.pdf');
  });
});
