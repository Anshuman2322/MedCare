import { BUSINESS, siteUrl } from '../config/business.js';
import { escapeHtml, FONT, page, link, displayUrl } from './inquiryEmails.js';

// A team reply in the support chat, emailed to a visitor who has left the
// site, so it isn't lost. They can answer by replying to the email.
export function buildChatReplyEmail({ visitorName, agentName, text }) {
  const first = String(visitorName || '').trim().split(/\s+/)[0];
  const from = agentName || `${BUSINESS.name} Support`;
  const site = siteUrl();
  const subject = `${from} replied to your chat — ${BUSINESS.name}`;
  const reply = String(text || '').trim().slice(0, 2000);

  const body = `
    <p style="${FONT}margin:0 0 10px;font-size:15px;color:#334155;">Hi ${escapeHtml(first || 'there')},</p>
    <p style="${FONT}margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">You asked to talk to our team in the chat on our website. Here's our reply:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
      <tr>
        <td style="${FONT}padding:14px 16px;">
          <div style="font-size:11px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(from)}</div>
          <div style="margin-top:6px;font-size:15px;line-height:1.6;color:#0f172a;">${escapeHtml(reply).replace(/\r?\n/g, '<br />')}</div>
        </td>
      </tr>
    </table>
    <p style="${FONT}margin:18px 0 0;font-size:14px;line-height:1.6;color:#334155;">Just reply to this email to continue, or call us on ${link(BUSINESS.phoneHref, BUSINESS.phone)}.</p>`;

  const footer = `
    <div style="font-weight:700;color:#0f172a;">${escapeHtml(BUSINESS.name)} · India</div>
    <div>${link(site, displayUrl(site))} · ${link(BUSINESS.phoneHref, BUSINESS.phone)}</div>
    <div style="margin-top:8px;">You're receiving this because you started a chat with our team on our website and left before we replied.</div>`;

  const plain = [
    `Hi ${first || 'there'},`,
    '',
    "You asked to talk to our team in the chat on our website. Here's our reply:",
    '',
    `${from}: ${reply}`,
    '',
    `Just reply to this email to continue, or call us on ${BUSINESS.phone}.`,
    `${BUSINESS.name} · ${displayUrl(site)}`,
  ].join('\n');

  return { subject, html: page({ preheader: reply.slice(0, 120), title: subject, body, footer }), text: plain };
}
