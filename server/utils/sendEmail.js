import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const fromAddress = process.env.RESEND_FROM || 'CureNeed <onboarding@resend.dev>';
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail({ subject, html, replyTo }) {
  if (!resendClient) {
    console.warn('[Email] RESEND_API_KEY not configured; email skipped.');
    return;
  }

  if (!adminEmail) {
    console.warn('[Email] ADMIN_EMAIL not configured; email skipped.');
    return;
  }

  try {
    return await resendClient.emails.send({
      from: fromAddress,
      to: adminEmail,
      subject,
      html,
      reply_to: replyTo ? [replyTo] : undefined,
    });
  } catch (error) {
    console.error('[Email] Send failed', error);
    throw error;
  }
}
