import mongoose from 'mongoose';
import Inquiry from '../models/Inquiry.js';
import Medicine, { PUBLIC_MEDICINE_FILTER } from '../models/Medicine.js';
import twilio from 'twilio';
import { sendEmail, sendEmailTo, isEmailConfigured } from '../utils/sendEmail.js';
import { buildTeamNotification, buildCustomerConfirmation } from '../utils/inquiryEmails.js';
import { siteUrl } from '../config/business.js';
import { logger } from '../config/logger.js';
import { escapeRegex } from '../utils/sanitize.js';

const whatsappTo = process.env.ADMIN_WHATSAPP_TO;

// A real Twilio Account SID always starts with "AC" followed by 32 hex chars — this
// catches the placeholder value ("ACxxxxxxxx") shipped in .env.example / a fresh
// .env before anyone's set up Twilio, so we don't try to authenticate with it and
// fail silently on every inquiry.
const looksLikeRealSid = /^AC[a-f0-9]{32}$/i.test(process.env.TWILIO_ACCOUNT_SID || '');
const whatsappConfigured = Boolean(
  looksLikeRealSid && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM && whatsappTo
);

let twilioClient = null;
if (process.env.WHATSAPP_ALERTS_ENABLED === 'false') {
  logger.info('[WhatsApp] Alerts disabled via WHATSAPP_ALERTS_ENABLED=false.');
} else if (whatsappConfigured) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  logger.info('[WhatsApp] Alerts enabled — inquiries will be forwarded via Twilio.');
} else if (process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_AUTH_TOKEN) {
  logger.warn(
    '[WhatsApp] Twilio env vars are present but incomplete or look like placeholders — alerts disabled. Set TWILIO_ACCOUNT_SID (real "AC..." SID), TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, and ADMIN_WHATSAPP_TO to enable.'
  );
} else {
  logger.info('[WhatsApp] Twilio not configured — alerts disabled.');
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
    if (!sanitizedProduct.packagingType) {
      return res.status(400).json({ error: 'Invalid packaging type.' });
    }
    // The team needs a way to reply with the quote.
    if (!sanitizedCustomer.email && !sanitizedCustomer.phone) {
      return res.status(400).json({ error: 'Please add an email or a phone number so we can reply.' });
    }
    if (sanitizedCustomer.email && !isValidEmail(sanitizedCustomer.email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (sanitizedCustomer.phone && !isValidPhone(sanitizedCustomer.phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    const medicine = await Medicine.findOne({ ...PUBLIC_MEDICINE_FILTER, _id: trimmedMedicineId }).lean();
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found.' });
    }

    // Box or strip, or the product's own pack (bottle, tube...).
    const catalogueVariants = Array.isArray(medicine.variants) ? medicine.variants : [];
    const allowedPackaging = new Set(['box', 'strip', ...catalogueVariants.map((v) => String(v.packagingType || '').trim().toLowerCase()).filter(Boolean)]);
    if (!allowedPackaging.has(sanitizedProduct.packagingType)) {
      return res.status(400).json({ error: 'Invalid packaging type.' });
    }

    // Record the catalogue pack the customer looked at (pack size and listed
    // price), so the inquiry shows what the quote should be based on.
    const wanted = sanitizedProduct.strength.toLowerCase();
    const catalogueVariant =
      (wanted && catalogueVariants.find((v) => String(v.strength || '').trim().toLowerCase() === wanted)) || catalogueVariants[0] || {};
    const samePack = String(catalogueVariant.packagingType || '').trim().toLowerCase() === sanitizedProduct.packagingType;

    const normalizedVariant = normalizeVariantSelection({
      strength: sanitizedProduct.strength || catalogueVariant.strength,
      form: catalogueVariant.form,
      packSize: samePack ? catalogueVariant.packSize : '',
      packagingType: sanitizedProduct.packagingType,
      brand: sanitizedProduct.brand,
      // Only the pack the price belongs to carries it; any other pack is quoted.
      price: samePack ? catalogueVariant.price : undefined,
      sku: catalogueVariant.sku,
    });

    const inquiry = await createWithReference('CN', {
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
      status: 'new',
    });

    notifyAll(inquiry);

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully.',
      inquiryId: inquiry._id,
      referenceId: inquiry.referenceId,
      confirmationEmail: willEmailCustomer(inquiry),
    });
  } catch (error) {
    next(error);
  }
}

const MAX_ITEMS = 50;
const REQUEST_TYPES = ['inquiry', 'best_price'];

function matchVariant(medicine, requested = {}) {
  const signature = (variant = {}) =>
    ['strength', 'form', 'packSize', 'packagingType']
      .map((key) => String(variant?.[key] || '').trim().toLowerCase())
      .join('|');

  const variants = Array.isArray(medicine.variants) ? medicine.variants : [];
  return variants.find((variant) => signature(variant) === signature(requested)) || variants[0] || {};
}

// Multi-medicine cart submissions and best-price requests. Quantities and which
// medicine/variant was picked are the only things taken from the request body —
// names, prices and stock are always re-read from the catalogue, so a tampered
// payload can't record a price the business never listed.
export async function createBulkRequest(req, res, next) {
  try {
    const { requestType = 'inquiry', customer = {}, notes = '', items = [] } = req.body || {};

    const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
    const type = REQUEST_TYPES.includes(requestType) ? requestType : 'inquiry';

    const sanitizedCustomer = {
      name: sanitize(customer.name),
      city: sanitize(customer.city),
      email: sanitize(customer.email),
      phone: sanitize(customer.phone),
    };

    if (!sanitizedCustomer.name) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }
    if (!sanitizedCustomer.city) {
      return res.status(400).json({ error: 'Delivery location is required.' });
    }
    if (!isValidEmail(sanitizedCustomer.email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (sanitizedCustomer.phone && !isValidPhone(sanitizedCustomer.phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Add at least one medicine before submitting.' });
    }
    if (items.length > MAX_ITEMS) {
      return res.status(400).json({ error: `A request can contain at most ${MAX_ITEMS} medicines.` });
    }

    const requested = [];
    for (const item of items) {
      const medicineId = sanitize(item?.medicineId);
      const quantity = Math.round(Number(item?.quantity));

      if (!medicineId || !mongoose.Types.ObjectId.isValid(medicineId)) {
        return res.status(400).json({ error: 'One of the selected medicines is no longer valid.' });
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        return res.status(400).json({ error: 'Every medicine needs a quantity of at least 1.' });
      }

      requested.push({ medicineId, quantity, variant: item?.variant || {} });
    }

    const medicines = await Medicine.find({
      ...PUBLIC_MEDICINE_FILTER,
      _id: { $in: requested.map((item) => item.medicineId) },
    }).lean();
    const byId = new Map(medicines.map((medicine) => [String(medicine._id), medicine]));

    const resolvedItems = [];
    for (const item of requested) {
      const medicine = byId.get(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ error: 'One of the selected medicines is no longer available.' });
      }

      const variant = matchVariant(medicine, item.variant);
      const price = Number(variant?.price);

      resolvedItems.push({
        medicineId: medicine._id,
        medicineName: medicine.name,
        slug: medicine.slug || '',
        quantity: item.quantity,
        listedPrice: Number.isFinite(price) ? price : undefined,
        variant: normalizeVariantSelection(variant),
      });
    }

    const [first] = resolvedItems;
    const summaryName =
      resolvedItems.length > 1 ? `${first.medicineName} + ${resolvedItems.length - 1} more` : first.medicineName;
    const inquiry = await createWithReference(type === 'best_price' ? 'BP' : 'CN', {
      requestType: type,
      items: resolvedItems,
      customerName: sanitizedCustomer.name,
      phone: sanitizedCustomer.phone,
      email: sanitizedCustomer.email,
      city: sanitizedCustomer.city,
      additionalNotes: sanitize(notes),
      // The flat fields stay populated from the first line so existing admin
      // views, filters and email templates keep rendering these requests.
      quantity: resolvedItems.reduce((total, item) => total + item.quantity, 0),
      medicineId: first.medicineId,
      medicineName: summaryName,
      slug: first.slug,
      selectedVariant: first.variant,
      status: 'new',
    });

    notifyAll(inquiry);

    res.status(201).json({
      success: true,
      message:
        type === 'best_price'
          ? 'Best-price request submitted successfully.'
          : 'Inquiry submitted successfully.',
      requestType: type,
      inquiryId: inquiry._id,
      referenceId: inquiry.referenceId,
      itemCount: resolvedItems.length,
      confirmationEmail: willEmailCustomer(inquiry),
    });
  } catch (error) {
    next(error);
  }
}

// Everything a new inquiry sets off. Each part logs its own failure, so one
// failing never stops the others or the customer's submission.
function notifyAll(inquiry) {
  const site = siteUrl();
  Promise.allSettled([
    sendEmailNotification({ inquiry, site }),
    sendCustomerConfirmation({ inquiry, site }),
    sendWhatsappNotification({ inquiry }),
  ]).catch(() => {});
}

// The lead goes to the team inbox only (ADMIN_EMAIL, no cc). Replying to it
// answers the customer when they gave an email.
async function sendEmailNotification({ inquiry, site }) {
  try {
    const { subject, html } = buildTeamNotification(inquiry, { site });
    await sendEmail({ subject, html, replyTo: inquiry.email || undefined });
  } catch (error) {
    logger.error({ err: error }, '[Email] Inquiry notification failed');
  }
}

const willEmailCustomer = (inquiry) => Boolean(inquiry.email) && isEmailConfigured();

// "Thank you" receipt with the inquiry's details, to the address the customer
// entered. Their reply goes to the team inbox. The address is not logged.
async function sendCustomerConfirmation({ inquiry, site }) {
  if (!willEmailCustomer(inquiry)) return;
  try {
    await sendEmailTo({
      to: inquiry.email,
      ...buildCustomerConfirmation(inquiry, { site }),
      replyTo: process.env.ADMIN_EMAIL || undefined,
    });
  } catch (error) {
    logger.error({ err: error, referenceId: inquiry.referenceId }, '[Email] Inquiry confirmation to customer failed');
  }
}

async function sendWhatsappNotification({ inquiry }) {
  if (!twilioClient) return;

  try {
    const { customerName, medicineName, quantity, phone, selectedVariant, referenceId, city, state } = inquiry;
    const variantLine = selectedVariant?.strength || selectedVariant?.form || selectedVariant?.packSize
      ? `Variant: ${buildVariantLabel(selectedVariant)}`
      : 'Variant: n/a';
    const priceLine = Number.isFinite(selectedVariant?.price) ? `Price: ${selectedVariant.price}` : 'Price: n/a';
    const items = inquiry.items || [];
    const heading = inquiry.requestType === 'best_price' ? 'Best-price request' : 'New inquiry';
    const productBlock = items.length
      ? `Items (${items.length}):\n${items
          .map((item, index) => `${index + 1}. ${item.medicineName} x${item.quantity}`)
          .join('\n')}`
      : `Medicine: ${medicineName || 'N/A'}
${variantLine}
${priceLine}
Qty: ${quantity || 1}`;
    const body = `${heading} ${referenceId || ''} from ${customerName}
${productBlock}
 Phone: ${phone}
 City/State: ${[city, state].filter(Boolean).join(', ')}`;
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${whatsappTo}`,
      body,
    });
  } catch (error) {
    logger.error({ err: error }, '[WhatsApp] Inquiry notification failed');
  }
}

function normalizeQuantity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 1;
  return Math.round(numeric);
}

// Reference IDs run CN-2026-0001, 0002, ... (BP- for best-price requests), one
// series per year. The next number is the highest one in use plus one, so removing
// old records never makes a number come round again, and two requests that pick
// the same number at the same moment are sorted out by the unique index: the loser
// simply tries again.
async function nextReferenceId(series) {
  const prefix = `${series}-${new Date().getFullYear()}-`;
  const [top] = await Inquiry.aggregate([
    { $match: { referenceId: new RegExp(`^${escapeRegex(prefix)}\\d+$`) } },
    { $group: { _id: null, highest: { $max: { $toInt: { $substrCP: ['$referenceId', prefix.length, 20] } } } } },
  ]);
  return `${prefix}${String((top?.highest || 0) + 1).padStart(4, '0')}`;
}

async function createWithReference(series, fields) {
  for (let attempt = 1; ; attempt += 1) {
    const referenceId = await nextReferenceId(series);
    try {
      return await Inquiry.create({ ...fields, referenceId });
    } catch (error) {
      const taken = error?.code === 11000 && Boolean(error.keyPattern?.referenceId);
      if (!taken || attempt >= 8) throw error;
    }
  }
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