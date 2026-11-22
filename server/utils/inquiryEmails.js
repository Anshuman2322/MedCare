import { BUSINESS } from '../config/business.js';

// The two emails an inquiry produces, built from the saved inquiry so both say
// exactly what was recorded:
//   - buildTeamNotification: the lead, for the team inbox (ADMIN_EMAIL)
//   - buildCustomerConfirmation: "thank you" receipt for the customer
// Catalogue prices are in US dollars, so amounts here are always USD.

const PLURALS = { box: 'boxes', strip: 'strips', bottle: 'bottles', tube: 'tubes', vial: 'vials', jar: 'jars', sachet: 'sachets' };
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const formatUsd = (amount) => usd.format(amount);
const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');
const titleCase = (text) => (text ? text[0].toUpperCase() + text.slice(1) : '');
const unitName = (pack, count) => (count === 1 ? pack : PLURALS[pack] || `${pack}s`);

// Customer-typed text is shortened before it goes into an email.
function clip(value, max) {
  const text = trimmed(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function describeLine({ name, slug, quantity, variant = {}, price }, site) {
  const pack = trimmed(variant.packagingType).toLowerCase();
  const packSize = trimmed(variant.packSize);
  const qty = Math.max(1, Math.round(Number(quantity) || 1));
  const unitPrice = typeof price === 'number' && Number.isFinite(price) ? price : null;

  return {
    name: trimmed(name) || 'Medicine',
    url: site && trimmed(slug) ? `${site}/medicine/${encodeURIComponent(trimmed(slug))}` : '',
    variant: [variant.strength, variant.form, packSize].map(trimmed).filter(Boolean).join(' · '),
    packaging: pack ? `${titleCase(pack)}${packSize ? ` (${packSize})` : ''}` : '',
    unitPrice: unitPrice === null ? 'On request' : `${formatUsd(unitPrice)} per ${pack || 'unit'}`,
    listedPrice: unitPrice === null ? 'On request' : formatUsd(unitPrice),
    quantity: pack ? `${qty} ${unitName(pack, qty)}` : String(qty),
    total: unitPrice === null ? null : unitPrice * qty,
  };
}

// Everything both emails show, in display form. `site` is the storefront
// address for product links; without one, products are not linked.
export function describeInquiry(inquiry, site = '') {
  const items = Array.isArray(inquiry.items) ? inquiry.items : [];
  const lines = items.length
    ? items.map((item) =>
        describeLine({ name: item.medicineName, slug: item.slug, quantity: item.quantity, variant: item.variant || {}, price: item.listedPrice }, site)
      )
    : [
        describeLine({
          name: inquiry.medicineName,
          slug: inquiry.slug,
          quantity: inquiry.quantity,
          variant: inquiry.selectedVariant || {},
          price: inquiry.selectedVariant?.price,
        }, site),
      ];
  const priced = lines.filter((line) => line.total !== null);
  const createdAt = inquiry.createdAt ? new Date(inquiry.createdAt) : new Date();
  const isBestPrice = inquiry.requestType === 'best_price';

  return {
    referenceId: trimmed(inquiry.referenceId),
    isBestPrice,
    kind: isBestPrice ? 'best-price request' : 'inquiry',
    submittedOn: createdAt.toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' }),
    receivedAt: `${createdAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST`,
    customer: {
      name: clip(inquiry.customerName, 80),
      city: clip(inquiry.city, 120),
      email: trimmed(inquiry.email),
      phone: trimmed(inquiry.phone),
    },
    brand: clip(inquiry.brandPreference, 80),
    notes: clip(inquiry.additionalNotes, 1000),
    lines,
    total: priced.length ? priced.reduce((sum, line) => sum + line.total, 0) : null,
    allPriced: priced.length === lines.length,
  };
}

const totalLabel = (summary) => (summary.total === null ? 'Quoted on request' : formatUsd(summary.total));

function totalNote(summary) {
  if (summary.total === null) return 'Our team will include the price in your quote.';
  if (!summary.allPriced) return 'Items without a listed price are quoted separately.';
  return '';
}

// ---------------------------------------------------------------------------
// Shared HTML pieces (table-based, inline styles: what email clients render).
// ---------------------------------------------------------------------------

export const FONT = "font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";

function detailRows(rows) {
  return rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="${FONT}padding:7px 0;width:38%;font-size:13px;color:#64748b;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="${FONT}padding:7px 0;font-size:14px;color:#0f172a;font-weight:600;vertical-align:top;">${value}</td>
        </tr>`
    )
    .join('');
}

function heading(text) {
  return `<div style="${FONT}margin:26px 0 8px;font-size:12px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(text)}</div>`;
}

const productName = (line) =>
  line.url
    ? `<a href="${escapeHtml(line.url)}" style="color:#047857;text-decoration:none;">${escapeHtml(line.name)}</a>`
    : escapeHtml(line.name);

// One product: name and a details list. Several: a table with line totals.
function requestBlock(summary) {
  if (summary.lines.length === 1) {
    const [line] = summary.lines;
    return `
      <div style="${FONT}font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px;">${productName(line)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailRows([
          ['Variant', escapeHtml(line.variant)],
          ['Packaging', escapeHtml(line.packaging)],
          ['Brand preference', escapeHtml(summary.brand)],
          ['Unit price', escapeHtml(line.unitPrice)],
          ['Quantity', escapeHtml(line.quantity)],
        ])}
      </table>`;
  }

  const rows = summary.lines
    .map((line, index) => {
      const amount = line.total === null ? `${line.quantity} · price on request` : `${line.quantity} × ${line.listedPrice} each`;
      return `
        <tr>
          <td style="${FONT}padding:10px 8px 10px 0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;vertical-align:top;width:18px;">${index + 1}</td>
          <td style="${FONT}padding:10px 8px 10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;vertical-align:top;">
            ${productName(line)}
            ${line.variant ? `<div style="font-size:12px;font-weight:400;color:#64748b;margin-top:2px;">${escapeHtml(line.variant)}</div>` : ''}
            <div style="font-size:13px;font-weight:600;color:#334155;margin-top:4px;">${escapeHtml(amount)}</div>
          </td>
          <td style="${FONT}padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:700;text-align:right;vertical-align:top;white-space:nowrap;">${
            line.total === null ? 'On request' : escapeHtml(formatUsd(line.total))
          }</td>
        </tr>`;
    })
    .join('');
  const th = (text, align = 'left') =>
    `<th style="${FONT}padding:6px 8px 6px 0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;text-align:${align};border-bottom:1px solid #cbd5e1;">${text}</th>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead><tr>${th('#')}${th('Medicine')}${th('Total', 'right')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function totalBlock(summary) {
  const note = totalNote(summary);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
      <tr>
        <td style="${FONT}padding:14px 16px;font-size:14px;font-weight:700;color:#0f172a;">Estimated total</td>
        <td style="${FONT}padding:14px 16px;font-size:20px;font-weight:800;color:#047857;text-align:right;white-space:nowrap;">${escapeHtml(totalLabel(summary))}</td>
      </tr>
      ${note ? `<tr><td colspan="2" style="${FONT}padding:0 16px 12px;font-size:12px;color:#475569;">${escapeHtml(note)}</td></tr>` : ''}
    </table>`;
}

function notesBlock(summary) {
  if (!summary.notes) return '';
  return `
    ${heading('Additional requirement')}
    <div style="${FONT}padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;line-height:1.55;color:#334155;">${escapeHtml(summary.notes).replace(/\r?\n/g, '<br />')}</div>`;
}

export function page({ preheader, title, body, footer }) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;padding:0;background:#f1f5f9;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="${FONT}background:#047857;padding:22px 28px;color:#ffffff;">
                <div style="font-size:22px;font-weight:800;letter-spacing:-0.01em;">${escapeHtml(BUSINESS.name)}</div>
                <div style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#d1fae5;margin-top:2px;">${escapeHtml(BUSINESS.tagline)}</div>
              </td>
            </tr>
            <tr><td style="${FONT}padding:28px;">${body}</td></tr>
            <tr><td style="${FONT}background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 28px;font-size:12px;line-height:1.6;color:#64748b;">${footer}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const link = (href, text) => `<a href="${escapeHtml(href)}" style="color:#047857;text-decoration:none;font-weight:600;">${escapeHtml(text)}</a>`;
export const displayUrl = (url) => url.replace(/^https?:\/\//i, '');

// ---------------------------------------------------------------------------
// Customer confirmation
// ---------------------------------------------------------------------------

export function buildCustomerConfirmation(inquiry, { site = '' } = {}) {
  const summary = describeInquiry(inquiry, site);
  const kindTitle = summary.isBestPrice ? 'best-price request' : 'inquiry';
  const article = summary.isBestPrice ? 'a' : 'an';
  const subject = `Thank you for your ${kindTitle}${summary.referenceId ? ` (${summary.referenceId})` : ''} — ${BUSINESS.name}`;
  const intro = summary.isBestPrice
    ? 'We have received your best-price request. Our team will review your quantities and reply with the best available quote.'
    : 'We have received your inquiry. Our team will get back to you shortly with availability and pricing.';
  const firstLine = summary.lines[0];
  const button =
    summary.lines.length === 1 && firstLine.url
      ? { href: firstLine.url, label: 'View product' }
      : site
        ? { href: site, label: `Visit ${BUSINESS.name}` }
        : null;

  const body = `
    <h1 style="${FONT}margin:0 0 14px;font-size:22px;line-height:1.3;color:#0f172a;">Thank you for your ${escapeHtml(kindTitle)}</h1>
    <p style="${FONT}margin:0 0 10px;font-size:15px;color:#334155;">Hi ${escapeHtml(summary.customer.name || 'there')},</p>
    <p style="${FONT}margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
      <tr>
        <td style="${FONT}padding:14px 16px;">
          <div style="font-size:11px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.08em;">Reference ID</div>
          <div style="font-size:22px;font-weight:800;color:#064e3b;letter-spacing:0.02em;margin-top:2px;">${escapeHtml(summary.referenceId || 'Pending')}</div>
          <div style="font-size:12px;color:#475569;margin-top:4px;">Submitted on ${escapeHtml(summary.submittedOn)} · keep this ID for any follow-up</div>
        </td>
      </tr>
    </table>

    ${heading(summary.lines.length === 1 ? 'Your request' : `Your request (${summary.lines.length} medicines)`)}
    ${requestBlock(summary)}
    ${totalBlock(summary)}
    <p style="${FONT}margin:10px 0 0;font-size:12px;line-height:1.5;color:#64748b;">Prices are in US dollars (USD). The estimated total uses listed prices and is not an invoice; the final price, availability and delivery are confirmed in your quote.</p>

    ${heading('Your details')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRows([
        ['Name', escapeHtml(summary.customer.name)],
        [summary.lines.length > 1 ? 'Delivery location' : 'City', escapeHtml(summary.customer.city)],
        ['Email', escapeHtml(summary.customer.email)],
        ['Phone', escapeHtml(summary.customer.phone)],
      ])}
    </table>
    ${notesBlock(summary)}

    ${heading('What happens next')}
    <ol style="${FONT}margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#334155;">
      <li>Our team checks availability for your request.</li>
      <li>We send you a quote by email${summary.customer.phone ? ' or phone' : ''}.</li>
      <li>You confirm the quote before anything is finalised.</li>
    </ol>

    <p style="${FONT}margin:22px 0 0;font-size:14px;line-height:1.6;color:#334155;">
      Questions? Just reply to this email or call us on ${link(BUSINESS.phoneHref, BUSINESS.phone)}.
    </p>
    ${
      button
        ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px;">
      <tr>
        <td style="border-radius:10px;background:#047857;">
          <a href="${escapeHtml(button.href)}" style="${FONT}display:inline-block;padding:11px 20px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(button.label)}</a>
        </td>
      </tr>
    </table>`
        : ''
    }`;

  const footer = `
    <div style="font-weight:700;color:#0f172a;">${escapeHtml(BUSINESS.name)} · India</div>
    <div>${site ? `${link(site, displayUrl(site))} · ` : ''}${link(`mailto:${BUSINESS.email}`, BUSINESS.email)} · ${link(BUSINESS.phoneHref, BUSINESS.phone)} · ${link(BUSINESS.indiamartUrl, 'IndiaMART profile')}</div>
    <div style="margin-top:8px;">You are receiving this email because ${article} ${escapeHtml(kindTitle)} was submitted on our website with this email address. If that wasn't you, you can ignore this email.</div>`;

  const text = [
    `Thank you for your ${kindTitle}`,
    '',
    `Hi ${summary.customer.name || 'there'},`,
    intro,
    '',
    `Reference ID: ${summary.referenceId || 'Pending'}`,
    `Submitted on: ${summary.submittedOn}`,
    '',
    'YOUR REQUEST',
    ...summary.lines.flatMap((line, index) => [
      `${summary.lines.length > 1 ? `${index + 1}. ` : ''}${line.name}`,
      ...[
        ['Variant', line.variant],
        ['Packaging', line.packaging],
        ['Unit price', line.unitPrice],
        ['Quantity', line.quantity],
      ]
        .filter(([, value]) => value)
        .map(([label, value]) => `   ${label}: ${value}`),
      line.url ? `   ${line.url}` : null,
    ]),
    summary.brand ? `Brand preference: ${summary.brand}` : null,
    `Estimated total: ${totalLabel(summary)}${totalNote(summary) ? ` (${totalNote(summary)})` : ''}`,
    'Prices are in US dollars (USD). The final price, availability and delivery are confirmed in your quote.',
    '',
    'YOUR DETAILS',
    `Name: ${summary.customer.name}`,
    `${summary.lines.length > 1 ? 'Delivery location' : 'City'}: ${summary.customer.city}`,
    summary.customer.email ? `Email: ${summary.customer.email}` : null,
    summary.customer.phone ? `Phone: ${summary.customer.phone}` : null,
    summary.notes ? `Additional requirement: ${summary.notes}` : null,
    '',
    `Questions? Reply to this email or call ${BUSINESS.phone}.`,
    [BUSINESS.name, site && displayUrl(site), BUSINESS.email, BUSINESS.indiamartUrl].filter(Boolean).join(' · '),
  ]
    .filter((lineText) => lineText !== null)
    .join('\n');

  return {
    subject,
    html: page({ preheader: `Reference ID ${summary.referenceId}. ${intro}`, title: subject, body, footer }),
    text,
  };
}

// ---------------------------------------------------------------------------
// Team notification
// ---------------------------------------------------------------------------

export function buildTeamNotification(inquiry, { site = '' } = {}) {
  const summary = describeInquiry(inquiry, site);
  const label = summary.isBestPrice ? 'Best-Price Request' : 'Inquiry';
  const subject = `New ${label}${summary.referenceId ? ` ${summary.referenceId}` : ''} — ${BUSINESS.name}`;
  const { customer } = summary;
  const replyVia = customer.email
    ? 'Reply to this email to answer the customer directly. They have been sent a confirmation with these details.'
    : 'No email given. Reply by phone or WhatsApp.';

  const body = `
    <h1 style="${FONT}margin:0 0 6px;font-size:20px;color:#0f172a;">New ${escapeHtml(label.toLowerCase())}</h1>
    <p style="${FONT}margin:0 0 16px;font-size:14px;color:#475569;">${
      summary.isBestPrice ? 'A customer asked for your best available quote on the quantities below.' : 'A customer submitted a new inquiry.'
    }</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRows([
        ['Reference ID', escapeHtml(summary.referenceId || 'Pending')],
        ['Received', escapeHtml(summary.receivedAt)],
      ])}
    </table>

    ${heading('Customer')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRows([
        ['Name', escapeHtml(customer.name)],
        ['Email', customer.email ? link(`mailto:${customer.email}`, customer.email) : 'Not provided'],
        ['Phone', customer.phone ? escapeHtml(customer.phone) : 'Not provided'],
        [summary.lines.length > 1 ? 'Delivery location' : 'City', escapeHtml(customer.city || 'Not provided')],
      ])}
    </table>
    <div style="${FONT}margin-top:6px;font-size:12px;color:#475569;">${escapeHtml(replyVia)}</div>

    ${heading('Request')}
    ${requestBlock(summary)}
    ${totalBlock(summary)}
    ${notesBlock(summary)}`;

  const footer = `Sent by the ${escapeHtml(BUSINESS.name)} website for ${escapeHtml(summary.referenceId || 'a new request')}. Prices are listed catalogue prices in USD.`;

  return {
    subject,
    html: page({ preheader: `${customer.name} · ${summary.lines[0].name}`, title: subject, body, footer }),
  };
}
