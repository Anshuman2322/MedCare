import { BUSINESS } from '../../config/business.js';
import { vary, firstName, listToSentence } from './text.js';

// Everything the assistant says about the business. Each answer restates what
// the public site already says (Shipping Policy, Terms, About, Contact). Nothing
// here may promise a delivery time, a shipping charge, a stock level, a payment
// method or a prescription rule: those are per-order facts the team confirms.
// Most answers come in a few phrasings so the assistant doesn't sound canned.

export const BRAND = BUSINESS.name;

// Same details as the website's Contact page (client/src/config/contact.js).
// No business hours here: none have been confirmed, so none are promised.
export const SUPPORT_CONTACT = {
  email: BUSINESS.email,
  phone: BUSINESS.phone,
};

export const QUICK_ACTIONS = {
  find_medicine: { id: 'find_medicine', label: 'Find a Medicine', icon: '💊' },
  browse: { id: 'browse', label: 'Browse Categories', icon: '🗂️' },
  submit_inquiry: { id: 'submit_inquiry', label: 'Get a Quote', icon: '📩' },
  check_inquiry: { id: 'check_inquiry', label: 'Check My Inquiry', icon: '📦' },
  how_it_works: { id: 'how_it_works', label: 'How Ordering Works', icon: '🧭' },
  shipping: { id: 'shipping', label: 'Shipping & Delivery', icon: '🚚' },
  prescription: { id: 'prescription', label: 'Prescription Help', icon: '📋' },
  human: { id: 'human', label: 'Talk to Our Team', icon: '👩‍💼' },
  product_info: { id: 'product_info', label: 'Product Details', icon: 'ℹ️' },
  check_availability: { id: 'check_availability', label: 'Check Availability', icon: '✅' },
  price: { id: 'price', label: 'Price', icon: '💲' },
  contact: { id: 'contact', label: 'Contact Details', icon: '☎️' },
  try_again: { id: 'try_again', label: 'Start Over', icon: '🔄' },
};

const pick = (...ids) => ids.map((id) => QUICK_ACTIONS[id]).filter(Boolean);

export const HOME_ACTIONS = pick('find_medicine', 'browse', 'submit_inquiry', 'check_inquiry', 'shipping', 'human');
export const PRODUCT_ACTIONS = pick('price', 'product_info', 'check_availability', 'submit_inquiry', 'prescription', 'human');
export const FOLLOW_UP_ACTIONS = pick('find_medicine', 'submit_inquiry', 'human');
export const SUPPORT_ONLY = pick('human');

// Chips that act on one product.
export const productActions = (medicine, ...extra) => [
  { id: `inquire:${medicine.slug}`, label: 'Get a Quote', icon: '📩' },
  { id: `details:${medicine.slug}`, label: 'Details', icon: 'ℹ️' },
  ...extra,
];

export const SHIPPING_TOPICS = [
  { id: 'ship_locations', label: 'Do you ship to my country?' },
  { id: 'ship_time', label: 'How long does delivery take?' },
  { id: 'ship_cost', label: 'What are the shipping charges?' },
  { id: 'ship_tracking', label: 'Can I track my shipment?' },
  { id: 'ship_change', label: 'Can I change delivery details?' },
  { id: 'ship_policy', label: 'Shipping Policy' },
];

export const countriesSentence = () => listToSentence(BUSINESS.countries);

export const SHIPPING_ANSWERS = {
  ship_locations: `We regularly supply buyers in ${countriesSentence()}. For anywhere else, send an inquiry with your delivery location and our team will confirm whether we can deliver there before anything is finalised.`,
  ship_time: `Delivery time depends on the product, the quantity and where it's going, so our team confirms an estimated timeline in your quote. Prescription-required items can take a little longer because of verification. I'd rather not guess a date for you.`,
  ship_cost: `Shipping charges depend on the item, the quantity and the destination. Our team includes them in your quote, so you see the full cost before you confirm anything.`,
  ship_tracking: `Yes, when tracking is available for your shipment, our team shares the tracking details with you as soon as it ships.`,
  ship_change: `No problem. Delivery details can be updated while your inquiry is being processed. Share your inquiry reference and the change with our team and they'll take care of it.`,
  ship_policy: `Our Shipping Policy covers how delivery works, processing time, costs, tracking and delays. You can read it here: /shipping-policy`,
};

export const PRESCRIPTION_ANSWER = `Some medicines need a valid prescription. Each product page shows whether it's required, and our team confirms any verification steps for your country while preparing your quote.

I can't advise on whether a medicine is right for you or how much to take. For that, please speak to a doctor or pharmacist.`;

export const MEDICAL_ADVICE_REFUSAL = `I'm sorry, I can't give medical advice, a diagnosis or dosage guidance. Please check with a doctor or pharmacist, they're the right people for that.\n\nIf you already know the medicine you need, tell me its name and I'll show you what we have.`;

export const medicalRefusal = (seed) =>
  vary(
    [
      MEDICAL_ADVICE_REFUSAL,
      `That's a question for a doctor or pharmacist, so I won't guess: I'm not able to give medical or dosage advice.\n\nIf you have a prescription or know the medicine's name, share it and I'll check availability and price for you.`,
      `I'd love to help, but I can't advise on treatment or doses. A doctor or pharmacist can guide you safely.\n\nOnce you know which medicine you need, just type its name and I'll find it in our catalogue.`,
    ],
    seed
  );

export const INQUIRY_EXPLAINER = `${BRAND} works on quotes rather than instant checkout:\n\n1. Tell us the medicine and quantity (a quote request takes about a minute).\n2. Our team checks availability and sends you a quote with pricing, shipping and an estimated timeline.\n3. You confirm the quote. Nothing is final until you do.`;

export const PAYMENT_ANSWER = `Payment options depend on your country and order, so our team shares the available methods together with your quote. You only pay after you've seen and confirmed the full quote.`;

export const BULK_ANSWER = `Yes, we handle bulk and wholesale orders. There's no fixed minimum listed on the site: just tell us the quantity you need in a quote request, and for larger volumes our team will come back with their best price.`;

export const TRUST_ANSWER = `Good question to ask. ${BRAND} is an IndiaMART TrustSEAL verified supplier, which means our ${listToSentence(BUSINESS.verified)} have been checked. Every product page lists the manufacturer, and you can read what other buyers say at /reviews. More about us: /about`;

export const ABOUT_ANSWER = `${BRAND} is an India-based supplier of branded generic medicines from established Indian manufacturers. We work with buyers in ${countriesSentence()}, on a simple quote-first basis. You can read more at /about`;

export const RETURNS_ANSWER = `I'm sorry to hear something's not right. Our team handles issues like damaged, missing or wrong items case by case. Share your inquiry reference with them and they'll sort it out with you directly.`;

export const DISCOUNT_ANSWER = `Prices on the site are our listed prices. For larger quantities, our team can usually do better: send a quote request with the quantity you need and ask for our best price.`;

export function contactAnswer() {
  return `You can reach our team at:\n\n📧 ${SUPPORT_CONTACT.email}\n📞 ${SUPPORT_CONTACT.phone}\n\nOr leave your details here and someone will get back to you by email.`;
}

export function welcomeText(seed = 0, name = '') {
  const hello = name ? `Hi ${firstName(name)}, welcome back!` : `Hi there! 👋 Welcome to ${BRAND}.`;
  return `${hello}\n\n${vary(
    [
      `I can help you find a medicine, check prices, get a quote or answer questions about shipping. What are you looking for today?`,
      `Looking for a particular medicine, or have a question about ordering or delivery? Just ask, I'm here to help.`,
    ],
    seed
  )}`;
}

export function productWelcomeText(productName) {
  return `Hi! 👋 I see you're looking at ${productName}.\n\nI can tell you its price, details or availability, or help you get a quote. What would you like to know?`;
}

export const restartText = (seed) =>
  vary(
    [
      `Sure, let's start fresh! What can I help you with?`,
      `Fresh start it is. 🙂 What are you looking for?`,
      `Of course. Let's begin again: what would you like to do?`,
    ],
    seed
  );

export const thanksText = (seed, name) =>
  vary(
    [
      `You're welcome${name ? `, ${firstName(name)}` : ''}! Is there anything else I can help you with?`,
      `Happy to help! Let me know if you need anything else.`,
      `Anytime! 😊 Anything else you'd like to check?`,
    ],
    seed
  );

export const goodbyeText = (seed) =>
  vary(
    [
      `Thanks for chatting with ${BRAND}! If anything comes up later, I'm right here. Take care. 👋`,
      `Glad I could help. Have a great day, and feel free to come back anytime! 👋`,
    ],
    seed
  );

export const identityText = () =>
  `I'm ${BRAND}'s virtual assistant. I can look up medicines, prices and availability, explain how ordering and delivery work, and start a quote for you.\n\nIf you'd rather talk to a person, just say so and I'll connect you with our team.`;

export const frustrationText = (seed) =>
  vary(
    [
      `I'm sorry, I didn't get that right. Would you like me to connect you with someone from our team? They can help you directly.`,
      `Sorry about that, I'm not quite understanding. Our team can help you properly: would you like me to put you in touch?`,
    ],
    seed
  );

export function humanSupportIntro() {
  return `Of course! Leave your details below and our team will get back to you by email as soon as they can.`;
}

export function handoffConfirmation() {
  return `✅ Thanks! Our team has your details and will get back to you by email.\n\nYou can keep typing here and your messages will reach them. You can also email ${SUPPORT_CONTACT.email} or call ${SUPPORT_CONTACT.phone}.`;
}

// ------------------------------------------------------------------ live chat

export const DEFAULT_AGENT_NAME = `${BRAND} Support`;

// Sent as soon as a visitor asks for the team. The wait and the online/away
// state come from the live-chat settings the team controls in the admin panel.
export function liveChatWaitingText({ name, email, available = true, waitText = '5–10 minutes' } = {}) {
  const hi = firstName(name) ? `Thanks, ${firstName(name)}!` : 'Thanks!';
  if (!available) {
    return `✅ ${hi} Your message is with our team.\n\nOur experts are away right now. They'll reply right here as soon as they're back, and if you've left the site by then, we'll email you their reply${email ? ` at ${email}` : ''}. Feel free to keep browsing: we'll notify you on this site when they reply.`;
  }
  return `✅ ${hi} You're now in line for a live chat with our team.\n\n⏳ Please stay on this page: one of our experts will join this chat within ${waitText}. Don't close the chat. Their reply will appear right here, and we'll notify you even if you browse other pages.\n\nIf you do need to leave, no problem: we'll email you our reply${email ? ` at ${email}` : ''}.`;
}

// Sent once if the visitor has waited a while and no one has replied yet.
export function liveChatStillWaitingText({ name, email } = {}) {
  const hi = firstName(name) ? `Thanks for your patience, ${firstName(name)}.` : 'Thanks for your patience.';
  return `${hi} Our team is a little busy right now, but your chat is in the queue and an expert will be with you shortly. Please keep this chat open.${email ? `\n\nIf you need to go, you'll still get our reply by email at ${email}.` : ''}`;
}

export function fallbackText(seed = 0) {
  return vary(
    [
      `Sorry, I'm not sure I understood that. You can type a medicine name (like "Cenforce 100"), or ask me about prices, shipping or how ordering works.`,
      `Hmm, I didn't quite catch that. Could you rephrase it? For example: "price of Tadalista 20", "do you ship to Canada?" or "how do I order?".`,
      `I want to make sure I help with the right thing. Are you looking for a medicine, a quote, or information about delivery?`,
    ],
    seed
  );
}

export const stillStuckText = () =>
  `I don't want to keep you going in circles. Would you like to talk to someone from our team? They can answer anything I can't.`;

// The business facts the AI assistant may state, kept next to the copy above
// so both always agree.
export function businessFacts() {
  return [
    `Business: ${BRAND}, an India-based supplier of branded generic medicines from established Indian manufacturers.`,
    `How ordering works: no instant checkout. The customer sends a quote request (inquiry) for a medicine and quantity; the team replies with a quote covering price, shipping and an estimated timeline; the customer confirms the quote before anything is final.`,
    `Prices: the catalogue lists prices in US dollars per pack (e.g. per strip or per bottle). The final price is confirmed in the quote. Larger quantities can get a better price ("best price" request). There is no fixed minimum order on the site.`,
    `Shipping: buyers are regularly supplied in ${countriesSentence()}. Other destinations are confirmed per inquiry. Delivery time and shipping charges depend on product, quantity and destination and are given in the quote. Tracking details are shared when available. Shipping policy page: /shipping-policy.`,
    `Payment: methods depend on the country and order; the team shares them with the quote. The customer pays only after confirming the quote.`,
    `Prescriptions: some medicines need a valid prescription; each product page says whether it does; the team confirms verification steps for the customer's country.`,
    `Trust: IndiaMART TrustSEAL verified supplier (${listToSentence(BUSINESS.verified)} verified). Customer reviews: /reviews. About page: /about.`,
    `Contact: email ${SUPPORT_CONTACT.email}, phone ${SUPPORT_CONTACT.phone}. No business hours are published, so never promise response times.`,
    `Inquiry status: customers can check it in this chat with their reference (like CN-2026-0018 or BP-2026-0003) and the email they used.`,
    `Problems with an order (damaged, missing, wrong item, refunds, cancellations): handled by the team case by case; there is no published refund policy.`,
  ].join('\n');
}
