// Records how the FAQ handled what visitors asked, for the admin panel.
// Personal details a visitor might type are masked before anything is stored,
// and health statements are never logged (the chat refuses those anyway).
import mongoose from 'mongoose';
import FaqQuestion from '../models/FaqQuestion.js';
import { normalize } from './chat/text.js';
import { needsMedicalRefusal, isEmergency } from './chat/safety.js';
import { logger } from '../config/logger.js';

export function maskPersonalDetails(text) {
  return String(text || '')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{6,}\d/g, (match) => (/^(?:CN|BP)/i.test(match) ? match : '[number]'))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

/**
 * @param {object} event { text, outcome, faqId, faqQuestion, source, conversation }
 * Never throws: logging must not break a chat reply.
 */
export async function logFaqEvent({ text, outcome, faqId = '', faqQuestion = '', source = 'chat', conversation = null }) {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const raw = String(text || '').trim();
    if (raw.length < 3 || needsMedicalRefusal(raw) || isEmergency(raw)) return;
    const clean = maskPersonalDetails(raw);
    const key = normalize(clean).slice(0, 200);
    if (!key || key === normalize('[email]') || key === normalize('[number]')) return;

    const push = conversation?._id
      ? { conversations: { $each: [{ conversationId: conversation._id, visitorName: String(conversation.visitor?.name || '').slice(0, 60), at: new Date() }], $slice: -5 } }
      : null;

    await FaqQuestion.findOneAndUpdate(
      { key },
      {
        $set: { text: clean, outcome, faqId, faqQuestion, source, lastAskedAt: new Date() },
        $inc: { count: 1 },
        $setOnInsert: { firstAskedAt: new Date() },
        ...(push ? { $push: push } : {}),
      },
      { upsert: true }
    );
  } catch (error) {
    logger.warn({ err: error.message }, 'faq insights: could not log a question');
  }
}
