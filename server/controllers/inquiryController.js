import Inquiry from '../models/Inquiry.js';
import twilio from 'twilio';
import { sendEmail } from '../utils/sendEmail.js';

const whatsappTo = process.env.ADMIN_WHATSAPP_TO;

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function createInquiry(req, res, next) {
  try {
    const {
      customerName = '',
      phone = '',
      email = '',
      quantity = 1,
      message = '',
      medicineId = '',
      medicineName = '',
      slug = '',
    } = req.body || {};

    const trimmedName = customerName.trim();
    const trimmedPhone = phone.trim();
    const trimmedMedicine = medicineName.trim();

    if (!trimmedName || !trimmedPhone || !trimmedMedicine) {
      return res.status(400).json({ error: 'Name, phone, and medicine name are required.' });
    }

    const inquiry = await Inquiry.create({
      customerName: trimmedName,
      phone: trimmedPhone,
      email: typeof email === 'string' ? email.trim() : '',
      quantity: normalizeQuantity(quantity),
      message: typeof message === 'string' ? message.trim() : '',
      medicineId: typeof medicineId === 'string' ? medicineId.trim() : medicineId,
      medicineName: trimmedMedicine,
      slug,
    });

    Promise.allSettled([
      sendEmailNotification({ inquiry }),
      sendWhatsappNotification({ inquiry }),
    ]).catch(() => {});

    res.status(201).json({ success: true, message: 'Inquiry sent', inquiryId: inquiry._id });
  } catch (error) {
    next(error);
  }
}

export async function listInquiries(_req, res, next) {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    next(error);
  }
}

async function sendEmailNotification({ inquiry }) {
  try {
    const html = buildInquiryEmailHtml(inquiry);
    await sendEmail({
      subject: 'New Medicine Inquiry - CureNeed',
      html,
      replyTo: inquiry.email,
    });
  } catch (error) {
    console.error('[Email] Inquiry notification failed', error);
  }
}

async function sendWhatsappNotification({ inquiry }) {
  if (!twilioClient || !process.env.TWILIO_WHATSAPP_FROM || !whatsappTo) return;
  const { customerName, medicineName, quantity, phone } = inquiry;
  const body = `New inquiry from ${customerName}
Medicine: ${medicineName || 'N/A'}
Qty: ${quantity || 1}
Phone: ${phone}`;
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${whatsappTo}`,
    body,
  });
}

function normalizeQuantity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  return Math.round(numeric);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function buildInquiryEmailHtml(inquiry) {
  const fields = [
    ['Customer Name', escapeHtml(inquiry.customerName)],
    ['Phone', escapeHtml(inquiry.phone)],
    ['Email', inquiry.email ? escapeHtml(inquiry.email) : 'Not provided'],
    ['Medicine Name', escapeHtml(inquiry.medicineName)],
    ['Quantity', escapeHtml(String(inquiry.quantity || 1))],
    ['Message', inquiry.message ? escapeHtml(inquiry.message) : 'No additional message'],
    ['Date', escapeHtml(formatDate(inquiry.createdAt))],
  ];

  const rows = fields
    .map(
      ([label, value]) => `
        <div style="margin-bottom:12px;">
          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">${label}</div>
          <div style="font-size:14px;color:#111827;font-weight:600;line-height:1.5;">${value}</div>
        </div>
      `
    )
    .join('');

  return `
    <div style="background-color:#f6f8fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:520px;margin:0 auto;">
        <div style="background:#0f172a;color:#ffffff;padding:16px 20px;border-radius:12px 12px 0 0;">
          <div style="font-size:14px;opacity:0.85;">MedCare</div>
          <div style="font-size:18px;font-weight:700;">New Medicine Inquiry</div>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:14px;color:#111827;">A customer submitted a new inquiry.</p>
          </div>
          <div style="padding:20px;">
            ${rows}
          </div>
        </div>
      </div>
    </div>
  `;
}