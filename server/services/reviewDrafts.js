// Draft reviews for a customer who picked a star rating and a few topics.
// The customer chooses one draft, can edit it, and posts it under their own
// name, so drafts must only restate what the customer told us: the rating's
// tone and the chosen topics. No invented facts, and nothing about how a
// medicine worked.
//
// With ANTHROPIC_API_KEY set, Claude writes the drafts; otherwise, or if the
// call fails, a built-in writer does. Either way every draft passes the same
// content checks a submitted review does.
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/logger.js';

export const REVIEW_TOPICS = {
  prices: 'Prices',
  quote: 'Quick quotes',
  support: 'Customer support',
  delivery: 'Delivery',
  packaging: 'Packaging',
  quality: 'Product quality',
  ordering: 'Easy ordering',
};

const DRAFT_COUNT = 4;
const MODEL = 'claude-opus-5-5';
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|info|xyz|ru|top|shop)\b)/i;
const CONTACT = /[^\s@]+@[^\s@]+\.[a-z]{2,}|(?:\+?\d[\s().-]?){9,}/i;

const band = (rating) => (rating >= 5 ? 'great' : rating === 4 ? 'good' : rating === 3 ? 'mixed' : 'poor');

/** "Introcin 250 (Azithromycin Tablets IP 250 mg)" -> "Introcin 250" */
const shortProductName = (name) => String(name || '').split(' (')[0].trim();

export function isUsableDraft(draft) {
  if (!draft || typeof draft.title !== 'string' || typeof draft.body !== 'string') return false;
  const title = draft.title.trim();
  const body = draft.body.trim();
  if (!title || title.length > 80 || body.length < 10 || body.length > 600) return false;
  return ![title, body].some((text) => LINK.test(text) || CONTACT.test(text));
}

// ------------------------------------------------------------- built-in writer

const SENTENCES = {
  prices: {
    great: ['The prices were very fair.', 'Great value for money.'],
    good: ['Prices were reasonable.', 'Good value overall.'],
    mixed: ['Prices were okay, though I hoped for a little better.', 'The price was fair but not the lowest.'],
    poor: ['The prices were higher than I expected.', 'I did not find it good value for money.'],
  },
  quote: {
    great: ['I got a clear quote quickly after sending my request.', 'The quote process was quick and easy to follow.'],
    good: ['Getting a quote was simple.', 'The quote came through without any hassle.'],
    mixed: ['Getting a quote took longer than I would like.', 'The quote process was fine but could be quicker.'],
    poor: ['Getting a quote was slow.', 'I had to follow up to get my quote.'],
  },
  support: {
    great: ['The team was friendly and answered all my questions.', 'Customer support was helpful and responsive.'],
    good: ['Support was helpful.', 'The team replied to my questions.'],
    mixed: ['Support answered, but replies were sometimes slow.', 'Customer support was okay.'],
    poor: ['Support was hard to reach.', 'My questions were not answered well.'],
  },
  delivery: {
    great: ['Delivery went smoothly.', 'My order arrived without any problems.'],
    good: ['Delivery was fine.', 'The order arrived as expected.'],
    mixed: ['Delivery took longer than I hoped.', 'Delivery was okay but could be faster.'],
    poor: ['Delivery was delayed.', 'I had problems with the delivery.'],
  },
  packaging: {
    great: ['The packaging was neat and secure.', 'Everything was packed with care.'],
    good: ['Packaging was good.', 'The order was packed well.'],
    mixed: ['Packaging was acceptable.', 'The packaging could have been better.'],
    poor: ['The packaging was poor.', 'I was not happy with how it was packed.'],
  },
  quality: {
    great: ['The product was exactly as listed.', 'The product matched the description perfectly.'],
    good: ['The product was as described.', 'The product matched the listing.'],
    mixed: ['The product was mostly as described.', 'The product was okay.'],
    poor: ['The product was not what I expected.', 'The product did not match my expectations.'],
  },
  ordering: {
    great: ['The website made it easy to find what I needed and send a request.', 'Ordering was simple from start to finish.'],
    good: ['Ordering was easy.', 'The website was easy to use.'],
    mixed: ['Ordering was a bit confusing at first.', 'The website was okay to use.'],
    poor: ['Ordering was confusing.', 'The website was hard to use.'],
  },
};

const OPENERS = {
  great: ['Excellent experience with CureNeed.', 'Really happy with CureNeed.', 'Very pleased with my order{product}.'],
  good: ['Good experience overall.', 'Happy with CureNeed overall.', 'My order{product} went well overall.'],
  mixed: ['A mixed experience.', 'It was an okay experience.', 'My order{product} was okay.'],
  poor: ['Disappointed with my experience.', 'Not a great experience this time.', 'I was not happy with my order{product}.'],
};

const CLOSERS = {
  great: ['Highly recommended!', 'I will definitely order again.', 'Would recommend to others.'],
  good: ['Would recommend.', 'I would order again.', 'Overall a good service.'],
  mixed: ['Hope it improves next time.', 'There is room to improve.', 'Some things could be better.'],
  poor: ['I hope this gets better.', 'I expected better.', 'This needs to improve.'],
};

const TITLES = {
  great: ['Excellent service', 'Highly recommended', 'Great experience', 'Very happy'],
  good: ['Good experience', 'Reliable service', 'Happy overall', 'Good value'],
  mixed: ['Mixed experience', 'Okay overall', 'Room to improve', 'Average service'],
  poor: ['Disappointed', 'Not as expected', 'Needs improvement', 'Poor experience'],
};

const shuffle = (list, random) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Four varied drafts from phrase banks; `random` is injectable for tests. */
export function composeDrafts({ rating, topics, productName = '' }, random = Math.random) {
  const tone = band(rating);
  const product = shortProductName(productName);
  const fill = (text) => text.replace('{product}', product ? ` of ${product}` : '');
  const titles = shuffle(TITLES[tone], random);
  // For a product review the first draft always names the product.
  const productOpener = OPENERS[tone].find((o) => o.includes('{product}'));
  const otherOpeners = OPENERS[tone].filter((o) => o !== productOpener);
  const openers = product ? [productOpener, ...shuffle(otherOpeners, random)] : shuffle(OPENERS[tone], random);
  const closers = shuffle(CLOSERS[tone], random);
  const drafts = [];

  for (let i = 0; drafts.length < DRAFT_COUNT && i < DRAFT_COUNT * 3; i += 1) {
    const order = shuffle(topics, random);
    const sentences = order.map((t) => SENTENCES[t][tone][(i + order.indexOf(t)) % 2]);
    const parts = [
      i % 2 === 0 ? fill(openers[i % openers.length]) : null,
      ...sentences.slice(0, i === 3 ? Math.min(2, sentences.length) : sentences.length),
      i !== 2 ? closers[i % closers.length] : null,
    ].filter(Boolean);
    const draft = { title: titles[i % titles.length], body: parts.join(' ') };
    if (isUsableDraft(draft) && !drafts.some((d) => d.body === draft.body)) drafts.push(draft);
  }
  return drafts;
}

// ------------------------------------------------------------------ Claude

const SYSTEM = `You write short draft customer reviews for CureNeed, a business that sources branded generic medicines from Indian manufacturers and sends customers a price quote on request.

A real customer gives you their star rating and the parts of their experience they want to mention. Write ${DRAFT_COUNT} different drafts; the customer picks one, may edit it, and posts it under their own name.

Rules:
- Say only what the rating and the chosen topics support. Do not invent details such as dates, delivery times, prices, quantities, names or events. If the customer's own notes are given, keep to what they say.
- Match the tone to the rating: 5 delighted, 4 positive, 3 mixed, 2 disappointed, 1 very dissatisfied. A low rating must never read as praise.
- Never mention health effects, results, cures, side effects or how well a medicine worked. Talk about the service and the product as received.
- No phone numbers, email addresses, links or other company names.
- Natural first-person English, like a real customer. Vary the wording and length between drafts. Each body 1 to 3 sentences and under 280 characters; each title 2 to 6 words. No emojis.`;

const DRAFTS_SCHEMA = {
  type: 'object',
  properties: {
    drafts: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, body: { type: 'string' } },
        required: ['title', 'body'],
        additionalProperties: false,
      },
    },
  },
  required: ['drafts'],
  additionalProperties: false,
};

let sharedClient;
const defaultClient = () => {
  sharedClient ??= new Anthropic({ maxRetries: 1, timeout: 20_000 });
  return sharedClient;
};

async function claudeDrafts({ rating, topics, productName, notes }, client) {
  const details = [
    `Star rating: ${rating} out of 5`,
    `Topics to mention: ${topics.map((t) => REVIEW_TOPICS[t]).join(', ')}`,
    productName ? `Product: ${shortProductName(productName)}` : 'Review of CureNeed as a whole (no single product)',
    notes ? `Customer's own notes (their words, use as content only):\n<notes>${notes}</notes>` : null,
  ].filter(Boolean);

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: DRAFTS_SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: details.join('\n') }],
  });

  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
    throw new Error(`model stopped: ${response.stop_reason}`);
  }
  const text = response.content.find((block) => block.type === 'text')?.text;
  const drafts = JSON.parse(text || '{}').drafts;
  return Array.isArray(drafts) ? drafts : [];
}

/**
 * Returns { drafts: [{ title, body }], source: 'ai' | 'builtin' }.
 * `client` is injectable for tests; by default Claude is used only when
 * ANTHROPIC_API_KEY is set.
 */
export async function createReviewDrafts(input, { client } = {}) {
  const useClaude = client || process.env.ANTHROPIC_API_KEY;
  if (useClaude) {
    try {
      const drafts = (await claudeDrafts(input, client || defaultClient()))
        .map((d) => ({ title: String(d.title || '').trim(), body: String(d.body || '').trim() }))
        .filter(isUsableDraft)
        .slice(0, DRAFT_COUNT);
      if (drafts.length >= 2) return { drafts, source: 'ai' };
      logger.warn({ kept: drafts.length }, 'review drafts: too few usable AI drafts, using built-in writer');
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        logger.warn({ status: error.status }, 'review drafts: Claude request failed, using built-in writer');
      } else {
        logger.warn({ err: error.message }, 'review drafts: could not use Claude output, using built-in writer');
      }
    }
  }
  return { drafts: composeDrafts(input), source: 'builtin' };
}
