import ContactMessage from '../models/ContactMessage.js';
import { escapeRegex } from '../utils/sanitize.js';
import { sendEmail } from '../utils/sendEmail.js';
import { logger } from '../config/logger.js';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendContactNotification(contactMessage) {
  try {
    const html = `
      <h2>New contact message — CureNeed</h2>
      <p><strong>Name:</strong> ${escapeHtml(contactMessage.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(contactMessage.email)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(contactMessage.message).replace(/\n/g, '<br />')}</p>
    `;
    await sendEmail({
      subject: 'New Contact Message — CureNeed',
      html,
      replyTo: contactMessage.email,
    });
  } catch (error) {
    logger.error({ err: error }, '[Email] Contact notification failed');
  }
}

export async function createContactMessage(req, res, next) {
  try {
    const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
    const name = sanitize(req.body?.name);
    const email = sanitize(req.body?.email);
    const message = sanitize(req.body?.message);

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const contactMessage = await ContactMessage.create({ name, email, message });

    sendContactNotification(contactMessage).catch(() => {});

    res.status(201).json({ success: true, message: 'Message sent successfully.', id: contactMessage._id });
  } catch (error) {
    next(error);
  }
}

export async function listContactMessages(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const search = (req.query.search || '').trim();

    const filter = {};
    if (search) {
      const pattern = escapeRegex(search);
      filter.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { email: { $regex: pattern, $options: 'i' } },
      ];
    }

    const total = await ContactMessage.countDocuments(filter);
    const items = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ items, total, page, limit, hasMore: page * limit < total });
  } catch (error) {
    next(error);
  }
}

export async function markContactMessageRead(req, res, next) {
  try {
    const contactMessage = await ContactMessage.findById(req.params.id);
    if (!contactMessage) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    contactMessage.status = 'read';
    await contactMessage.save();

    res.json({ success: true, message: contactMessage });
  } catch (error) {
    next(error);
  }
}
