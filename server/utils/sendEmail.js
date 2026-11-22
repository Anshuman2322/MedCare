import { Resend } from 'resend';
import { logger } from '../config/logger.js';

// The SDK has no request timeout of its own, and a hung provider call must not
// be left waiting forever.
const SEND_TIMEOUT_MS = 10_000;

let resendClient = null;

// Env is read on first use rather than at import time: ES imports run before
// server.js gets to call dotenv.config().
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

function getFromAddress() {
  return process.env.RESEND_FROM || 'CureNeed <onboarding@resend.dev>';
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function withTimeout(promise) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Email provider did not respond within ${SEND_TIMEOUT_MS}ms`));
    }, SEND_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Resend reports rejections (unverified domain, bad key, ...) as a returned
// `{ error }` rather than an exception. Throwing here means no caller can mistake
// one for success. The message carries the provider's reason, never the email body.
async function deliver(client, { to, subject, html, text, replyTo }) {
  const message = { from: getFromAddress(), to, subject, html, text };
  if (replyTo) message.replyTo = replyTo;
  const { data, error } = await withTimeout(client.emails.send(message));
  if (error) {
    throw new Error(`Resend rejected the email (${error.name}): ${error.message}`);
  }
  return data;
}

// Notification to the team about something a visitor did on the website
// (inquiry, contact form, support-chat handoff). Every one of them goes to
// ADMIN_EMAIL and nowhere else: no cc, no second inbox. Skipped when
// unconfigured; callers log any failure and carry on.
export async function sendEmail({ subject, html, replyTo }) {
  const client = getResendClient();
  const to = (process.env.ADMIN_EMAIL || '').trim();

  if (!client) {
    logger.warn('[Email] RESEND_API_KEY not configured; email skipped.');
    return undefined;
  }

  if (!to) {
    logger.warn('[Email] ADMIN_EMAIL not configured; email skipped.');
    return undefined;
  }

  return deliver(client, { to, subject, html, replyTo });
}

// Email to one specific person (a password-reset code, a customer's inquiry
// confirmation). Throws when it can't be handed to the provider, so a message
// that silently vanishes is always logged.
export async function sendEmailTo({ to, subject, html, text, replyTo }) {
  const client = getResendClient();
  if (!client) {
    throw new Error('RESEND_API_KEY not configured');
  }

  return deliver(client, { to, subject, html, text, replyTo });
}
