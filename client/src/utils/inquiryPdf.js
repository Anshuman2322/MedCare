import { CONTACT } from '../config/contact.js';
import { BUSINESS } from '../config/business.js';
import { withCloudinaryTransform } from './medicineDisplay.js';

// A one-page (or more, for long requests) PDF copy of a submitted inquiry or
// best-price request, built in the browser from what the customer just saw.
// jsPDF is loaded only when someone downloads, so it never slows the site.
//
// summary = {
//   kind: 'inquiry' | 'best_price', referenceId, submittedAt (Date), currency,
//   image?, lines: [{ name, url?, manufacturer?, variant?, packaging?, unitPrice?, quantity, total? }],
//   total, totalNote?, brand?, customer: { name, city, email?, phone? }, cityLabel?, notes?
// }

// The storefront's public address for links in the PDF. VITE_PUBLIC_SITE_URL
// can point them elsewhere (e.g. a staging site).
export const SITE_URL = String(import.meta.env.VITE_PUBLIC_SITE_URL || 'https://www.cureneed.com').replace(/\/+$/, '');

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16;
const CONTENT_W = PAGE_W - M * 2;
const BOTTOM = 273;

const GREEN = [4, 120, 87];
const DEEP_GREEN = [6, 78, 59];
const DARK = [15, 23, 42];
const SLATE = [51, 65, 85];
const MUTED = [100, 116, 139];
const LINE = [226, 232, 240];
const MINT = [236, 253, 245];
const MINT_BORDER = [167, 243, 208];
const SOFT = [248, 250, 252];

// Letters with no Latin-1 form and no accent to strip.
const PLAIN_LETTERS = { '\u0141': 'L', '\u0142': 'l', '\u0110': 'D', '\u0111': 'd', '\u0126': 'H', '\u0127': 'h', '\u0152': 'OE', '\u0153': 'oe', '\u0131': 'i', '\u014A': 'N', '\u014B': 'n', '\u0166': 'T', '\u0167': 't' };

// The built-in PDF fonts cover Latin-1 only, so anything else is spelled out
// (₹ -> "Rs.") or reduced to its plain letter, never printed as garbage.
export function pdfText(value) {
  const text = String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u20B9\s?/g, 'Rs. ')
    .replace(/\u20AC\s?/g, 'EUR ')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u25CF]/g, '\u00B7')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .normalize('NFC');
  return Array.from(text)
    .map((ch) => {
      if (ch === '\n' || (ch >= ' ' && ch.charCodeAt(0) <= 0xff && !(ch >= '\x7f' && ch < '\xa0'))) return ch;
      if (PLAIN_LETTERS[ch]) return PLAIN_LETTERS[ch];
      const plain = ch.normalize('NFKD').replace(/[\u0300-\u036F]/g, '');
      return /^[\x20-\x7e\xa0-\xff]+$/.test(plain) ? plain : '?';
    })
    .join('');
}

export const pdfFileName = (referenceId) =>
  `CureNeed-${String(referenceId || 'inquiry').replace(/[^A-Za-z0-9-]+/g, '-')}.pdf`;

// Product photo as a JPEG data URL, or null when it can't be read in time
// (blocked by the browser, slow network...). The PDF is fine without it.
export function loadImage(src, timeoutMs = 4000) {
  if (!src || typeof Image === 'undefined' || typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(null), timeoutMs);
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      try {
        const scale = Math.min(1, 640 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
        const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        return resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.88), width, height });
      } catch {
        return resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = withCloudinaryTransform(src, 640);
  });
}

function currencyNote(currency) {
  const base = 'The estimated total uses listed prices and is not an invoice; the final price, availability and delivery are confirmed in your quote.';
  return !currency || currency === 'USD'
    ? `Prices are in US dollars (USD). ${base}`
    : `Prices are shown in ${currency}, converted from US dollars at indicative rates. ${base}`;
}

// `compress: false` keeps the text readable in the raw file (used by tests).
export async function buildInquiryPdf(summary, { image = null, compress = true } = {}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress });
  const isBestPrice = summary.kind === 'best_price';
  const kindLabel = isBestPrice ? 'best-price request' : 'inquiry';
  const reference = pdfText(summary.referenceId || 'Pending');
  let y = 0;

  const font = (size, style = 'normal', color = DARK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const wrap = (text, width, size, style = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    return doc.splitTextToSize(pdfText(text), width);
  };
  const lineHeight = (size) => size * 0.43;
  const ensure = (height) => {
    if (y + height > BOTTOM) {
      doc.addPage();
      y = 20;
    }
  };
  // A heading never sits alone at the bottom of a page: `keepWith` is how much
  // of what follows must fit under it.
  const section = (title, keepWith = 0) => {
    ensure(keepWith + 16);
    y += 7;
    font(8, 'bold', GREEN);
    doc.text(title.toUpperCase(), M, y, { charSpace: 0.5 });
    y += 2.5;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(M, y, PAGE_W - M, y);
    y += 5;
  };

  doc.setProperties({
    title: `CureNeed ${kindLabel} ${reference}`,
    subject: `Summary of ${kindLabel} ${reference}`,
    author: 'CureNeed',
    creator: 'CureNeed website',
  });

  // Header band with the CureNeed name and a capsule mark.
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, 30, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 8, 8, 15, 4, 4, 'F');
  doc.setFillColor(...MINT_BORDER);
  doc.roundedRect(M, 15.5, 8, 7.5, 4, 4, 'F');
  doc.rect(M, 15.5, 8, 3.5, 'F');
  font(21, 'bold', [255, 255, 255]);
  doc.text('CureNeed', M + 12.5, 17);
  font(7.5, 'normal', [209, 250, 229]);
  doc.text('TRUST IN EVERY DOSE', M + 12.5, 22.5, { charSpace: 0.6 });
  font(10, 'bold', [255, 255, 255]);
  doc.text(isBestPrice ? 'Best-price request' : 'Inquiry summary', PAGE_W - M, 14.5, { align: 'right' });
  if (SITE_URL) {
    const siteLabel = pdfText(SITE_URL.replace(/^https?:\/\//, ''));
    font(8.5, 'normal', [209, 250, 229]);
    doc.text(siteLabel, PAGE_W - M, 20.5, { align: 'right' });
    const width = doc.getTextWidth(siteLabel);
    doc.link(PAGE_W - M - width, 17, width, 4.5, { url: SITE_URL });
  }

  // Thank-you note.
  y = 43;
  font(17, 'bold', DARK);
  doc.text(`Thank you for your ${kindLabel}`, M, y);
  y += 7;
  const intro = isBestPrice
    ? 'we have received your best-price request. Our team will review your quantities and reply with the best available quote.'
    : 'we have received your inquiry. Our team will get back to you shortly with availability and pricing.';
  const introLines = wrap(`Hi ${summary.customer?.name || 'there'}, ${intro}`, CONTENT_W, 10);
  font(10, 'normal', SLATE);
  doc.text(introLines, M, y, { lineHeightFactor: 1.35 });
  y += introLines.length * lineHeight(10) * 1.1 + 4;

  // Reference card.
  doc.setFillColor(...MINT);
  doc.setDrawColor(...MINT_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CONTENT_W, 20, 3, 3, 'FD');
  font(7.5, 'bold', GREEN);
  doc.text('REFERENCE ID', M + 5, y + 6.5, { charSpace: 0.4 });
  doc.text('SUBMITTED', PAGE_W - M - 5, y + 6.5, { align: 'right' });
  font(16, 'bold', DEEP_GREEN);
  doc.text(reference, M + 5, y + 14.5);
  const submitted = summary.submittedAt instanceof Date ? summary.submittedAt : new Date();
  font(9.5, 'bold', DARK);
  doc.text(pdfText(submitted.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })), PAGE_W - M - 5, y + 12, { align: 'right' });
  font(8, 'normal', MUTED);
  doc.text('Keep this ID for any follow-up', PAGE_W - M - 5, y + 16.5, { align: 'right' });
  y += 20;

  // What was asked for.
  const lines = summary.lines || [];
  section(lines.length > 1 ? `Your request (${lines.length} medicines)` : 'Your request');

  if (lines.length === 1) {
    const [line] = lines;
    const photo = image && image.dataUrl ? image : null;
    const photoBox = 42;
    const textW = photo ? CONTENT_W - photoBox - 6 : CONTENT_W;
    const top = y;

    if (photo) {
      doc.setDrawColor(...LINE);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(PAGE_W - M - photoBox, top, photoBox, photoBox, 2.5, 2.5, 'FD');
      const fit = Math.min((photoBox - 4) / photo.width, (photoBox - 4) / photo.height);
      const w = photo.width * fit;
      const h = photo.height * fit;
      doc.addImage(photo.dataUrl, 'JPEG', PAGE_W - M - photoBox + (photoBox - w) / 2, top + (photoBox - h) / 2, w, h);
    }

    const nameLines = wrap(line.name, textW, 12.5, 'bold');
    font(12.5, 'bold', line.url ? GREEN : DARK);
    y += 4;
    doc.text(nameLines, M, y, { lineHeightFactor: 1.25 });
    if (line.url) doc.link(M, y - 4.5, textW, nameLines.length * 5.5 + 1, { url: line.url });
    y += (nameLines.length - 1) * 5.6 + 2;
    if (line.manufacturer) {
      y += 3.5;
      font(9, 'normal', MUTED);
      doc.text(pdfText(line.manufacturer), M, y);
    }
    y += 3;

    const rows = [
      ['Variant', line.variant],
      ['Packaging', line.packaging],
      ['Brand', summary.brand && summary.brand !== line.manufacturer ? summary.brand : ''],
      ['Unit price', line.unitPrice],
      ['Quantity', line.quantity],
    ].filter(([, value]) => value);
    for (const [label, value] of rows) {
      const valueLines = wrap(value, textW - 34, 10, 'bold');
      y += 5.2;
      font(9, 'normal', MUTED);
      doc.text(label, M, y);
      font(10, 'bold', DARK);
      doc.text(valueLines, M + 34, y, { lineHeightFactor: 1.25 });
      y += (valueLines.length - 1) * 4.6;
    }
    y = Math.max(y + 3, photo ? top + photoBox + 2 : 0);
  } else {
    font(7.5, 'bold', MUTED);
    doc.text('#', M, y);
    doc.text('MEDICINE', M + 8, y, { charSpace: 0.3 });
    doc.text('TOTAL', PAGE_W - M, y, { align: 'right' });
    y += 2;
    doc.setDrawColor(...LINE);
    doc.line(M, y, PAGE_W - M, y);

    lines.forEach((line, index) => {
      const nameLines = wrap(line.name, CONTENT_W - 44, 10, 'bold');
      const detail = [line.variant].filter(Boolean).join('');
      const detailLines = detail ? wrap(detail, CONTENT_W - 44, 8.5) : [];
      const amount = line.unitPrice ? `${line.quantity} × ${line.unitPrice} each` : `${line.quantity} · price on request`;
      const rowH = nameLines.length * 4.5 + detailLines.length * 3.8 + 9;
      ensure(rowH + 2);
      y += 5.5;
      font(9, 'normal', MUTED);
      doc.text(String(index + 1), M, y);
      font(10, 'bold', line.url ? GREEN : DARK);
      doc.text(nameLines, M + 8, y, { lineHeightFactor: 1.2 });
      if (line.url) doc.link(M + 8, y - 4, CONTENT_W - 44, nameLines.length * 4.5 + 1, { url: line.url });
      font(10, 'bold', DARK);
      doc.text(pdfText(line.total || 'On request'), PAGE_W - M, y, { align: 'right' });
      y += (nameLines.length - 1) * 4.5;
      if (detailLines.length) {
        y += 4;
        font(8.5, 'normal', MUTED);
        doc.text(detailLines, M + 8, y, { lineHeightFactor: 1.2 });
        y += (detailLines.length - 1) * 3.8;
      }
      y += 4.5;
      font(9, 'bold', SLATE);
      doc.text(pdfText(amount), M + 8, y);
      y += 3;
      doc.setDrawColor(...LINE);
      doc.line(M, y, PAGE_W - M, y);
    });
    y += 2;
  }

  // Estimated total.
  const noteLines = summary.totalNote ? wrap(summary.totalNote, CONTENT_W - 10, 8.5) : [];
  const totalH = 13 + noteLines.length * 3.9 + (noteLines.length ? 1.5 : 0);
  ensure(totalH + 14);
  y += 2;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(M, y, CONTENT_W, totalH, 3, 3, 'FD');
  font(11, 'bold', DARK);
  doc.text('Estimated total', M + 5, y + 8.3);
  font(15, 'bold', GREEN);
  doc.text(pdfText(summary.total || 'Quoted on request'), PAGE_W - M - 5, y + 8.8, { align: 'right' });
  if (noteLines.length) {
    font(8.5, 'normal', SLATE);
    doc.text(noteLines, M + 5, y + 14, { lineHeightFactor: 1.25 });
  }
  y += totalH + 5;
  const disclaimer = wrap(currencyNote(summary.currency), CONTENT_W, 8);
  font(8, 'normal', MUTED);
  doc.text(disclaimer, M, y, { lineHeightFactor: 1.3 });
  y += (disclaimer.length - 1) * 3.6 + 1;

  // Customer details in two columns; a value too long for half the width
  // (a long email address) gets a row of its own instead of being broken.
  section('Your details');
  const customer = summary.customer || {};
  const cells = [
    ['Name', customer.name],
    [summary.cityLabel || 'City', customer.city],
    ['Email', customer.email],
    ['Phone', customer.phone],
  ].filter(([, value]) => value);
  const colW = CONTENT_W / 2;
  const tooWide = ([, value]) => {
    font(10, 'bold');
    return doc.getTextWidth(pdfText(value)) > colW - 6;
  };
  const detailRows = [];
  let waiting = null;
  for (const cell of cells) {
    if (tooWide(cell)) {
      if (waiting) detailRows.push([waiting]);
      detailRows.push([cell]);
      waiting = null;
    } else if (waiting) {
      detailRows.push([waiting, cell]);
      waiting = null;
    } else {
      waiting = cell;
    }
  }
  if (waiting) detailRows.push([waiting]);
  for (const row of detailRows) {
    const width = row.length === 1 && tooWide(row[0]) ? CONTENT_W : colW - 6;
    const pair = row.map(([label, value]) => [label, wrap(value, width, 10, 'bold')]);
    const rowH = 5 + Math.max(...pair.map(([, valueLines]) => valueLines.length)) * 4.6 + 2;
    ensure(rowH);
    pair.forEach(([label, valueLines], col) => {
      const x = M + col * colW;
      font(7.5, 'bold', MUTED);
      doc.text(label.toUpperCase(), x, y, { charSpace: 0.3 });
      font(10, 'bold', DARK);
      doc.text(valueLines, x, y + 5, { lineHeightFactor: 1.25 });
    });
    y += rowH;
  }

  if (summary.notes) {
    section('Additional requirement');
    const noteText = wrap(summary.notes, CONTENT_W - 10, 9.5);
    let start = 0;
    // Long notes may run onto the next page; each part gets its own box.
    while (start < noteText.length) {
      ensure(14);
      const fits = Math.max(1, Math.floor((BOTTOM - y - 8) / 4.4));
      const part = noteText.slice(start, start + fits);
      const boxH = part.length * 4.4 + 6;
      doc.setFillColor(...SOFT);
      doc.setDrawColor(...LINE);
      doc.roundedRect(M, y - 1, CONTENT_W, boxH, 2.5, 2.5, 'FD');
      font(9.5, 'normal', SLATE);
      doc.text(part, M + 5, y + 4, { lineHeightFactor: 1.3 });
      y += boxH + 1;
      start += part.length;
    }
  }

  section('What happens next', 24);
  const steps = [
    'Our team checks availability for your request.',
    `We send you a quote by ${[customer.email && 'email', customer.phone && 'phone'].filter(Boolean).join(' or ') || 'email or phone'}.`,
    'You confirm the quote before anything is finalised.',
  ];
  steps.forEach((step, index) => {
    font(9.5, 'bold', GREEN);
    doc.text(`${index + 1}.`, M, y);
    font(9.5, 'normal', SLATE);
    doc.text(pdfText(step), M + 6, y);
    y += 5.2;
  });
  y += 1.5;
  font(9.5, 'normal', SLATE);
  doc.text(pdfText(`Questions? Email ${CONTACT.email} or call ${CONTACT.phone} and mention ${reference}.`), M, y);

  // Footer with links on every page.
  const pages = doc.getNumberOfPages();
  const links = [
    SITE_URL ? [SITE_URL.replace(/^https?:\/\//, ''), SITE_URL] : null,
    [CONTACT.email, `mailto:${CONTACT.email}`],
    [CONTACT.phone, CONTACT.phoneHref],
    ['IndiaMART profile', BUSINESS.indiamart.profileUrl],
  ].filter(Boolean);
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(M, PAGE_H - 19, PAGE_W - M, PAGE_H - 19);
    font(8.5, 'bold', DARK);
    doc.text('CureNeed · India', M, PAGE_H - 13.5);
    font(8, 'normal', MUTED);
    doc.text(`Page ${page} of ${pages}`, PAGE_W - M, PAGE_H - 13.5, { align: 'right' });
    let x = M;
    links.forEach(([label, url], index) => {
      font(8, 'normal', GREEN);
      doc.textWithLink(pdfText(label), x, PAGE_H - 9, { url });
      x += doc.getTextWidth(pdfText(label));
      if (index < links.length - 1) {
        font(8, 'normal', MUTED);
        doc.text('  ·  ', x, PAGE_H - 9);
        x += doc.getTextWidth('  ·  ');
      }
    });
  }

  return doc;
}

export async function downloadInquiryPdf(summary) {
  const image = summary.image ? await loadImage(summary.image) : null;
  const doc = await buildInquiryPdf(summary, { image });
  doc.save(pdfFileName(summary.referenceId));
}
