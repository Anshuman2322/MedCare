import { detect, looksLikeMedicineName } from './intent.js';
import { needsMedicalRefusal } from './safety.js';
import * as catalog from './catalog.js';
import * as kb from './knowledgeBase.js';
import { firstName, words } from './text.js';
import { aiEnabled, aiRespond } from './ai.js';

// The chat assistant. Every visitor message goes through:
//   1. the medical-advice guardrail (always first, never skipped);
//   2. "start over" requests;
//   3. Claude, when ANTHROPIC_API_KEY is set (natural conversation grounded in
//      the catalogue and the business facts, see ai.js);
//   4. otherwise, or whenever the AI call fails, the rule-based assistant below.
// Both answer only from the catalogue and knowledgeBase.js, never from guesses.

const reply = ({ text, cards, quickActions, form, awaiting = '' }) => ({
  text,
  cards: cards?.length ? cards : undefined,
  quickActions: quickActions?.length ? quickActions : undefined,
  form: form || undefined,
  awaiting,
});

// ------------------------------------------------------------------ memory

// What the assistant remembers between messages: the product being talked
// about, what a bare "yes" would mean, and how many replies in a row missed.
function stateOf(conversation) {
  const context = conversation?.context || {};
  return {
    lastMedicineSlug: context.lastMedicineSlug || '',
    offer: context.offer?.kind
      ? { type: context.offer.kind, slug: context.offer.slug || '', quantity: Number(context.offer.quantity) || 0 }
      : null,
    misses: Number(context.misses) || 0,
    turns: Number(context.turns) || 0,
    options: Array.isArray(context.options) ? [...context.options] : [],
  };
}

function remember(conversation, patch) {
  if (!conversation) return;
  const next = { ...stateOf(conversation), ...patch };
  next.offer = next.offer?.type
    ? { kind: next.offer.type, slug: next.offer.slug || '', quantity: Number(next.offer.quantity) || 0 }
    : { kind: '', slug: '', quantity: 0 };
  if (typeof conversation.set === 'function') conversation.set('context', next);
  else conversation.context = next;
}

const visitorName = (conversation) => firstName(conversation?.visitor?.name);

const contextActions = (conversation) =>
  conversation?.productContext?.slug ? kb.PRODUCT_ACTIONS : kb.HOME_ACTIONS;

const shippingChips = () => kb.SHIPPING_TOPICS.map((topic) => ({ id: topic.id, label: topic.label }));

export function greeting(conversation) {
  const product = conversation?.productContext;
  const seed = stateOf(conversation).turns;
  return reply({
    text: product?.name ? kb.productWelcomeText(product.name) : kb.welcomeText(seed, conversation?.visitor?.name),
    quickActions: contextActions(conversation),
  });
}

// ------------------------------------------------------------------ products

const card = (medicine) => catalog.toMedicineCard(medicine);
const name = (medicine) => catalog.shortName(medicine.name);

async function productBySlug(slug, catalogue) {
  if (!slug) return null;
  return catalogue?.find((medicine) => medicine.slug === slug) || (await catalog.findMedicineBySlug(slug));
}

// The product a question is about: the one named in the message, else the one
// just discussed, else the page the visitor is on.
async function currentProduct(conversation, mentioned, catalogue) {
  if (mentioned.length === 1) return mentioned[0].medicine;
  if (mentioned.length > 1) return null;
  const state = stateOf(conversation);
  return (
    (await productBySlug(state.lastMedicineSlug, catalogue)) ||
    (await productBySlug(conversation?.productContext?.slug, catalogue))
  );
}

function aboutProduct(conversation, medicine, { offerQuote = true } = {}) {
  remember(conversation, {
    lastMedicineSlug: medicine.slug,
    options: [],
    offer: offerQuote ? { type: 'quote', slug: medicine.slug } : null,
    misses: 0,
  });
}

// "50 boxes", "20 strips", "100 pcs": how many packs the visitor has in mind.
const QUANTITY = /\b(\d{1,6})\s*(?:x\s*)?(boxes|box|strips?|bottles?|packs?|packets?|units?|pcs|pieces|sachets?|tubes?|vials?)\b/i;

function quantityIn(message) {
  const match = String(message).match(QUANTITY);
  return match ? Number(match[1]) : 0;
}

// The pack named with the quantity, singular ("boxes" -> "box"), if any.
function packIn(message) {
  const unit = String(message).match(QUANTITY)?.[2]?.toLowerCase() || '';
  if (!unit) return '';
  return unit === 'boxes' ? 'box' : unit.replace(/s$/, '');
}

// The message without its quantity, so "50 boxes cenforce" searches "cenforce".
const withoutQuantity = (message) => String(message).replace(QUANTITY, ' ').replace(/\s+/g, ' ').trim();

function priceReply(conversation, medicine, message = '') {
  aboutProduct(conversation, medicine);
  const price = catalog.priceLine(medicine);
  const unit = Number(medicine.variants?.[0]?.price);
  const qty = quantityIn(message);
  let text;
  if (price && qty > 1 && Number.isFinite(unit) && unit > 0) {
    const pack = String(medicine.variants?.[0]?.packagingType || 'pack').toLowerCase();
    const packs = pack === 'box' ? 'boxes' : `${pack}s`;
    remember(conversation, { offer: { type: 'quote', slug: medicine.slug, quantity: qty } });
    text = `${name(medicine)} is listed at ${price}, so ${qty} ${packs} come to ${catalog.formatUsd(unit * qty)} at the listed price. For larger quantities our team can often quote better, and shipping is added in your quote.\n\nWant me to start a quote for ${qty} ${packs}?`;
  } else if (price) {
    text = `${name(medicine)} is listed at ${price}. The final price for your quantity, with shipping, comes in your quote.\n\nWould you like me to start a quote for it?`;
  } else {
    text = `${name(medicine)} doesn't have a listed price right now, but our team will quote it for you.\n\nShall I start a quote request?`;
  }
  return reply({ text, cards: [card(medicine)], quickActions: kb.productActions(medicine) });
}

function availabilityReply(conversation, medicine) {
  aboutProduct(conversation, medicine);
  const extra = medicine.inStock === false ? [{ id: `alternatives:${medicine.slug}`, label: 'Same composition', icon: '🔁' }] : [];
  return reply({
    text: catalog.availabilityLine(medicine),
    cards: [card(medicine)],
    quickActions: kb.productActions(medicine, ...extra),
  });
}

function detailsReply(conversation, medicine) {
  aboutProduct(conversation, medicine);
  const lines = catalog.buildProductInfoLines(medicine);
  return reply({
    text: `Here's what we have on ${medicine.name}:\n\n${lines.join('\n')}\n\nWant a quote for it?`,
    quickActions: [
      { id: `inquire:${medicine.slug}`, label: 'Get a Quote', icon: '📩' },
      { id: `alternatives:${medicine.slug}`, label: 'Same composition', icon: '🔁' },
      kb.QUICK_ACTIONS.human,
    ],
  });
}

function prescriptionReply(conversation, medicine) {
  if (!medicine) {
    return reply({ text: kb.PRESCRIPTION_ANSWER, quickActions: [kb.QUICK_ACTIONS.find_medicine, kb.QUICK_ACTIONS.human] });
  }
  aboutProduct(conversation, medicine);
  const requirement = medicine.requiresPrescription
    ? `${name(medicine)} is listed as needing a valid prescription.`
    : `${name(medicine)} isn't marked as prescription-required in our catalogue.`;
  return reply({
    text: `${requirement} Our team confirms any verification steps for your country while preparing your quote.\n\nFor advice on whether it's right for you, please check with your doctor or pharmacist.`,
    quickActions: kb.productActions(medicine),
  });
}

async function alternativesReply(conversation, medicine, catalogue) {
  const others = await catalog.alternativesFor(medicine, { catalogue });
  remember(conversation, { lastMedicineSlug: medicine.slug, offer: null, misses: 0 });
  if (!others.length) {
    return reply({
      text: `I couldn't find another product with the same composition as ${name(medicine)} in our catalogue. Our team may be able to source one: would you like me to connect you?`,
      quickActions: [kb.QUICK_ACTIONS.human, { id: `inquire:${medicine.slug}`, label: `Quote for ${name(medicine)}`, icon: '📩' }],
    });
  }
  return reply({
    text: `These have the same active ingredient as ${name(medicine)}:\n\nPlease check with your doctor or pharmacist before switching brands.`,
    cards: others.map(card),
  });
}

function quoteFormReply(conversation, medicine, quantity = 0, pack = '') {
  remember(conversation, { lastMedicineSlug: medicine.slug, offer: null, misses: 0, options: [] });
  // Preselect the pack the visitor named, when the form offers it.
  const own = String(medicine.variants?.[0]?.packagingType || '').trim().toLowerCase() || 'box';
  const packagingType = pack && [own, own === 'box' ? 'strip' : 'box'].includes(pack) ? pack : '';
  return reply({
    text: `Great, let's get you a quote for ${name(medicine)}. Just fill in the details below, it takes about a minute.`,
    form: {
      id: 'inquiry',
      medicine: card(medicine),
      ...(quantity > 0 ? { quantity } : {}),
      ...(packagingType ? { packagingType } : {}),
    },
  });
}

// Several products match: show them with prices, let the visitor pick.
function chooseReply(conversation, matches, { lead, total, seeAll } = {}) {
  remember(conversation, { offer: null, misses: 0, lastMedicineSlug: '', options: matches.map(({ medicine }) => medicine.slug) });
  const list = matches.map(({ medicine }) => {
    const price = catalog.priceLine(medicine);
    return `• ${name(medicine)}${price ? `: ${price}` : ''}`;
  });
  const more = total > matches.length ? `\n\n…and ${total - matches.length} more.` : '';
  const actions = seeAll ? [{ id: 'link', label: `See all ${total}`, icon: '🔎', href: seeAll }] : [];
  return reply({
    text: `${lead}\n\n${list.join('\n')}${more}`,
    cards: matches.map(({ medicine }) => card(medicine)),
    quickActions: actions,
  });
}

const displayQuery = (text) => catalog.productTerms(withoutQuantity(text)).join(' ') || withoutQuantity(text);
const shopSearch = (query) => `/shop?search=${encodeURIComponent(query)}`;

async function searchReply(conversation, text, search, catalogue, { purpose = 'find' } = {}) {
  const { results, total, brand } = search;
  const query = displayQuery(text);

  if (!results.length) return notFoundReply(conversation, text, catalogue, brand);

  const [first] = results;
  if (results.length === 1) {
    const medicine = first.medicine;
    if (purpose === 'quote') return quoteFormReply(conversation, medicine, quantityIn(text), packIn(text));
    if (purpose === 'price') return priceReply(conversation, medicine, text);
    if (purpose === 'availability') return availabilityReply(conversation, medicine);
    if (purpose === 'details') return detailsReply(conversation, medicine);

    aboutProduct(conversation, medicine);
    const price = catalog.priceLine(medicine);
    const opener = first.exact ? `Yes, we have ${medicine.name}.` : `Did you mean ${medicine.name}? Here it is.`;
    return reply({
      text: `${opener}${price ? ` It's listed at ${price}.` : ''}${medicine.inStock === false ? ' It is currently out of stock.' : ''}\n\nWould you like a quote, or more details?`,
      cards: [card(medicine)],
      quickActions: kb.productActions(medicine),
    });
  }

  let lead;
  if (brand) {
    lead = `We don't sell ${brand.brand.replace(/^\w/, (c) => c.toUpperCase())} itself, but we have ${total} product${total === 1 ? '' : 's'} with the same active ingredient (${brand.molecule}):`;
  } else if (!first.exact) {
    lead = `I couldn't find "${query}" exactly. Did you mean one of these?`;
  } else if (purpose === 'price') {
    lead = `Here are the listed prices:`;
  } else if (total <= results.length) {
    lead = `Yes, we have ${total} options for "${query}":`;
  } else {
    lead = total > results.length ? `I found ${total} matches for "${query}". Here are the closest:` : `Here's what I found for "${query}":`;
  }
  const seeAll = total > results.length ? shopSearch(brand ? brand.molecule : query) : '';
  return chooseReply(conversation, results, { lead, total, seeAll });
}

async function notFoundReply(conversation, text, catalogue, brand) {
  const query = displayQuery(text);
  const suggestions = brand ? [] : await catalog.suggestNames(text, { catalogue });
  remember(conversation, { offer: { type: 'handoff', slug: '' } });

  if (suggestions.length) {
    return reply({
      text: `I couldn't find "${query}" in our catalogue. Did you mean one of these?`,
      quickActions: [
        ...suggestions.map((medicine) => ({ id: `search:${name(medicine)}`, label: name(medicine), icon: '💊' })),
        kb.QUICK_ACTIONS.human,
      ],
    });
  }

  return reply({
    text: brand
      ? `We don't currently list ${brand.brand} or another product with ${brand.molecule}. Our team may be able to source it for you: would you like me to connect you?`
      : `I couldn't find "${query}" in our catalogue right now. Our team may still be able to source it for you: would you like me to connect you?`,
    quickActions: [kb.QUICK_ACTIONS.human, kb.QUICK_ACTIONS.browse],
  });
}

async function categoryReply(conversation, label, catalogue) {
  const items = await catalog.medicinesInCategory(label, { catalogue, limit: 4 });
  const total = (catalogue || []).filter((medicine) => medicine.category === label).length || items.length;
  remember(conversation, { offer: null, misses: 0 });
  if (!items.length) return reply({ text: `I don't see any ${label} products right now.`, quickActions: [kb.QUICK_ACTIONS.browse] });
  return reply({
    text: total > items.length ? `Here are some of our ${label} products (${total} in total):` : `Here's what we have in ${label}:`,
    cards: items.map(card),
    quickActions:
      total > items.length
        ? [{ id: 'link', label: `See all ${total} in ${label}`, icon: '🔎', href: `/shop?category=${encodeURIComponent(label)}` }]
        : undefined,
  });
}

async function browseReply(conversation, catalogue) {
  const categories = await catalog.listCategories({ catalogue });
  remember(conversation, { offer: null, misses: 0 });
  const total = categories.reduce((sum, item) => sum + item.count, 0);
  return reply({
    text: `We currently carry ${total} medicines across ${categories.length} categories. Tap one to see what's in it, or just type a medicine name.`,
    quickActions: categories.map((item) => ({ id: `category:${item.label}`, label: `${item.label} (${item.count})` })),
  });
}

function askWhichProduct(conversation, awaiting, question) {
  remember(conversation, { offer: null });
  return reply({ text: question, awaiting });
}

const handoffReply = (conversation) => {
  remember(conversation, { offer: null, misses: 0 });
  return reply({ text: kb.humanSupportIntro(), form: { id: 'handoff' } });
};

const statusReply = (conversation, referenceId = '') => {
  remember(conversation, { offer: null, misses: 0 });
  return reply({
    text: referenceId
      ? `Sure, I'll look up ${referenceId}. Please confirm the email address you used on it, so I know it's yours.`
      : `Happy to check. Please enter your inquiry reference and the email address you used, so I can make sure it's yours.`,
    form: { id: 'status', referenceId },
  });
};

// ------------------------------------------------------------------ buttons

async function handleAction(actionId, conversation, history) {
  const [kind, ...rest] = actionId.split(':');
  const value = rest.join(':');

  if (value) {
    const catalogue = await catalog.loadCatalogue();
    if (kind === 'category') return categoryReply(conversation, value, catalogue);
    // A suggested reply the visitor tapped reads exactly as if they typed it.
    if (kind === 'say') return respond({ text: value, conversation, history });
    if (kind === 'search') return respondToText(value, conversation);
    const medicine = await productBySlug(value, catalogue);
    if (!medicine) return reply({ text: `Sorry, I can't find that product any more.`, quickActions: kb.HOME_ACTIONS });
    if (kind === 'inquire') return quoteFormReply(conversation, medicine);
    if (kind === 'details') return detailsReply(conversation, medicine);
    if (kind === 'alternatives') return alternativesReply(conversation, medicine, catalogue);
    if (kind === 'price') return priceReply(conversation, medicine);
    if (kind === 'availability') return availabilityReply(conversation, medicine);
  }

  const catalogue = await catalog.loadCatalogue();
  const product = await currentProduct(conversation, [], catalogue);

  switch (actionId) {
    case 'find_medicine':
      remember(conversation, { offer: null });
      return reply({ text: `Sure! Which medicine are you looking for? You can type a brand or the active ingredient.`, awaiting: 'medicine_name' });
    case 'browse':
      return browseReply(conversation, catalogue);
    case 'check_inquiry':
      return statusReply(conversation);
    case 'how_it_works':
      return reply({ text: kb.INQUIRY_EXPLAINER, quickActions: [kb.QUICK_ACTIONS.find_medicine, kb.QUICK_ACTIONS.submit_inquiry] });
    case 'contact':
      return reply({ text: kb.contactAnswer(), quickActions: kb.SUPPORT_ONLY });
    case 'shipping':
      return reply({ text: `Happy to help with shipping and delivery. What would you like to know?`, quickActions: shippingChips() });
    case 'prescription':
      return prescriptionReply(conversation, conversation?.productContext?.slug ? product : null);
    case 'check_this_medicine':
      return prescriptionReply(conversation, product);
    case 'human':
      return handoffReply(conversation);
    case 'price':
      return product ? priceReply(conversation, product) : askWhichProduct(conversation, 'price', `Which medicine would you like the price for?`);
    case 'product_info':
      return product ? detailsReply(conversation, product) : askWhichProduct(conversation, 'details', `Which medicine would you like details on?`);
    case 'check_availability':
      return product ? availabilityReply(conversation, product) : askWhichProduct(conversation, 'availability', `Which medicine should I check?`);
    case 'submit_inquiry':
      return product ? quoteFormReply(conversation, product) : askWhichProduct(conversation, 'inquiry_medicine', `Which medicine would you like a quote for?`);
    case 'try_again':
      remember(conversation, { lastMedicineSlug: '', offer: null, misses: 0 });
      return greeting(conversation);
    default:
      if (kb.SHIPPING_ANSWERS[actionId]) {
        return reply({ text: kb.SHIPPING_ANSWERS[actionId], quickActions: [kb.QUICK_ACTIONS.submit_inquiry, kb.QUICK_ACTIONS.human] });
      }
      return greeting(conversation);
  }
}

// ------------------------------------------------------------------ text

const SMALL_TALK = new Set(['greeting', 'thanks', 'goodbye', 'affirm', 'deny']);

function acceptOffer(conversation, offer, catalogue) {
  if (offer.type === 'handoff') return handoffReply(conversation);
  if (offer.type === 'quote' && offer.slug) {
    const medicine = catalogue.find((item) => item.slug === offer.slug);
    if (medicine) return quoteFormReply(conversation, medicine, offer.quantity);
  }
  return null;
}

function shippingReply(conversation, intents, country, product) {
  remember(conversation, { offer: null, misses: 0 });
  const forProduct = product ? ` for ${name(product)}` : '';
  const actions = [
    product ? { id: `inquire:${product.slug}`, label: 'Get a Quote', icon: '📩' } : kb.QUICK_ACTIONS.submit_inquiry,
    kb.QUICK_ACTIONS.shipping,
  ];

  if (country?.known) {
    return reply({
      text: `Yes, we regularly supply buyers in ${country.label}. The shipping cost and estimated timeline${forProduct} are confirmed in your quote, before you commit to anything.`,
      quickActions: actions,
    });
  }
  if (country && !country.known) {
    return reply({
      text: `${country.label} isn't on our regular list (${kb.countriesSentence()}), but our team can check whether we can deliver there. Send a quote request with your location and they'll confirm.`,
      quickActions: actions,
    });
  }
  if (intents.has('ship_cost')) return reply({ text: kb.SHIPPING_ANSWERS.ship_cost, quickActions: actions });
  if (intents.has('ship_tracking')) return reply({ text: kb.SHIPPING_ANSWERS.ship_tracking, quickActions: [kb.QUICK_ACTIONS.check_inquiry, kb.QUICK_ACTIONS.human] });
  if (intents.has('ship_time')) return reply({ text: kb.SHIPPING_ANSWERS.ship_time, quickActions: actions });
  if (intents.has('ship_locations')) return reply({ text: kb.SHIPPING_ANSWERS.ship_locations, quickActions: actions });
  return reply({ text: `Here's what I can tell you about shipping and delivery. Pick a topic:`, quickActions: shippingChips() });
}

// The rule-based assistant for one typed message.
async function respondToText(message, conversation) {
  const state = stateOf(conversation);
  const seed = state.turns;
  const { intents, referenceId, country } = detect(message);

  const catalogue = await catalog.loadCatalogue();
  const search = await catalog.searchCatalogue(withoutQuantity(message), { catalogue });
  const mentioned = search.results;
  const questionIntents = [...intents].filter((id) => !SMALL_TALK.has(id));
  const substantive = questionIntents.length > 0 || mentioned.length > 0;
  const short = words(message).length <= 4;

  // A bare "yes" / "no" answers the question the assistant just asked.
  if (state.offer && short && !mentioned.length && intents.has('affirm')) {
    const accepted = acceptOffer(conversation, state.offer, catalogue);
    if (accepted) return accepted;
  }
  if (state.offer && short && intents.has('deny')) {
    remember(conversation, { offer: null, misses: 0 });
    return reply({ text: `No problem! Is there anything else I can help you with?`, quickActions: kb.FOLLOW_UP_ACTIONS });
  }

  if (intents.has('human')) return handoffReply(conversation);
  if (intents.has('check_inquiry') && !intents.has('submit_inquiry')) return statusReply(conversation, referenceId);

  if (intents.has('frustration')) {
    remember(conversation, { offer: { type: 'handoff', slug: '' }, misses: 0 });
    return reply({ text: kb.frustrationText(seed), quickActions: [kb.QUICK_ACTIONS.human, kb.QUICK_ACTIONS.try_again] });
  }
  if (intents.has('identity')) {
    remember(conversation, { offer: null, misses: 0 });
    return reply({ text: kb.identityText(), quickActions: [kb.QUICK_ACTIONS.find_medicine, kb.QUICK_ACTIONS.human] });
  }
  if (!substantive && intents.has('goodbye')) {
    remember(conversation, { offer: null, misses: 0 });
    return reply({ text: kb.goodbyeText(seed) });
  }
  if (!substantive && intents.has('thanks')) {
    remember(conversation, { offer: null, misses: 0 });
    return reply({ text: kb.thanksText(seed, visitorName(conversation)), quickActions: kb.FOLLOW_UP_ACTIONS });
  }
  if (!substantive && intents.has('greeting')) {
    remember(conversation, { offer: null, misses: 0 });
    return greeting(conversation);
  }

  const product = await currentProduct(conversation, mentioned, catalogue);
  // A topic answer: the miss streak ends, and a bare "yes" afterwards means
  // `offer` (or nothing).
  const answered = (response, offer = null) => {
    remember(conversation, { misses: 0, offer });
    return response;
  };

  if (intents.has('contact')) {
    remember(conversation, { offer: { type: 'handoff', slug: '' }, misses: 0 });
    return reply({ text: kb.contactAnswer(), quickActions: kb.SUPPORT_ONLY });
  }
  if (intents.has('payment')) {
    return answered(reply({ text: kb.PAYMENT_ANSWER, quickActions: [kb.QUICK_ACTIONS.submit_inquiry, kb.QUICK_ACTIONS.how_it_works] }));
  }
  if (intents.has('bulk')) {
    if (product) remember(conversation, { lastMedicineSlug: product.slug });
    return answered(
      reply({
        text: kb.BULK_ANSWER,
        quickActions: [product ? { id: `inquire:${product.slug}`, label: `Quote for ${name(product)}`, icon: '📩' } : kb.QUICK_ACTIONS.submit_inquiry, kb.QUICK_ACTIONS.human],
      }),
      product ? { type: 'quote', slug: product.slug } : null
    );
  }
  if (intents.has('returns')) {
    remember(conversation, { offer: { type: 'handoff', slug: '' }, misses: 0 });
    return reply({ text: `${kb.RETURNS_ANSWER}\n\nWould you like me to connect you with them now?`, quickActions: [kb.QUICK_ACTIONS.human, kb.QUICK_ACTIONS.check_inquiry] });
  }

  const shippingAsked =
    intents.has('ship_cost') || intents.has('ship_tracking') || intents.has('ship_locations') || intents.has('shipping') ||
    (intents.has('ship_time') && !intents.has('product_info'));
  if (shippingAsked || (country && !mentioned.length && !intents.has('price'))) {
    return shippingReply(conversation, intents, country, mentioned.length === 1 ? mentioned[0].medicine : null);
  }

  if (intents.has('trust')) return answered(reply({ text: kb.TRUST_ANSWER, quickActions: [{ id: 'link', label: 'Read reviews', icon: '⭐', href: '/reviews' }, kb.QUICK_ACTIONS.find_medicine] }));
  if (intents.has('about')) return answered(reply({ text: kb.ABOUT_ANSWER, quickActions: kb.HOME_ACTIONS }));
  if (intents.has('how_it_works') && !mentioned.length) {
    return answered(reply({ text: kb.INQUIRY_EXPLAINER, quickActions: [kb.QUICK_ACTIONS.find_medicine, kb.QUICK_ACTIONS.submit_inquiry] }));
  }
  if (intents.has('browse') && !mentioned.length) return browseReply(conversation, catalogue);
  if (intents.has('prescription')) return prescriptionReply(conversation, product);

  if (intents.has('alternatives')) {
    if (product) return alternativesReply(conversation, product, catalogue);
    return askWhichProduct(conversation, 'alternatives', `Which medicine would you like alternatives for?`);
  }

  if (intents.has('discount')) {
    if (product) remember(conversation, { lastMedicineSlug: product.slug });
    return answered(
      reply({
        text: kb.DISCOUNT_ANSWER,
        quickActions: [product ? { id: `inquire:${product.slug}`, label: `Quote for ${name(product)}`, icon: '📩' } : kb.QUICK_ACTIONS.submit_inquiry],
      }),
      product ? { type: 'quote', slug: product.slug } : null
    );
  }

  // "I want 3 bottles" / "need 50 strips" about the product in context (or the
  // one named) is an order: open the quote form with that quantity.
  const quantity = quantityIn(message);
  if (quantity > 0 && !intents.has('price') && !intents.has('availability') && !intents.has('product_info')) {
    const target = mentioned.length === 1 ? mentioned[0].medicine : !mentioned.length ? product : null;
    if (target && (intents.has('find') || intents.has('submit_inquiry') || short)) {
      return quoteFormReply(conversation, target, quantity, packIn(message));
    }
  }

  // Product questions: answer about the named product, or the one in context.
  const productQuestion = [
    ['submit_inquiry', 'quote', 'inquiry_medicine', `Which medicine would you like a quote for?`],
    ['price', 'price', 'price', `Which medicine would you like the price for?`],
    ['availability', 'availability', 'availability', `Which medicine should I check?`],
    ['product_info', 'details', 'details', `Which medicine would you like details on?`],
  ].find(([intent]) => intents.has(intent));

  if (productQuestion) {
    const [, purpose, awaiting, question] = productQuestion;
    if (mentioned.length) return searchReply(conversation, message, search, catalogue, { purpose });
    if (product) {
      if (purpose === 'quote') return quoteFormReply(conversation, product, quantityIn(message), packIn(message));
      if (purpose === 'price') return priceReply(conversation, product, message);
      if (purpose === 'availability') return availabilityReply(conversation, product);
      return detailsReply(conversation, product);
    }
    if (purpose === 'quote' && intents.has('how_it_works')) {
      return answered(reply({ text: kb.INQUIRY_EXPLAINER, quickActions: [kb.QUICK_ACTIONS.find_medicine] }));
    }
    // Several products were just listed: let the visitor pick one.
    const options = (await Promise.all(state.options.map((slug) => productBySlug(slug, catalogue)))).filter(Boolean);
    if (options.length) {
      const action = { quote: 'inquire', price: 'price', availability: 'availability', details: 'details' }[purpose];
      remember(conversation, { offer: null });
      return reply({
        text: `Sure, which one?`,
        quickActions: options.map((medicine) => ({ id: `${action}:${medicine.slug}`, label: name(medicine), icon: '💊' })),
      });
    }
    const category = await catalog.matchCategory(message, { catalogue });
    if (category) return categoryReply(conversation, category, catalogue);
    return askWhichProduct(conversation, awaiting, question);
  }

  if (mentioned.length) return searchReply(conversation, message, search, catalogue);

  // "yes" / "no" with nothing pending.
  if (short && intents.has('affirm')) {
    remember(conversation, { misses: 0 });
    return reply({ text: `Great! What would you like to do next?`, quickActions: contextActions(conversation) });
  }
  if (short && intents.has('deny')) {
    remember(conversation, { misses: 0, offer: null });
    return reply({ text: `No problem! Is there anything else I can help you with?`, quickActions: kb.FOLLOW_UP_ACTIONS });
  }

  const category = await catalog.matchCategory(message, { catalogue });
  if (category) return categoryReply(conversation, category, catalogue);

  // The assistant asked "which medicine?" and this is the answer.
  const awaiting = conversation?.awaiting || '';
  if (awaiting && !questionIntents.length) {
    const purpose = { inquiry_medicine: 'quote', price: 'price', availability: 'availability', details: 'details' }[awaiting] || 'find';
    if (awaiting === 'alternatives') {
      if (search.results.length === 1) return alternativesReply(conversation, search.results[0].medicine, catalogue);
    }
    return searchReply(conversation, message, search, catalogue, { purpose });
  }

  if (intents.has('find') || looksLikeMedicineName(message)) {
    return searchReply(conversation, message, search, catalogue);
  }

  // Nothing matched. After two misses in a row, offer a person instead of
  // asking the visitor to rephrase yet again.
  const misses = state.misses + 1;
  if (misses >= 2) {
    remember(conversation, { misses: 0, offer: { type: 'handoff', slug: '' } });
    return reply({ text: kb.stillStuckText(), quickActions: [kb.QUICK_ACTIONS.human, kb.QUICK_ACTIONS.find_medicine] });
  }
  remember(conversation, { misses, offer: null });
  return reply({ text: kb.fallbackText(seed), quickActions: contextActions(conversation) });
}

// ------------------------------------------------------------------ entry

export async function respond({ text = '', actionId = '', conversation, history = [] }) {
  if (actionId) return handleAction(actionId, conversation, history);

  const message = String(text || '').trim();
  if (!message) return greeting(conversation);

  const state = stateOf(conversation);
  remember(conversation, { turns: state.turns + 1 });

  if (needsMedicalRefusal(message)) {
    remember(conversation, { offer: null });
    return reply({ text: kb.medicalRefusal(state.turns), quickActions: [kb.QUICK_ACTIONS.find_medicine, kb.QUICK_ACTIONS.human] });
  }

  if (detect(message).intents.has('restart')) {
    remember(conversation, { lastMedicineSlug: '', offer: null, misses: 0, options: [] });
    return reply({ text: kb.restartText(state.turns), quickActions: contextActions(conversation) });
  }

  if (aiEnabled()) {
    const answer = await aiRespond({ message, conversation, history });
    if (answer) {
      remember(conversation, { misses: 0, offer: null, ...(answer.lastMedicineSlug ? { lastMedicineSlug: answer.lastMedicineSlug } : {}) });
      return reply(answer);
    }
  }

  return respondToText(message, conversation);
}

export const STATUS_LABELS = {
  new: 'Received, being reviewed by our team',
  contacted: 'Our team has been in touch with you',
  closed: 'Closed',
};

export function inquiryConfirmationText(referenceId) {
  const base = `✅ Your quote request is in! Our team will get back to you with availability, pricing and delivery details.`;
  return referenceId ? `${base}\n\nYour reference: ${referenceId}. Keep it handy if you'd like to check on it later.` : base;
}

export { BRAND, INQUIRY_EXPLAINER } from './knowledgeBase.js';
