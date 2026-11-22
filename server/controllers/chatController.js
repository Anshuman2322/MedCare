import crypto from 'crypto';
import mongoose from 'mongoose';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import ContactMessage from '../models/ContactMessage.js';
import Inquiry from '../models/Inquiry.js';
import { sendContactNotification } from './contactController.js';
import { respond, greeting, STATUS_LABELS, inquiryConfirmationText } from '../services/chat/engine.js';
import { aiEnabled } from '../services/chat/ai.js';
import { logFaqEvent } from '../services/faqInsights.js';
import { findMedicineBySlug } from '../services/chat/catalog.js';
import {
  SUPPORT_ONLY,
  DEFAULT_AGENT_NAME,
  liveChatWaitingText,
  liveChatStillWaitingText,
} from '../services/chat/knowledgeBase.js';
import SupportSettings from '../models/SupportSettings.js';

// After this long without a reply from the team, the visitor gets one
// "thanks for your patience" message so a wait never feels like silence.
const WAIT_UPDATE_AFTER_MS = 10 * 60 * 1000;
// Polls arrive every few seconds; recording presence twice a minute is plenty.
const SEEN_WRITE_EVERY_MS = 30 * 1000;

// What the widget shows about the team: online or away, and the usual wait.
async function liveChatTeam() {
  const settings = await SupportSettings.current();
  return { available: settings.available, waitText: settings.waitText };
}

const MAX_MESSAGE_LENGTH = 1000;
const TOKEN_PATTERN = /^[a-f0-9]{48}$/;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

function clean(value, max = 200) {
  if (typeof value !== 'string') return '';
  // Strip control characters so a crafted message can't break the admin transcript view.
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function dbReady() {
  return mongoose.connection.readyState === 1;
}

function unavailable(res) {
  return res.status(503).json({ error: 'Chat is temporarily unavailable. Please try again shortly.' });
}

function serializeMessage(message) {
  return {
    id: String(message._id),
    role: message.role,
    text: message.text,
    cards: message.payload?.cards,
    quickActions: message.payload?.quickActions,
    form: message.payload?.form,
    // The team member's display name, never their email.
    ...(message.role === 'agent' ? { agentName: message.agentName || DEFAULT_AGENT_NAME } : {}),
    at: message.createdAt,
  };
}

function serializeConversation(conversation, team) {
  return {
    status: conversation.status,
    handoffRequested: conversation.handoffRequested,
    productContext: conversation.productContext,
    visitor: { name: conversation.visitor?.name || '', email: conversation.visitor?.email || '' },
    waitingSince: conversation.handoffAt || null,
    agentJoined: Boolean(conversation.firstAgentReplyAt),
    ...(team ? { team } : {}),
  };
}

// `preview: false` keeps the admin queue showing the visitor's own last words
// rather than an automatic message.
async function appendMessage(conversation, { role, text, payload = {}, agentEmail = '', preview = true }) {
  const message = await ChatMessage.create({
    conversationId: conversation._id,
    role,
    text,
    payload: {
      cards: payload.cards,
      quickActions: payload.quickActions,
      form: payload.form,
    },
    agentEmail,
  });

  if (preview) conversation.lastMessagePreview = clean(text, 140);
  conversation.lastMessageAt = message.createdAt;
  if (role === 'user') conversation.unreadForAdmin = (conversation.unreadForAdmin || 0) + 1;

  return message;
}

// One "still waiting" message per conversation, sent while the visitor is on
// the site (their widget is polling) and nobody from the team has replied yet.
// The atomic claim stops two overlapping polls from both sending it.
async function maybeSendWaitUpdate(conversation) {
  const waitedLongEnough =
    conversation.handoffRequested &&
    conversation.status === 'waiting' &&
    !conversation.firstAgentReplyAt &&
    !conversation.waitUpdateAt &&
    conversation.handoffAt &&
    Date.now() - new Date(conversation.handoffAt).getTime() >= WAIT_UPDATE_AFTER_MS;
  if (!waitedLongEnough) return;

  const claimed = await ChatConversation.findOneAndUpdate(
    { _id: conversation._id, waitUpdateAt: null, firstAgentReplyAt: null },
    { $set: { waitUpdateAt: new Date() } },
    { new: true }
  );
  if (!claimed) return;

  conversation.waitUpdateAt = claimed.waitUpdateAt;
  await appendMessage(conversation, {
    role: 'assistant',
    text: liveChatStillWaitingText({ name: conversation.visitor?.name, email: conversation.visitor?.email }),
    preview: false,
  });
  await conversation.save();
}

// The visitor's browser supplies the slug it is currently viewing; the display
// name is always re-resolved from the catalogue so the stored context (which
// admins also see) can never be spoofed from the client.
async function resolveProductContext(raw) {
  const slug = clean(raw?.slug, 120);
  if (!slug) return { slug: '', name: '' };

  const medicine = await findMedicineBySlug(slug);
  if (!medicine) return { slug: '', name: '' };

  return { slug: medicine.slug || slug, name: medicine.name || '' };
}

async function loadConversation(sessionToken) {
  const token = clean(sessionToken, 64);
  if (!TOKEN_PATTERN.test(token)) return null;
  return ChatConversation.findOne({ sessionToken: token });
}

export async function startSession(req, res, next) {
  try {
    if (!dbReady()) return unavailable(res);

    const productContext = await resolveProductContext(req.body?.productContext);
    const existing = await loadConversation(req.body?.sessionToken);
    const team = await liveChatTeam();

    if (existing && existing.status !== 'closed') {
      // Re-opening the widget on a different product page should acknowledge
      // that product, not silently keep answering about the previous one.
      const switchedProduct =
        productContext.slug && productContext.slug !== existing.productContext?.slug;

      existing.productContext = productContext;
      existing.visitorSeenAt = new Date();
      if (switchedProduct && !existing.handoffRequested) {
        const opening = greeting(existing);
        await appendMessage(existing, {
          role: 'assistant',
          text: opening.text,
          payload: opening,
        });
      }
      await existing.save();

      const history = await ChatMessage.find({ conversationId: existing._id })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      history.reverse();

      return res.json({
        sessionToken: clean(req.body.sessionToken, 64),
        conversation: serializeConversation(existing, team),
        messages: history.map(serializeMessage),
      });
    }

    const sessionToken = crypto.randomBytes(24).toString('hex');
    const conversation = await ChatConversation.create({ sessionToken, productContext, visitorSeenAt: new Date() });

    const opening = greeting(conversation);
    const message = await appendMessage(conversation, {
      role: 'assistant',
      text: opening.text,
      payload: opening,
    });
    conversation.unreadForAdmin = 0;
    await conversation.save();

    res.status(201).json({
      sessionToken,
      conversation: serializeConversation(conversation, team),
      messages: [serializeMessage(message)],
    });
  } catch (error) {
    next(error);
  }
}

export async function postMessage(req, res, next) {
  try {
    if (!dbReady()) return unavailable(res);

    const conversation = await loadConversation(req.body?.sessionToken);
    if (!conversation || conversation.status === 'closed') {
      return res.status(404).json({ error: 'Chat session not found. Please start a new conversation.' });
    }

    const text = clean(req.body?.text, MAX_MESSAGE_LENGTH);
    const actionId = clean(req.body?.actionId, 60);
    const actionLabel = clean(req.body?.actionLabel, 80);

    if (!text && !actionId) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    if (req.body?.productContext !== undefined) {
      conversation.productContext = await resolveProductContext(req.body.productContext);
    }

    // The AI assistant reads the recent conversation; the rule-based one
    // keeps its memory on the conversation itself.
    const history =
      aiEnabled() && !conversation.handoffRequested
        ? (await ChatMessage.find({ conversationId: conversation._id }).sort({ createdAt: -1 }).limit(16).lean()).reverse()
        : [];

    conversation.visitorSeenAt = new Date();
    const userMessage = await appendMessage(conversation, {
      role: 'user',
      text: text || actionLabel || actionId,
    });

    // Once a human is on the thread the assistant stops answering, so an agent's
    // reply is never contradicted by a bot message underneath it.
    if (conversation.handoffRequested) {
      conversation.status = 'waiting';
      conversation.awaiting = '';
      await conversation.save();
      return res.json({ messages: [serializeMessage(userMessage)] });
    }

    const answer = await respond({ text, actionId, conversation, history });
    conversation.awaiting = answer.awaiting || '';
    // What the visitor asked and how the FAQ handled it, for the admin panel (never blocks the reply).
    if (text && answer.faqMeta) logFaqEvent({ text, ...answer.faqMeta, conversation });

    const assistantMessage = await appendMessage(conversation, {
      role: 'assistant',
      text: answer.text,
      payload: answer,
    });
    await conversation.save();

    res.json({ messages: [serializeMessage(userMessage), serializeMessage(assistantMessage)] });
  } catch (error) {
    next(error);
  }
}

export async function pollMessages(req, res, next) {
  try {
    if (!dbReady()) return unavailable(res);

    const conversation = await loadConversation(req.query?.sessionToken);
    if (!conversation) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    const lastSeen = conversation.visitorSeenAt ? new Date(conversation.visitorSeenAt).getTime() : 0;
    if (Date.now() - lastSeen > SEEN_WRITE_EVERY_MS) {
      conversation.visitorSeenAt = new Date();
      await ChatConversation.updateOne({ _id: conversation._id }, { $set: { visitorSeenAt: conversation.visitorSeenAt } });
    }

    await maybeSendWaitUpdate(conversation);

    const after = new Date(req.query?.after || 0);
    const filter = { conversationId: conversation._id };
    if (!Number.isNaN(after.getTime()) && after.getTime() > 0) {
      filter.createdAt = { $gt: after };
    }

    const messages = await ChatMessage.find(filter).sort({ createdAt: 1 }).limit(50).lean();

    res.json({
      conversation: serializeConversation(conversation, await liveChatTeam()),
      messages: messages.map(serializeMessage),
    });
  } catch (error) {
    next(error);
  }
}

export async function requestHandoff(req, res, next) {
  try {
    if (!dbReady()) return unavailable(res);

    const conversation = await loadConversation(req.body?.sessionToken);
    if (!conversation || conversation.status === 'closed') {
      return res.status(404).json({ error: 'Chat session not found. Please start a new conversation.' });
    }

    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 160).toLowerCase();
    const phone = clean(req.body?.phone, 40);
    const note = clean(req.body?.message, MAX_MESSAGE_LENGTH);

    if (!name) return res.status(400).json({ error: 'Name is required.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });
    if (!note) return res.status(400).json({ error: 'Please tell us how we can help.' });

    // Asking again (e.g. to correct an email) must not email the team again:
    // they already have this conversation in their queue.
    const alreadyQueued = conversation.handoffRequested;

    conversation.visitor = { name, email, phone };
    conversation.handoffRequested = true;
    conversation.status = 'waiting';
    conversation.awaiting = '';
    if (!conversation.handoffAt) conversation.handoffAt = new Date();
    conversation.visitorSeenAt = new Date();

    if (!alreadyQueued) {
      const contextLine = conversation.productContext?.name
        ? `\n\nViewing: ${conversation.productContext.name}`
        : '';
      const contactMessage = await ContactMessage.create({
        name,
        email,
        message: `[Support chat] ${note}${contextLine}${phone ? `\nPhone: ${phone}` : ''}`,
      });
      sendContactNotification(contactMessage).catch(() => {});
    }

    const team = await liveChatTeam();
    await appendMessage(conversation, { role: 'user', text: note });
    const confirmation = await appendMessage(conversation, {
      role: 'assistant',
      text: liveChatWaitingText({ name, email, ...team }),
      preview: false,
    });
    await conversation.save();

    res.status(201).json({
      conversation: serializeConversation(conversation, team),
      messages: [serializeMessage(confirmation)],
    });
  } catch (error) {
    next(error);
  }
}

// The inquiry itself is created by the existing POST /api/inquiries endpoint.
// This only records the outcome in the transcript, and refuses any reference
// that doesn't correspond to a real inquiry.
export async function recordInquiry(req, res, next) {
  try {
    if (!dbReady()) return unavailable(res);

    const conversation = await loadConversation(req.body?.sessionToken);
    if (!conversation) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    const referenceId = clean(req.body?.referenceId, 40);
    const inquiry = referenceId ? await Inquiry.findOne({ referenceId }).lean() : null;
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry reference could not be verified.' });
    }

    if (!conversation.inquiryRefs.includes(referenceId)) {
      conversation.inquiryRefs.push(referenceId);
    }
    if (inquiry.email && !conversation.visitor?.email) {
      conversation.visitor = {
        name: inquiry.customerName || conversation.visitor?.name || '',
        email: inquiry.email,
        phone: inquiry.phone || conversation.visitor?.phone || '',
      };
    }
    conversation.awaiting = '';

    const message = await appendMessage(conversation, {
      role: 'assistant',
      text: inquiryConfirmationText(referenceId),
      payload: { quickActions: SUPPORT_ONLY },
    });
    await conversation.save();

    res.status(201).json({ messages: [serializeMessage(message)] });
  } catch (error) {
    next(error);
  }
}

// Reference IDs are sequential, so status is only disclosed when the requester
// also knows the email address the inquiry was filed under.
export async function lookupInquiryStatus(req, res, next) {
  try {
    if (!dbReady()) return unavailable(res);

    const conversation = await loadConversation(req.body?.sessionToken);
    if (!conversation) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    const referenceId = clean(req.body?.referenceId, 40).toUpperCase();
    const email = clean(req.body?.email, 160).toLowerCase();

    if (!referenceId) return res.status(400).json({ error: 'Inquiry reference is required.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });

    const inquiry = await Inquiry.findOne({ referenceId }).lean();
    const verified = inquiry && String(inquiry.email || '').toLowerCase() === email;

    const request = await appendMessage(conversation, {
      role: 'user',
      text: `Check inquiry ${referenceId}`,
    });

    const text = verified
      ? `Inquiry ${inquiry.referenceId}\n\nMedicine: ${inquiry.medicineName}\nQuantity: ${inquiry.quantity || 1}\nStatus: ${STATUS_LABELS[inquiry.status] || STATUS_LABELS.new}\nSubmitted: ${new Date(inquiry.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}`
      : `I couldn't find an inquiry with that reference number and email combination.`;

    const message = await appendMessage(conversation, {
      role: 'assistant',
      text,
      payload: { quickActions: SUPPORT_ONLY },
    });
    await conversation.save();

    res.json({
      found: Boolean(verified),
      messages: [serializeMessage(request), serializeMessage(message)],
    });
  } catch (error) {
    next(error);
  }
}
