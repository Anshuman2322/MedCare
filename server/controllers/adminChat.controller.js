import mongoose from 'mongoose';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import SupportSettings from '../models/SupportSettings.js';
import QuickReply, { STARTER_QUICK_REPLIES } from '../models/QuickReply.js';
import { DEFAULT_AGENT_NAME } from '../services/chat/knowledgeBase.js';
import { sendEmailTo, isEmailConfigured } from '../utils/sendEmail.js';
import { buildChatReplyEmail } from '../utils/chatEmails.js';
import { logger } from '../config/logger.js';

// The visitor's widget checks in at least once a minute while the site is open
// (less often in a background tab), so two minutes of silence means they left.
const VISITOR_ONLINE_MS = 2 * 60 * 1000;

const visitorOnline = (conversation) =>
  Boolean(conversation?.visitorSeenAt) && Date.now() - new Date(conversation.visitorSeenAt).getTime() < VISITOR_ONLINE_MS;

// A reply to a visitor who has left the site also goes to their email, so the
// promise in the chat ("we'll email you our reply") holds. Failures are logged;
// the reply itself is already saved in the chat.
async function emailReplyToVisitor(conversation, message) {
  try {
    await sendEmailTo({
      to: conversation.visitor.email,
      ...buildChatReplyEmail({ visitorName: conversation.visitor.name, agentName: message.agentName, text: message.text }),
      replyTo: process.env.ADMIN_EMAIL || undefined,
    });
    await ChatMessage.updateOne({ _id: message._id }, { $set: { emailedAt: new Date() } });
  } catch (error) {
    logger.error({ err: error, conversationId: String(conversation._id) }, '[Email] Chat reply to visitor failed');
  }
}

const ALLOWED_STATUSES = ['active', 'waiting', 'closed'];
const MAX_REPLY_LENGTH = 2000;

function findConversation(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return ChatConversation.findById(id);
}

function serializeConversation(conversation) {
  return {
    _id: conversation._id,
    status: conversation.status,
    visitor: conversation.visitor,
    productContext: conversation.productContext,
    inquiryRefs: conversation.inquiryRefs,
    handoffRequested: conversation.handoffRequested,
    unreadForAdmin: conversation.unreadForAdmin,
    lastMessagePreview: conversation.lastMessagePreview,
    lastMessageAt: conversation.lastMessageAt,
    handoffAt: conversation.handoffAt || null,
    firstAgentReplyAt: conversation.firstAgentReplyAt || null,
    visitorSeenAt: conversation.visitorSeenAt || null,
    visitorOnline: visitorOnline(conversation),
    createdAt: conversation.createdAt,
  };
}

// Control characters would break the transcript and the widget.
const plain = (value, max) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export async function listConversations(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ items: [], total: 0, page: 1, limit: 20, hasMore: false, waitingCount: 0 });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const status = String(req.query.status || '').toLowerCase();

    const filter = {};
    if (ALLOWED_STATUSES.includes(status)) filter.status = status;
    if (req.query.handoff === 'true') filter.handoffRequested = true;

    const [total, conversations, waitingCount] = await Promise.all([
      ChatConversation.countDocuments(filter),
      ChatConversation.find(filter)
        .sort({ lastMessageAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChatConversation.countDocuments({ status: 'waiting' }),
    ]);

    res.json({
      items: conversations.map(serializeConversation),
      total,
      page,
      limit,
      hasMore: page * limit < total,
      waitingCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const conversation = await findConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await ChatMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(300)
      .lean();

    if (conversation.unreadForAdmin) {
      conversation.unreadForAdmin = 0;
      await conversation.save();
    }

    res.json({
      conversation: serializeConversation(conversation),
      messages: messages.map((message) => ({
        id: String(message._id),
        role: message.role,
        text: message.text,
        cards: message.payload?.cards,
        agentEmail: message.agentEmail,
        agentName: message.agentName,
        emailedAt: message.emailedAt || null,
        at: message.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function replyToConversation(req, res, next) {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, MAX_REPLY_LENGTH) : '';
    if (!text) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const conversation = await findConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.status === 'closed') {
      return res.status(409).json({ error: 'Conversation is closed' });
    }

    const settings = await SupportSettings.current();
    const message = await ChatMessage.create({
      conversationId: conversation._id,
      role: 'agent',
      text,
      agentEmail: req.admin?.email || '',
      agentName: settings.agentName || DEFAULT_AGENT_NAME,
    });

    // An agent reply clears the queue flag but keeps handoffRequested set, so the
    // assistant stays out of the thread for the rest of the conversation.
    if (!conversation.firstAgentReplyAt) conversation.firstAgentReplyAt = message.createdAt;
    conversation.status = 'active';
    conversation.handoffRequested = true;
    conversation.unreadForAdmin = 0;
    conversation.lastMessagePreview = text.slice(0, 140);
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const emailing = Boolean(conversation.visitor?.email) && !visitorOnline(conversation) && isEmailConfigured();
    if (emailing) emailReplyToVisitor(conversation, message);

    res.status(201).json({
      emailing,
      message: {
        id: String(message._id),
        role: message.role,
        text: message.text,
        agentEmail: message.agentEmail,
        agentName: message.agentName,
        at: message.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateConversationStatus(req, res, next) {
  try {
    const status = String(req.body?.status || '').toLowerCase();
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const conversation = await findConversation(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.status = status;
    await conversation.save();

    res.json({ success: true, conversation: serializeConversation(conversation) });
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------------ alerts

// What the admin panel's badge and alerts need: conversations where a visitor
// asked for the team and is waiting or has written since the last look.
// Bot-only chats are left out: the assistant is handling those.
export async function getChatSummary(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) return res.json({ needsReply: 0, waiting: 0, latest: null });

    const needsReplyFilter = {
      handoffRequested: true,
      status: { $ne: 'closed' },
      $or: [{ status: 'waiting' }, { unreadForAdmin: { $gt: 0 } }],
    };
    const [needsReply, waiting, latest, oldestWaiting] = await Promise.all([
      ChatConversation.countDocuments(needsReplyFilter),
      ChatConversation.countDocuments({ handoffRequested: true, status: 'waiting' }),
      ChatConversation.findOne(needsReplyFilter).sort({ lastMessageAt: -1 }).select('visitor lastMessagePreview lastMessageAt').lean(),
      ChatConversation.findOne({ handoffRequested: true, status: 'waiting' }).sort({ handoffAt: 1 }).select('handoffAt lastMessageAt').lean(),
    ]);

    res.json({
      needsReply,
      waiting,
      oldestWaitingSince: oldestWaiting ? oldestWaiting.handoffAt || oldestWaiting.lastMessageAt : null,
      latest: latest
        ? {
            id: String(latest._id),
            name: latest.visitor?.name || latest.visitor?.email || 'A visitor',
            preview: latest.lastMessagePreview || '',
            at: latest.lastMessageAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------------ settings

export async function getLiveChatSettings(req, res, next) {
  try {
    const { available, waitText, agentName, updatedAt } = await SupportSettings.current();
    res.json({ available, waitText, agentName, defaultAgentName: DEFAULT_AGENT_NAME, updatedAt });
  } catch (error) {
    next(error);
  }
}

export async function updateLiveChatSettings(req, res, next) {
  try {
    const update = {};
    if (req.body?.available !== undefined) {
      if (typeof req.body.available !== 'boolean') return res.status(400).json({ error: 'available must be true or false.' });
      update.available = req.body.available;
    }
    if (req.body?.waitText !== undefined) {
      const waitText = plain(req.body.waitText, 41);
      if (!waitText || waitText.length > 40) return res.status(400).json({ error: 'Expected wait must be 1 to 40 characters, e.g. "5–10 minutes".' });
      update.waitText = waitText;
    }
    if (req.body?.agentName !== undefined) {
      const agentName = plain(req.body.agentName, 41);
      if (agentName.length > 40) return res.status(400).json({ error: 'The name shown to customers can be at most 40 characters.' });
      if (/@|https?:|www\./i.test(agentName)) return res.status(400).json({ error: 'Use a name, not an email address or link.' });
      update.agentName = agentName;
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update.' });

    update.updatedBy = req.admin?.email || '';
    const saved = await SupportSettings.change(update);
    res.json({
      available: saved.available,
      waitText: saved.waitText,
      agentName: saved.agentName,
      defaultAgentName: DEFAULT_AGENT_NAME,
      updatedAt: saved.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------------ quick replies

const MAX_QUICK_REPLIES = 50;

const serializeQuickReply = (reply) => ({ id: String(reply._id), title: reply.title, text: reply.text, order: reply.order });

function readQuickReply(body) {
  const title = plain(body?.title, 41);
  const text = typeof body?.text === 'string' ? body.text.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim() : '';
  if (!title || title.length > 40) return { error: 'Give the reply a short title (up to 40 characters).' };
  if (!text || text.length > 1000) return { error: 'The reply text must be 1 to 1000 characters.' };
  return { title, text };
}

export async function listQuickReplies(req, res, next) {
  try {
    // The starter replies are added the first time, and only once, even when
    // several requests arrive together.
    if (await SupportSettings.claimQuickReplySeed()) {
      if (!(await QuickReply.countDocuments())) {
        await QuickReply.insertMany(STARTER_QUICK_REPLIES.map((reply, index) => ({ ...reply, order: index })));
      }
    }
    const replies = await QuickReply.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ items: replies.map(serializeQuickReply) });
  } catch (error) {
    next(error);
  }
}

export async function createQuickReply(req, res, next) {
  try {
    const input = readQuickReply(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    if ((await QuickReply.countDocuments()) >= MAX_QUICK_REPLIES) {
      return res.status(400).json({ error: `You can keep up to ${MAX_QUICK_REPLIES} quick replies.` });
    }
    const last = await QuickReply.findOne().sort({ order: -1 }).select('order').lean();
    const reply = await QuickReply.create({ ...input, order: (last?.order ?? -1) + 1, createdBy: req.admin?.email || '' });
    res.status(201).json({ item: serializeQuickReply(reply) });
  } catch (error) {
    next(error);
  }
}

export async function updateQuickReply(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Quick reply not found.' });
    const input = readQuickReply(req.body);
    if (input.error) return res.status(400).json({ error: input.error });
    const reply = await QuickReply.findByIdAndUpdate(req.params.id, { $set: input }, { new: true });
    if (!reply) return res.status(404).json({ error: 'Quick reply not found.' });
    res.json({ item: serializeQuickReply(reply) });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuickReply(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Quick reply not found.' });
    const reply = await QuickReply.findByIdAndDelete(req.params.id);
    if (!reply) return res.status(404).json({ error: 'Quick reply not found.' });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
