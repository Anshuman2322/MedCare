import Inquiry from '../models/Inquiry.js';
import Medicine from '../models/Medicine.js';
import twilio from 'twilio';
import { sendEmail } from '../utils/sendEmail.js';

const whatsappTo = process.env.ADMIN_WHATSAPP_TO;

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
const isValidPhone = (phone) => /^[0-9+\-\s()]{7,20}$/.test(phone || '');

export async function createInquiry(req, res, next) {
  try {
    const { medicineId, customer = {}, product = {}, notes = '' } = req.body || {};

    const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
    const toNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : NaN;
    };

    const trimmedMedicineId = sanitize(medicineId);
    const sanitizedCustomer = {
      name: sanitize(customer.name),
      city: sanitize(customer.city),
      email: sanitize(customer.email),
      phone: sanitize(customer.phone),
    };
    const sanitizedProduct = {
      quantity: toNumber(product.quantity),
      packagingType: sanitize(product.packagingType).toLowerCase(),
      strength: sanitize(product.strength),
      brand: sanitize(product.brand),
    };
    const sanitizedNotes = sanitize(notes);

    if (!trimmedMedicineId) {
      return res.status(400).json({ error: 'Medicine ID is required.' });
    }
    if (!sanitizedCustomer.name) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }
    if (!sanitizedCustomer.city) {
      return res.status(400).json({ error: 'City is required.' });
    }
    if (!sanitizedProduct.quantity || sanitizedProduct.quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }
    if (!['box', 'strip'].includes(sanitizedProduct.packagingType)) {
      return res.status(400).json({ error: 'Invalid packaging type.' });
    }
    if (sanitizedCustomer.email && !isValidEmail(sanitizedCustomer.email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (sanitizedCustomer.phone && !isValidPhone(sanitizedCustomer.phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    const medicine = await Medicine.findById(trimmedMedicineId).lean();
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found.' });
    }

    const referenceId = await generateReferenceId();
    const normalizedVariant = normalizeVariantSelection({
      strength: sanitizedProduct.strength,
      packagingType: sanitizedProduct.packagingType,
      brand: sanitizedProduct.brand,
    });

    const inquiry = await Inquiry.create({
      customerName: sanitizedCustomer.name,
      firstName: '',
      lastName: '',
      phone: sanitizedCustomer.phone,
      email: sanitizedCustomer.email,
      city: sanitizedCustomer.city,
      state: '',
      brandPreference: sanitizedProduct.brand,
      additionalNotes: sanitizedNotes,
      quantity: normalizeQuantity(sanitizedProduct.quantity),
      message: '',
      medicineId: trimmedMedicineId,
      medicineName: sanitize(medicine.name) || 'Unknown medicine',
      slug: sanitize(medicine.slug),
      selectedVariant: normalizedVariant,
      referenceId,
      status: 'new',
    });

    Promise.allSettled([
      sendEmailNotification({ inquiry }),
      sendWhatsappNotification({ inquiry }),
    ]).catch(() => {});

    res.status(201).json({ success: true, message: 'Inquiry submitted successfully.', inquiryId: inquiry._id, referenceId });
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
      subject: 'New Inquiry — CureNeed',
      html,
      replyTo: inquiry.email,
    });
  } catch (error) {
    console.error('[Email] Inquiry notification failed', error);
  }
}

async function sendWhatsappNotification({ inquiry }) {
  if (!twilioClient || !process.env.TWILIO_WHATSAPP_FROM || !whatsappTo) return;
  const { customerName, medicineName, quantity, phone, selectedVariant, referenceId, city, state } = inquiry;
  const variantLine = selectedVariant?.strength || selectedVariant?.form || selectedVariant?.packSize
    ? `Variant: ${buildVariantLabel(selectedVariant)}`
    : 'Variant: n/a';
  const priceLine = Number.isFinite(selectedVariant?.price) ? `Price: ${selectedVariant.price}` : 'Price: n/a';
  const body = `New inquiry ${referenceId || ''} from ${customerName}
Medicine: ${medicineName || 'N/A'}
${variantLine}
${priceLine}
Qty: ${quantity || 1}
 Phone: ${phone}
 City/State: ${[city, state].filter(Boolean).join(', ')}`;
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
  const variantLabel = buildVariantLabel(inquiry.selectedVariant || {});
  const locationLine = [inquiry.city, inquiry.state].filter(Boolean).join(', ');
  const fields = [
    ['Reference ID', escapeHtml(inquiry.referenceId || 'Pending')],
    ['Customer Name', escapeHtml(inquiry.customerName)],
    ['Email', inquiry.email ? escapeHtml(inquiry.email) : 'Not provided'],
    ['Phone', escapeHtml(inquiry.phone)],
    ['Location', escapeHtml(locationLine || 'Not provided')],
    ['Brand Preference', inquiry.brandPreference ? escapeHtml(inquiry.brandPreference) : 'Not provided'],
    ['Additional Notes', inquiry.additionalNotes ? escapeHtml(inquiry.additionalNotes) : 'No additional notes'],
    ['Medicine Name', escapeHtml(inquiry.medicineName)],
    ['Selected Variant', variantLabel || 'Not specified'],
    ['Variant Price', Number.isFinite(inquiry?.selectedVariant?.price) ? escapeHtml(String(inquiry.selectedVariant.price)) : 'Not provided'],
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

async function generateReferenceId() {
  const year = new Date().getFullYear();
  const prefix = `CN-${year}-`;
  const count = await Inquiry.countDocuments({ referenceId: { $regex: `^${prefix}\d{4}$` } });
  const nextSeq = count + 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `${prefix}${padded}`;
}

function normalizeVariantSelection(variant = {}) {
  return {
    strength: typeof variant.strength === 'string' ? variant.strength.trim() : '',
    form: typeof variant.form === 'string' ? variant.form.trim() : '',
    packSize: typeof variant.packSize === 'string' ? variant.packSize.trim() : '',
    packagingType: typeof variant.packagingType === 'string' ? variant.packagingType.trim() : '',
    brand: typeof variant.brand === 'string' ? variant.brand.trim() : '',
    price: Number.isFinite(Number(variant.price)) ? Number(variant.price) : undefined,
    sku: typeof variant.sku === 'string' ? variant.sku.trim() : '',
  };
}

function buildVariantLabel(variant = {}) {
  const parts = [variant.strength, variant.form, variant.packSize, variant.packagingType]
    .filter((v) => typeof v === 'string' && v.trim())
    .map((v) => v.trim());
  return parts.join(' | ');
}