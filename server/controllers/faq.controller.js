import crypto from 'crypto';
import FaqFeedback from '../models/FaqFeedback.js';
import FaqEntry from '../models/FaqEntry.js';
import FaqQuestion from '../models/FaqQuestion.js';
import { faqPayload, FAQ_CATEGORIES, FAQ_ENTRIES } from '../data/faq.js';
import { searchFaq } from '../services/chat/faq.js';
import { loadFaqs, loadAllFaqs, invalidateFaqs } from '../services/faqStore.js';
import { logFaqEvent } from '../services/faqInsights.js';

// ------------------------------------------------------------------ public

// GET /api/faq: the whole knowledge base (it is small), for the FAQ page.
export async function listFaq(_req, res, next) {
  try {
    res.set('Cache-Control', 'public, max-age=60');
    res.json(faqPayload(await loadFaqs()));
  } catch (error) {
    next(error);
  }
}

// GET /api/faq/search?q=...&category=...: ranked answers, typo tolerant.
export async function searchFaqRoute(req, res, next) {
  try {
    const q = String(req.query.q || '').slice(0, 200);
    const category = String(req.query.category || '').slice(0, 40);
    const { match, ranked } = searchFaq(q, { limit: 8, category, entries: await loadFaqs() });
    // A search that finds nothing is a question the FAQ can't answer yet: tell the team.
    if (!ranked.length && q.trim().length >= 4 && !category) logFaqEvent({ text: q, outcome: 'unanswered', source: 'page' });
    res.json({
      query: q,
      best: match ? match.entry.id : null,
      results: ranked.map((result) => ({ id: result.entry.id, score: Number(Math.min(result.score, 1).toFixed(2)) })),
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/faq/:id/feedback { helpful: boolean }
export async function voteFaq(req, res, next) {
  try {
    const id = String(req.params.id || '');
    if (!(await loadFaqs()).some((item) => item.id === id)) return res.status(404).json({ error: 'Question not found' });
    if (typeof req.body?.helpful !== 'boolean') return res.status(400).json({ error: 'helpful must be true or false' });
    const field = req.body.helpful ? 'helpful' : 'unhelpful';
    const doc = await FaqFeedback.findOneAndUpdate({ faqId: id }, { $inc: { [field]: 1 } }, { upsert: true, new: true });
    return res.status(201).json({ ok: true, helpful: doc.helpful, unhelpful: doc.unhelpful });
  } catch (error) {
    return next(error);
  }
}

// ------------------------------------------------------------------ admin: answers

const asText = (value, max) => String(value ?? '').trim().slice(0, max);
const asList = (value, max, each) =>
  (Array.isArray(value) ? value : String(value ?? '').split('\n'))
    .map((item) => asText(item, each))
    .filter(Boolean)
    .slice(0, max);

// Validates and cleans an entry from the admin form. Returns { error } or { fields }.
function cleanEntry(body, { requireAll = true } = {}) {
  const fields = {
    category: asText(body.category, 40),
    question: asText(body.question, 200),
    answer: asText(body.answer, 2000),
    alternatives: asList(body.alternatives, 15, 200),
    keywords: asList(body.keywords, 25, 40),
    priority: Math.min(10, Math.max(1, Math.round(Number(body.priority) || 5))),
    published: body.published !== false,
    escalate: Boolean(body.escalate),
    related: asList(body.related, 4, 80),
    links: (Array.isArray(body.links) ? body.links : [])
      .map((link) => ({ label: asText(link?.label, 60), to: asText(link?.to, 200) }))
      .filter((link) => link.label && /^(?:\/[^\s]*|https:\/\/[^\s]+)$/.test(link.to))
      .slice(0, 3),
  };
  if (requireAll) {
    if (!FAQ_CATEGORIES.some((category) => category.id === fields.category)) return { error: 'Choose a category.' };
    if (fields.question.length < 5) return { error: 'The question needs at least 5 characters.' };
    if (fields.answer.length < 10) return { error: 'The answer needs at least 10 characters.' };
  }
  return { fields };
}

// GET /api/admin/faq/entries: every question (hidden ones too) with its votes.
export async function adminListEntries(_req, res, next) {
  try {
    const [entries, votes] = await Promise.all([loadAllFaqs(), FaqFeedback.find().lean()]);
    const byId = new Map(votes.map((row) => [row.faqId, row]));
    res.json({
      categories: FAQ_CATEGORIES,
      entries: entries.map((entry) => ({
        ...entry,
        helpful: byId.get(entry.id)?.helpful || 0,
        unhelpful: byId.get(entry.id)?.unhelpful || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/faq/entries: add a new question and answer.
export async function adminCreateEntry(req, res, next) {
  try {
    const { error, fields } = cleanEntry(req.body || {});
    if (error) return res.status(400).json({ error });
    const doc = await FaqEntry.create({
      ...fields,
      faqId: `custom-${crypto.randomBytes(4).toString('hex')}`,
      custom: true,
      updatedBy: req.admin?.email || '',
    });
    invalidateFaqs();
    // A question can be answered straight from the "asked by visitors" list.
    const fromQuestion = String(req.body?.fromQuestionId || '');
    if (/^[a-f0-9]{24}$/i.test(fromQuestion)) {
      await FaqQuestion.updateOne({ _id: fromQuestion }, { $set: { status: 'resolved', resolvedFaqId: doc.faqId } });
    }
    res.status(201).json({ ok: true, id: doc.faqId });
  } catch (error) {
    next(error);
  }
}

// PUT /api/admin/faq/entries/:id: edit a custom question, or save an edited copy of a built-in one.
export async function adminUpdateEntry(req, res, next) {
  try {
    const id = asText(req.params.id, 80);
    const builtin = FAQ_ENTRIES.some((entry) => entry.id === id);
    const existing = await FaqEntry.findOne({ faqId: id });
    if (!builtin && !existing) return res.status(404).json({ error: 'Question not found' });
    const { error, fields } = cleanEntry(req.body || {});
    if (error) return res.status(400).json({ error });
    await FaqEntry.findOneAndUpdate(
      { faqId: id },
      { $set: { ...fields, custom: !builtin, updatedBy: req.admin?.email || '' }, $setOnInsert: { faqId: id } },
      { upsert: true }
    );
    invalidateFaqs();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/faq/entries/:id: removes a custom question, or restores a built-in one to its original text.
export async function adminDeleteEntry(req, res, next) {
  try {
    const id = asText(req.params.id, 80);
    const result = await FaqEntry.deleteOne({ faqId: id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Nothing to remove for this question' });
    invalidateFaqs();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------------ admin: what visitors asked

const OUTCOMES = ['answered', 'escalated', 'suggested', 'unanswered'];
const STATUSES = ['new', 'resolved', 'ignored'];

// GET /api/admin/faq/questions?status=&outcome=&q=&sort=&page=
export async function adminListQuestions(req, res, next) {
  try {
    const filter = {};
    if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (OUTCOMES.includes(req.query.outcome)) filter.outcome = req.query.outcome;
    const search = asText(req.query.q, 80);
    if (search) filter.text = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 25;
    const sort = req.query.sort === 'popular' ? { count: -1, lastAskedAt: -1 } : { lastAskedAt: -1 };

    const [rows, total, summary] = await Promise.all([
      FaqQuestion.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      FaqQuestion.countDocuments(filter),
      faqQuestionSummary(),
    ]);
    const entries = await loadAllFaqs();
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    res.json({
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
      summary,
      questions: rows.map((row) => ({
        ...row,
        faqQuestion: byId.get(row.faqId)?.question || row.faqQuestion || '',
        resolvedFaqQuestion: byId.get(row.resolvedFaqId)?.question || '',
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function faqQuestionSummary() {
  const [open, unanswered, total] = await Promise.all([
    FaqQuestion.countDocuments({ status: 'new', outcome: { $in: ['unanswered', 'suggested'] } }),
    FaqQuestion.countDocuments({ status: 'new', outcome: 'unanswered' }),
    FaqQuestion.countDocuments({}),
  ]);
  return { needsAnswer: open, unanswered, total };
}

// GET /api/admin/faq/summary: the number for the sidebar badge.
export async function adminFaqSummary(_req, res, next) {
  try {
    res.json(await faqQuestionSummary());
  } catch (error) {
    next(error);
  }
}

// PATCH /api/admin/faq/questions/:id { status, note, resolvedFaqId }
export async function adminUpdateQuestion(req, res, next) {
  try {
    const set = {};
    if (req.body?.status !== undefined) {
      if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
      set.status = req.body.status;
    }
    if (req.body?.note !== undefined) set.note = asText(req.body.note, 500);
    if (req.body?.resolvedFaqId !== undefined) set.resolvedFaqId = asText(req.body.resolvedFaqId, 80);
    if (!/^[a-f0-9]{24}$/i.test(String(req.params.id))) return res.status(404).json({ error: 'Not found' });
    const doc = await FaqQuestion.findByIdAndUpdate(req.params.id, { $set: set }, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/faq/questions/:id
export async function adminDeleteQuestion(req, res, next) {
  try {
    if (!/^[a-f0-9]{24}$/i.test(String(req.params.id))) return res.status(404).json({ error: 'Not found' });
    const result = await FaqQuestion.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/faq-feedback: counts per question, worst-rated first (kept for older callers).
export async function faqFeedbackSummary(_req, res, next) {
  try {
    const [rows, entries] = await Promise.all([FaqFeedback.find().lean(), loadAllFaqs()]);
    const byId = new Map(rows.map((row) => [row.faqId, row]));
    const items = entries.map((item) => {
      const row = byId.get(item.id);
      return { id: item.id, category: item.category, question: item.question, helpful: row?.helpful || 0, unhelpful: row?.unhelpful || 0 };
    });
    items.sort((a, b) => b.unhelpful - a.unhelpful || b.helpful - a.helpful);
    res.json(items);
  } catch (error) {
    next(error);
  }
}
