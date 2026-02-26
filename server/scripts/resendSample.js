import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Replace re_xxxxxxxxx with your real Resend API key or set RESEND_API_KEY in .env
const resend = new Resend(process.env.RESEND_API_KEY || 're_xxxxxxxxx');

async function sendSample() {
  const toAddress = process.env.ADMIN_EMAIL || 'anshuman2322singh@gmail.com';

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toAddress,
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  });

  if (error) {
    console.error('Resend send error:', error);
    return;
  }

  console.log('Email sent:', data);
}

sendSample().catch((err) => {
  console.error('Unexpected error:', err);
});
