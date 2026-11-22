// The live FAQ: the built-in entries in data/faq.js with the team's changes from
// the admin panel applied (edited answers, hidden questions, added questions).
// The chat, the /faq page and the Claude prompt all read it from here.
// Cached briefly so a chat message doesn't hit the database; the admin routes
// clear the cache after every change.
import mongoose from 'mongoose';
import FaqEntry from '../models/FaqEntry.js';
import { FAQ_ENTRIES } from '../data/faq.js';

const TTL_MS = 15_000;
let cache = null;

export const invalidateFaqs = () => {
  cache = null;
};

const EDITABLE = ['category', 'question', 'answer', 'alternatives', 'keywords', 'priority', 'published', 'escalate', 'related', 'links'];

function fromDoc(doc) {
  const entry = {};
  for (const field of EDITABLE) entry[field] = doc[field];
  entry.alternatives = [...(doc.alternatives || [])];
  entry.keywords = [...(doc.keywords || [])];
  entry.related = [...(doc.related || [])];
  entry.links = (doc.links || []).map((link) => ({ label: link.label, to: link.to }));
  return entry;
}

async function build() {
  let docs = [];
  if (mongoose.connection.readyState === 1) {
    docs = await FaqEntry.find().lean().catch(() => []);
  }
  const byId = new Map(docs.map((doc) => [doc.faqId, doc]));
  const all = FAQ_ENTRIES.map((builtin) => {
    const override = byId.get(builtin.id);
    return override
      ? { ...builtin, ...fromDoc(override), id: builtin.id, custom: false, edited: true }
      : { ...builtin, custom: false, edited: false };
  });
  for (const doc of docs) {
    if (!FAQ_ENTRIES.some((builtin) => builtin.id === doc.faqId)) {
      all.push({ id: doc.faqId, ...fromDoc(doc), custom: true, edited: false });
    }
  }
  return { all, published: all.filter((entry) => entry.published) };
}

async function current() {
  if (!cache || Date.now() - cache.at > TTL_MS) cache = { at: Date.now(), ...(await build()) };
  return cache;
}

/** Published entries (what visitors see). The same array is returned until the cache is cleared. */
export async function loadFaqs() {
  return (await current()).published;
}

/** Every entry, hidden ones included, with `custom` / `edited` flags (admin panel). */
export async function loadAllFaqs() {
  return (await current()).all;
}
