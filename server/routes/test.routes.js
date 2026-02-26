import { Router } from 'express';
import { Resend } from 'resend';

const router = Router();

router.get('/email', async (_req, res) => {
  const { RESEND_API_KEY, ADMIN_EMAIL } = process.env;

  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.error('Missing RESEND_API_KEY or ADMIN_EMAIL');
    return res.status(500).json({ success: false, message: 'Email configuration missing' });
  }

  try {
    const resend = new Resend(RESEND_API_KEY);

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; background: #f4f6fb; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0f766e, #14b8a6); color: #ffffff; padding: 18px 20px;">
            <h2 style="margin: 0; font-size: 20px;">CureNeed</h2>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Email delivery check</p>
          </div>
          <div style="padding: 22px 24px; color: #111827;">
            <p style="margin: 0 0 12px; font-size: 15px;">Resend email system is working correctly.</p>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Timestamp: ${new Date().toUTCString()}</p>
          </div>
          <div style="padding: 14px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <span>Sent via Resend</span>
          </div>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: 'CureNeed <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: 'Resend Working - CureNeed',
      html,
    });

    if (error) {
      console.error('Resend error', error);
      return res.status(500).json({ success: false, message: 'Failed to send test email' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to send test email', err);
    return res.status(500).json({ success: false, message: 'Failed to send test email' });
  }
});

export default router;
