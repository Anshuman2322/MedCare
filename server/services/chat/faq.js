// Finds the FAQ entry that answers a visitor's message. Used by the chat
// assistant (before the product search) and by the /api/faq search endpoint,
// so the page and the chat always agree. Forgiving about typos, word order,
// very short questions and Hinglish; honest when nothing fits.
import { publishedFaqs, categoryById } from '../../data/faq.js';
import { normalize, wordSimilarity } from './text.js';

// Words that say nothing about which question is being asked.
const STOP = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'do', 'does', 'did', 'i', 'im', 'you', 'u', 'your', 'ur', 'me', 'my', 'we',
  'us', 'our', 'to', 'of', 'in', 'on', 'at', 'for', 'it', 'its', 'this', 'that', 'can', 'could', 'will', 'would', 'shall',
  'and', 'or', 'with', 'please', 'pls', 'plz', 'hi', 'hello', 'hey', 'tell', 'about', 'there', 'any', 'be', 'have', 'has',
  'kya', 'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'mai', 'main', 'aap', 'ap', 'mujhe', 'muje', 'batao', 'bataiye',
  'what', 'whats', 'which', 'who', 'why', 'know', 'get', 'want', 'need', 'ye', 'yeh', 'wo', 'woh', 'bhi', 'ho', 'hota', 'hoga', 'hoti', 'karna', 'kare', 'kar', 'karo', 'sakta', 'sakte', 'sakti',
]);

const tokens = (text) => normalize(text).split(' ').filter((word) => word && !STOP.has(word));

// Fuzzy share of the query's words that appear in the candidate (typos count).
function overlap(queryTokens, candidateTokens) {
  if (!queryTokens.length || !candidateTokens.length) return 0;
  let total = 0;
  for (const word of queryTokens) {
    let best = 0;
    for (const other of candidateTokens) {
      const sim = word === other ? 1 : wordSimilarity(word, other);
      if (sim > best) best = sim;
      if (best === 1) break;
    }
    total += best >= 0.7 ? best : 0;
  }
  return total;
}

// One index per list of entries (the list is cached by faqStore, so this is built rarely).
const indexes = new WeakMap();
function buildIndex(entries) {
  const built = entries.map((item) => {
    const phrases = [item.question, ...item.alternatives].map((text) => ({ text: normalize(text), tokens: tokens(text) }));
    const keywordTokens = [...new Set(item.keywords.flatMap((word) => tokens(word)))];
    return { item, phrases, keywordTokens };
  });
  indexes.set(entries, built);
  return built;
}

function scoreEntry(entry, queryTokens, normalized) {
  let best = 0;
  for (const phrase of entry.phrases) {
    if (phrase.text === normalized) return 1.1;
    if (!phrase.tokens.length) continue;
    let score;
    const matched = overlap(queryTokens, phrase.tokens);
    if (!queryTokens.length) continue;
    // Dice-style: rewards covering the query and the phrase, not just a lucky word.
    score = (2 * matched) / (queryTokens.length + phrase.tokens.length);
    // Query fully contained in a longer phrase ("refund" in "refund policy") or vice versa.
    if (matched >= queryTokens.length - 0.01 && queryTokens.length >= 2) score = Math.max(score, 0.78);
    if (matched >= phrase.tokens.length - 0.01 && phrase.tokens.length >= 2) score = Math.max(score, 0.82);
    if (score > best) best = score;
  }
  // Keywords raise the score when the visitor's words are the topic words.
  const keywordHits = overlap(queryTokens, entry.keywordTokens);
  const bonus = Math.min(0.3, (keywordHits / (queryTokens.length || 1)) * 0.3);
  return Math.min(0.99, best + bonus * (best > 0.2 ? 1 : 0.6)) + entry.item.priority * 0.002;
}

export const ANSWER_THRESHOLD = 0.62;
export const SUGGEST_THRESHOLD = 0.36;

// Returns { match, suggestions } where match is { entry, score } or null.
export function searchFaq(text, { limit = 3, category = '', entries = publishedFaqs() } = {}) {
  const normalized = normalize(text);
  const queryTokens = tokens(text);
  if (!normalized) return { match: null, suggestions: [], ranked: [] };
  const ranked = (indexes.get(entries) || buildIndex(entries))
    .filter((entry) => !category || entry.item.category === category)
    .map((entry) => ({ entry: entry.item, score: scoreEntry(entry, queryTokens, normalized) }))
    .filter((result) => result.score >= SUGGEST_THRESHOLD)
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  return {
    match: top && top.score >= ANSWER_THRESHOLD ? top : null,
    suggestions: ranked.filter((result) => result !== top || !(top.score >= ANSWER_THRESHOLD)).slice(0, limit).map((result) => result.entry),
    ranked: ranked.slice(0, limit),
  };
}

export const faqById = (id, entries = publishedFaqs()) => entries.find((item) => item.id === id) || null;
export const categoryLabel = (id) => categoryById(id)?.label || '';
