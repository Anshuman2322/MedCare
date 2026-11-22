// The single knowledge base behind both the /faq page and the support chat.
// Every answer restates what the public site already says (Shipping Policy,
// Terms, Privacy, About, Contact). Nothing here may promise a price, delivery
// date, shipping charge, stock level, payment method, refund or prescription
// rule: those are per-order facts the team confirms in the quote. When the
// site has no published policy, the answer says so and points to the team.
//
// Fields: id, category, question, answer, alternatives (other ways to ask it),
// keywords, priority (1-10, higher shows first / wins ties), published,
// related (ids), links ({ label, to }), escalate (also offer a person).
import { BUSINESS } from '../config/business.js';

const COUNTRIES = `${BUSINESS.countries.slice(0, -1).join(', ')} and ${BUSINESS.countries.at(-1)}`;
const VERIFIED = BUSINESS.verified.join(', ');

export const FAQ_FALLBACK =
  "I don't have verified information about that yet. Please contact our support team, and they will be able to assist you.";

export const EMERGENCY_ANSWER =
  "If this is a medical emergency, please contact your local emergency services or go to the nearest hospital right away. I can't give medical advice, and we aren't an emergency service.";

export const FAQ_CATEGORIES = [
  { id: 'about', label: 'About CureNeed', icon: '🏢' },
  { id: 'products', label: 'Products', icon: '💊' },
  { id: 'ordering', label: 'Ordering & Quotes', icon: '🧭' },
  { id: 'pricing', label: 'Pricing', icon: '💲' },
  { id: 'bulk', label: 'Bulk & Wholesale', icon: '📦' },
  { id: 'prescription', label: 'Prescriptions', icon: '📋' },
  { id: 'quality', label: 'Quality & Authenticity', icon: '✅' },
  { id: 'shipping', label: 'Shipping & Delivery', icon: '🚚' },
  { id: 'international', label: 'International Orders', icon: '🌍' },
  { id: 'tracking', label: 'Tracking', icon: '📍' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'inquiries', label: 'Inquiry Status', icon: '🔎' },
  { id: 'returns', label: 'Returns & Problems', icon: '↩️' },
  { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
  { id: 'support', label: 'Contact & Support', icon: '☎️' },
  { id: 'safety', label: 'Medical Safety', icon: '🩺' },
  { id: 'reviews', label: 'Reviews & Trust', icon: '⭐' },
  { id: 'chat', label: 'Chat Assistant', icon: '🤖' },
  { id: 'website', label: 'Using the Website', icon: '🖥️' },
  { id: 'accounts', label: 'Accounts & Updates', icon: '👤' },
];

const entry = (id, category, question, answer, extra = {}) => ({
  id,
  category,
  question,
  answer,
  alternatives: extra.alt || [],
  keywords: extra.kw || [],
  priority: extra.p ?? 5,
  published: extra.published !== false,
  related: extra.related || [],
  links: extra.links || [],
  escalate: Boolean(extra.escalate),
});

const SHIP = { label: 'Shipping Policy', to: '/shipping-policy' };
const CONTACT = { label: 'Contact us', to: '/contact' };
const SHOP = { label: 'Browse medicines', to: '/shop' };

export const FAQ_ENTRIES = [
  // ---------------------------------------------------------------- about
  entry('what-is-cureneed', 'about', 'What is CureNeed?',
    `CureNeed is an India-based supplier of branded generic medicines from established Indian manufacturers. We work with buyers in ${COUNTRIES}, on a simple quote-first basis.`,
    { alt: ['who are you', 'tell me about your company', 'about cureneed', 'what do you do', 'kya hai cureneed'], kw: ['company', 'about', 'supplier', 'business', 'cureneed'], p: 9, related: ['is-cureneed-verified', 'how-to-order'], links: [{ label: 'About us', to: '/about' }] }),
  entry('where-based', 'about', 'Where is CureNeed based?',
    `CureNeed is based in India. Our business address is verified by IndiaMART TrustSEAL. You can see our contact details on the Contact page.`,
    { alt: ['where are you located', 'your address', 'which country is the company in', 'office location'], kw: ['located', 'location', 'address', 'india', 'based', 'office'], p: 6, links: [CONTACT] }),
  entry('is-cureneed-verified', 'about', 'Is CureNeed a verified supplier?',
    `Yes. CureNeed is an IndiaMART TrustSEAL verified supplier: our ${VERIFIED} have been verified. You can also read what other buyers say on the Reviews page.`,
    { alt: ['is cureneed legit', 'is this website genuine', 'can i trust you', 'is it safe to buy from you', 'are you real', 'fake or real'], kw: ['verified', 'legit', 'genuine', 'trust', 'trustseal', 'indiamart', 'safe', 'scam', 'real', 'fake'], p: 9, related: ['are-reviews-real', 'are-medicines-genuine'], links: [{ label: 'Reviews', to: '/reviews' }, { label: 'About us', to: '/about' }] }),
  entry('what-we-sell', 'about', 'What kind of medicines do you supply?',
    `We supply branded generic medicines made by established Indian manufacturers. Browse the catalogue by category, or search for a medicine by name.`,
    { alt: ['what do you sell', 'which products do you have', 'what medicines are available', 'product range', 'catalogue'], kw: ['sell', 'supply', 'range', 'catalogue', 'catalog', 'generic', 'branded', 'categories'], p: 7, links: [SHOP] }),

  // ------------------------------------------------------------- products
  entry('find-medicine', 'products', 'How do I find a specific medicine?',
    `Use the search box on the website, or open the Shop page and pick a category. Each product page shows its strength, forms, pack sizes and manufacturer. In this chat you can also type the medicine name and I'll look it up.`,
    { alt: ['how to search for a medicine', 'search product', 'i cant find my medicine', 'where is my medicine', 'look up a medicine'], kw: ['find', 'search', 'look', 'medicine', 'product', 'name'], p: 7, links: [SHOP] }),
  entry('medicine-not-listed', 'products', 'What if the medicine I need is not listed?',
    `Send us a message with the medicine name, strength and quantity. Our team will tell you whether they can source it. I can't promise a medicine that isn't in the catalogue.`,
    { alt: ['you dont have my medicine', 'not in your list', 'can you arrange a medicine not on the site', 'medicine not available on website'], kw: ['listed', 'missing', 'source', 'arrange', 'request'], p: 6, escalate: true, links: [CONTACT] }),
  entry('product-details', 'products', "Where can I see a medicine's details?",
    `Open the medicine's page. It lists the strength, form, pack size, manufacturer and whether a prescription is required. For anything else, ask our team.`,
    { alt: ['medicine information', 'composition', 'what is in this medicine', 'manufacturer details', 'product description'], kw: ['details', 'information', 'composition', 'manufacturer', 'strength', 'pack', 'form'], p: 6 }),
  entry('stock-availability', 'products', 'Is a medicine in stock?',
    `Availability can change, so I can't promise stock in chat. Send a quote request and our team will confirm availability for your quantity.`,
    { alt: ['is this available', 'do you have stock', 'out of stock', 'in stock', 'availability check', 'milega kya'], kw: ['stock', 'available', 'availability', 'instock', 'milega'], p: 8, related: ['how-to-order'] }),
  entry('product-images', 'products', 'Are product pictures exactly what I will receive?',
    `Product images are for identification. Packaging can differ by batch or manufacturer, so please confirm specifics with our team if it matters to you.`,
    { alt: ['photo of medicine', 'will packaging look the same', 'image different from product'], kw: ['image', 'photo', 'picture', 'packaging', 'look'], p: 3 }),

  // ------------------------------------------------------------- ordering
  entry('how-to-order', 'ordering', 'How do I place an order?',
    `CureNeed works on quotes rather than instant checkout:\n1. Tell us the medicine and quantity (a quote request takes about a minute).\n2. Our team checks availability and sends you a quote with pricing, shipping and an estimated timeline.\n3. You confirm the quote. Nothing is final until you do.`,
    { alt: ['how to buy', 'how does ordering work', 'how can i purchase', 'order process', 'kaise order kare', 'place order'], kw: ['order', 'buy', 'purchase', 'process', 'checkout', 'how'], p: 10, related: ['what-is-a-quote', 'payment-methods'], links: [SHOP] }),
  entry('what-is-a-quote', 'ordering', 'What is a quote request (inquiry)?',
    `A quote request (also called an inquiry) tells our team which medicine and how much you need. They reply with availability, price, shipping and an estimated timeline. Sending one is free and doesn't commit you to buy.`,
    { alt: ['what is an inquiry', 'what is enquiry', 'what happens after i send an inquiry', 'what is get a quote', 'do i have to pay to inquire'], kw: ['quote', 'inquiry', 'enquiry', 'request', 'quotation'], p: 9, related: ['how-to-order', 'track-inquiry'] }),
  entry('is-there-cart-checkout', 'ordering', 'Can I pay online at checkout?',
    `There is no instant online checkout. You send a quote request, our team replies with a quote, and payment details are shared with it. You only pay after you have seen and confirmed the quote.`,
    { alt: ['add to cart and pay', 'buy now button', 'online payment on website', 'is there a checkout'], kw: ['checkout', 'cart', 'online', 'pay', 'buy now'], p: 6, related: ['payment-methods'] }),
  entry('change-order', 'ordering', 'Can I change or cancel my request?',
    `Yes, while your inquiry is being processed. Contact our team with your reference number and the change you need. Nothing is final until you confirm the quote.`,
    { alt: ['cancel my inquiry', 'modify my order', 'edit my request', 'change quantity after sending', 'cancel order'], kw: ['change', 'cancel', 'modify', 'edit', 'update', 'cancellation'], p: 8, escalate: true, links: [CONTACT] }),
  entry('multiple-medicines', 'ordering', 'Can I order several medicines together?',
    `Yes. Add more than one medicine to your request, or mention them all in your message, and the team will quote them together.`,
    { alt: ['more than one product', 'multiple items in one order', 'combine medicines in one shipment'], kw: ['multiple', 'several', 'together', 'combine', 'many', 'items'], p: 4 }),
  entry('what-info-needed', 'ordering', 'What information do I need to send a quote request?',
    `The medicine, the quantity, your name, your location and a way to reach you (email or phone). The more complete it is, the faster the team can reply.`,
    { alt: ['what details are required for inquiry', 'what do i fill in the form', 'required fields'], kw: ['information', 'details', 'required', 'form', 'fill', 'need'], p: 5 }),

  // -------------------------------------------------------------- pricing
  entry('prices-currency', 'pricing', 'What currency are the prices in?',
    `Catalogue prices are shown in US dollars per pack (for example per strip or bottle). The final price is confirmed in your quote.`,
    { alt: ['price in dollars', 'is price in rupees', 'which currency', 'usd or inr'], kw: ['currency', 'dollar', 'usd', 'rupee', 'inr', 'price'], p: 7 }),
  entry('final-price', 'pricing', 'Is the listed price the final price?',
    `The listed price is our catalogue price per pack. Shipping and the final total are confirmed in your quote, so you see the full cost before you confirm anything.`,
    { alt: ['are there hidden charges', 'extra cost', 'total price', 'what will i pay in the end', 'price includes shipping'], kw: ['final', 'hidden', 'extra', 'total', 'charges', 'includes', 'fees'], p: 8, related: ['shipping-cost'] }),
  entry('price-list', 'pricing', 'How do I find the price of a medicine?',
    `Open the medicine's page to see its listed price per pack. In this chat you can ask, for example, "price of Cenforce 100".`,
    { alt: ['price of medicine', 'how much does it cost', 'rate kya hai', 'cost of tablets', 'what is the price'], kw: ['price', 'cost', 'rate', 'much', 'kitna', 'pricing'], p: 8 }),
  entry('discounts', 'pricing', 'Do you offer discounts?',
    `Listed prices are our catalogue prices. For larger quantities our team can usually do better: send a quote request with the quantity you need and ask for their best price. I can't promise a specific discount.`,
    { alt: ['any offers', 'coupon code', 'cheaper price', 'best price', 'negotiate price', 'discount on bulk'], kw: ['discount', 'offer', 'coupon', 'cheaper', 'deal', 'negotiate', 'best'], p: 8, related: ['bulk-orders'] }),
  entry('price-changes', 'pricing', 'Can prices change?',
    `Prices can be updated, so the quote you receive is the price that counts. Ask our team how long a quote stays valid.`,
    { alt: ['will the price go up', 'is the price fixed', 'quote validity'], kw: ['change', 'fixed', 'valid', 'validity', 'increase'], p: 3 }),

  // ----------------------------------------------------------------- bulk
  entry('bulk-orders', 'bulk', 'Do you accept bulk or wholesale orders?',
    `Yes. There is no fixed minimum listed on the site. Tell us the quantity you need in a quote request and, for larger volumes, our team will come back with their best price.`,
    { alt: ['wholesale', 'large quantity', 'minimum order quantity', 'moq', 'bulk purchase', 'buy in bulk', 'distributor'], kw: ['bulk', 'wholesale', 'minimum', 'moq', 'large', 'quantity', 'distributor', 'volume'], p: 9, related: ['discounts'] }),
  entry('reseller', 'bulk', 'Can I buy to resell?',
    `Please send a quote request or message with your requirement and your country. Whether a sale is possible depends on the medicine and the destination's rules, and our team will confirm.`,
    { alt: ['reseller', 'pharmacy supply', 'business customer', 'b2b'], kw: ['resell', 'reseller', 'pharmacy', 'business', 'b2b', 'retailer'], p: 4, escalate: true }),

  // -------------------------------------------------------- prescription
  entry('prescription-needed', 'prescription', 'Do I need a prescription?',
    `Some medicines need a valid prescription. Each product page shows whether it is required, and our team confirms any verification steps for your country while preparing your quote. We do not bypass prescription requirements.`,
    { alt: ['is prescription required', 'can i buy without prescription', 'without doctor note', 'rx needed', 'prescription ke bina'], kw: ['prescription', 'rx', 'doctor', 'required', 'without'], p: 10, related: ['upload-prescription', 'medical-advice'] }),
  entry('upload-prescription', 'prescription', 'How do I share my prescription?',
    `When our team asks for verification, they will tell you how to send it. Please don't post prescriptions or health details in public places; share them only with our team through the contact details on our Contact page.`,
    { alt: ['upload prescription', 'send prescription', 'where to submit prescription', 'prescription verification'], kw: ['upload', 'send', 'submit', 'verification', 'verify'], p: 6, escalate: true, links: [CONTACT] }),
  entry('medical-advice', 'prescription', 'Can you recommend a medicine or dose?',
    `No. We're a medicine supplier, not a medical service, so I can't diagnose, recommend a medicine or advise on doses. Please ask a doctor or pharmacist. Once you know the medicine you need, I'll gladly help you find it.`,
    { alt: ['which medicine should i take', 'suggest a tablet', 'how much should i take', 'dosage advice', 'is it safe for me'], kw: ['recommend', 'suggest', 'dose', 'dosage', 'advice', 'diagnose'], p: 9 }),

  // -------------------------------------------------------------- quality
  entry('are-medicines-genuine', 'quality', 'Are your medicines genuine?',
    `We supply branded generic medicines from established Indian manufacturers, and every product page lists the manufacturer. We're an IndiaMART TrustSEAL verified supplier. For batch or authenticity questions about a specific product, contact our team.`,
    { alt: ['are they original', 'are medicines authentic', 'quality of medicines', 'are they fake', 'duplicate medicines', 'is it original'], kw: ['genuine', 'original', 'authentic', 'quality', 'fake', 'duplicate', 'counterfeit'], p: 9, related: ['is-cureneed-verified'] }),
  entry('expiry', 'quality', 'What about expiry dates?',
    `I can't state expiry dates in chat because they depend on the batch. Ask our team about a specific product and quantity, and please check the expiry date on the pack when you receive it.`,
    { alt: ['expiry date', 'shelf life', 'how long before it expires', 'expired medicine'], kw: ['expiry', 'expire', 'expired', 'shelf', 'date', 'batch'], p: 6, escalate: true }),
  entry('storage', 'quality', 'How should I store my medicines?',
    `Follow the storage instructions printed on the pack or leaflet. If you're unsure, ask a pharmacist or doctor.`,
    { alt: ['storage instructions', 'keep in fridge', 'how to store tablets'], kw: ['store', 'storage', 'fridge', 'temperature', 'keep'], p: 3 }),
  entry('packaging', 'quality', 'How are medicines packed for shipping?',
    `The team packs shipments for transit. I don't have verified details about specific packaging, so ask the team if you have special requirements.`,
    { alt: ['discreet packaging', 'how will it be packed', 'packing details'], kw: ['packing', 'packed', 'packaging', 'discreet', 'box'], p: 4, escalate: true }),

  // ------------------------------------------------------------- shipping
  entry('shipping-time', 'shipping', 'How long does delivery take?',
    `Delivery time depends on the product, the quantity and where it is going, so our team confirms an estimated timeline in your quote. Prescription-required items can take a little longer because of verification. I won't guess a date.`,
    { alt: ['delivery time', 'when will i receive', 'how many days', 'shipping time', 'kitne din me aayega', 'eta'], kw: ['delivery', 'time', 'days', 'when', 'long', 'arrive', 'timeline', 'eta'], p: 10, links: [SHIP], related: ['shipping-cost', 'track-shipment'] }),
  entry('shipping-cost', 'shipping', 'What are the shipping charges?',
    `Shipping charges depend on the item, the quantity and the destination. Our team includes them in your quote, so you see the full cost before you confirm anything.`,
    { alt: ['shipping cost', 'delivery charges', 'free shipping', 'how much is shipping', 'postage'], kw: ['shipping', 'charges', 'cost', 'free', 'fee', 'postage', 'delivery'], p: 9, links: [SHIP] }),
  entry('shipping-change-address', 'shipping', 'Can I change my delivery details?',
    `Delivery details can be updated while your inquiry is being processed. Share your inquiry reference and the change with our team.`,
    { alt: ['change address', 'wrong address', 'update delivery address', 'different shipping address'], kw: ['address', 'change', 'update', 'wrong', 'delivery'], p: 6, escalate: true, links: [CONTACT] }),
  entry('shipping-delays', 'shipping', 'What if my delivery is delayed?',
    `Delays can happen in transit or at customs. Contact our team with your inquiry reference and they will look into it with you. The Shipping Policy has more on delays.`,
    { alt: ['order is late', 'not received yet', 'delivery delayed', 'where is my package', 'still waiting for delivery'], kw: ['delay', 'delayed', 'late', 'waiting', 'missing', 'stuck'], p: 8, escalate: true, links: [SHIP, CONTACT] }),
  entry('shipping-policy', 'shipping', 'Where can I read the Shipping Policy?',
    `Our Shipping Policy explains how delivery works, processing time, costs, tracking and delays.`,
    { alt: ['shipping policy', 'delivery policy', 'shipping terms'], kw: ['policy', 'shipping', 'terms'], p: 5, links: [SHIP] }),

  // -------------------------------------------------------- international
  entry('ship-countries', 'international', 'Which countries do you ship to?',
    `We regularly supply buyers in ${COUNTRIES}. For any other destination, send an inquiry with your delivery location and our team will confirm whether they can deliver there.`,
    { alt: ['do you ship to my country', 'international shipping', 'do you deliver to usa', 'ship to canada', 'ship to uk', 'worldwide shipping', 'which countries'], kw: ['countries', 'country', 'international', 'worldwide', 'ship', 'deliver', 'usa', 'uk', 'canada', 'australia', 'abroad', 'overseas'], p: 10, links: [SHIP], related: ['customs'] }),
  entry('customs', 'international', 'Who handles customs and import rules?',
    `Import rules and duties differ by country. Please check what your country allows before ordering. Our team can tell you what they know about your destination, but I can't state customs rules or duties for you.`,
    { alt: ['customs duty', 'import tax', 'will it clear customs', 'import restrictions', 'seized at customs', 'import duty'], kw: ['customs', 'duty', 'duties', 'import', 'tax', 'clear', 'restriction', 'seized'], p: 8, escalate: true }),
  entry('ship-india', 'international', 'Do you deliver within India?',
    `India is among the countries we supply. Send a quote request with your delivery location and our team will confirm details.`,
    { alt: ['delivery in india', 'india delivery', 'ship within india', 'bharat delivery'], kw: ['india', 'domestic', 'within'], p: 5 }),

  // ------------------------------------------------------------- tracking
  entry('track-shipment', 'tracking', 'Can I track my shipment?',
    `When tracking is available for your shipment, our team shares the tracking details with you as soon as it ships. I can't look up tracking myself in chat.`,
    { alt: ['track my order', 'tracking number', 'where is my order', 'order tracking', 'track package', 'tracking id'], kw: ['track', 'tracking', 'trace', 'awb', 'courier', 'where'], p: 9, escalate: true, related: ['track-inquiry'] }),
  entry('tracking-not-received', 'tracking', 'I have not received any tracking details.',
    `Tracking is shared when it is available for your shipment. If you've been waiting, contact our team with your inquiry reference and they will check.`,
    { alt: ['no tracking number', 'tracking not working', 'tracking id not received'], kw: ['tracking', 'received', 'missing'], p: 6, escalate: true }),

  // ------------------------------------------------------------- payments
  entry('payment-methods', 'payments', 'What payment methods do you accept?',
    `Payment options depend on your country and order, so our team shares the available methods together with your quote. You only pay after you have seen and confirmed the full quote.`,
    { alt: ['how can i pay', 'do you accept credit card', 'paypal', 'upi', 'bank transfer', 'cash on delivery', 'payment options', 'cod'], kw: ['payment', 'pay', 'card', 'credit', 'debit', 'paypal', 'upi', 'transfer', 'cod', 'cash', 'methods', 'wire'], p: 10 }),
  entry('when-to-pay', 'payments', 'When do I pay?',
    `Only after you've seen and confirmed the quote. Sending a quote request is free and doesn't commit you to anything.`,
    { alt: ['pay before or after', 'advance payment', 'do i pay now', 'when is payment due'], kw: ['when', 'advance', 'before', 'after', 'pay', 'payment'], p: 7 }),
  entry('payment-safe', 'payments', 'Is it safe to pay?',
    `Please pay only using the payment details that our team shares with your quote, and never share card numbers or passwords in this chat. If you're unsure whether a payment request is genuine, contact us on the number or email on our Contact page.`,
    { alt: ['is payment secure', 'payment security', 'am i safe paying', 'scam payment request'], kw: ['safe', 'secure', 'security', 'scam', 'fraud', 'genuine'], p: 6, links: [CONTACT] }),
  entry('payment-status', 'payments', 'Has my payment gone through?',
    `I can't see payment status from chat. Please contact our team with your inquiry reference and they will confirm it.`,
    { alt: ['payment confirmation', 'i paid but no confirmation', 'payment failed', 'payment not showing', 'money deducted'], kw: ['paid', 'payment', 'confirmation', 'failed', 'deducted', 'status', 'receipt'], p: 7, escalate: true, links: [CONTACT] }),
  entry('invoice', 'payments', 'Can I get an invoice?',
    `Please ask our team when you confirm your quote. I don't have verified details about invoices.`,
    { alt: ['bill', 'tax invoice', 'receipt', 'gst invoice'], kw: ['invoice', 'bill', 'receipt', 'gst'], p: 4, escalate: true }),

  // ------------------------------------------------------------ inquiries
  entry('track-inquiry', 'inquiries', 'How do I check the status of my inquiry?',
    `Use "Check My Inquiry" in this chat with your reference (like CN-2026-0018) and the email you used. Statuses are: Received, in touch with you, or Closed.`,
    { alt: ['inquiry status', 'check my request', 'my reference number', 'what is the status of my inquiry', 'enquiry status'], kw: ['status', 'reference', 'check', 'inquiry', 'enquiry', 'request'], p: 9, related: ['reply-time'] }),
  entry('reply-time', 'inquiries', 'How soon will the team reply?',
    `We reply by email, and in live chat our team usually joins within a few minutes when they're online. I can't promise an exact time for a quote, but your request is in the team's queue as soon as you send it.`,
    { alt: ['when will you reply', 'how long for response', 'no reply yet', 'response time', 'not heard back', 'kab tak reply'], kw: ['reply', 'response', 'respond', 'long', 'wait', 'heard', 'back', 'soon'], p: 8, escalate: true }),
  entry('lost-reference', 'inquiries', 'I lost my reference number.',
    `Check the confirmation email we sent when you submitted your request. If you can't find it, contact our team with the email you used and they can help.`,
    { alt: ['forgot reference id', 'lost inquiry id', 'cant find reference'], kw: ['lost', 'forgot', 'reference', 'find'], p: 5, escalate: true }),
  entry('confirmation-email', 'inquiries', 'I did not get a confirmation email.',
    `Please check your spam or promotions folder and make sure the email address you entered was correct. If it's still missing, contact our team and they'll confirm your request was received.`,
    { alt: ['no email received', 'email not coming', 'where is confirmation mail', 'thank you email missing'], kw: ['email', 'confirmation', 'spam', 'received', 'mail'], p: 7, escalate: true }),
  entry('inquiry-pdf', 'inquiries', 'Can I download my inquiry details?',
    `Yes. After you submit a request, you can download a PDF summary with your reference ID and details from the confirmation screen.`,
    { alt: ['download inquiry pdf', 'inquiry summary', 'save my request'], kw: ['pdf', 'download', 'summary', 'save'], p: 4 }),

  // -------------------------------------------------------------- returns
  entry('return-policy', 'returns', 'What is your return or refund policy?',
    `We don't have a published return or refund policy on the site, and I can't invent one. Our team handles issues such as damaged, missing or wrong items case by case. Please contact them with your inquiry reference.`,
    { alt: ['can i return medicines', 'refund', 'money back', 'return policy', 'exchange', 'replacement'], kw: ['return', 'refund', 'money', 'back', 'exchange', 'replace', 'replacement'], p: 10, escalate: true, links: [CONTACT] }),
  entry('damaged-item', 'returns', 'My order arrived damaged.',
    `I'm sorry about that. Please contact our team straight away with your inquiry reference and, if you can, photos of the package. They'll sort it out with you directly.`,
    { alt: ['broken package', 'damaged product', 'tablets are crushed', 'package opened'], kw: ['damaged', 'broken', 'crushed', 'opened', 'torn', 'leak'], p: 9, escalate: true, links: [CONTACT] }),
  entry('wrong-item', 'returns', 'I received the wrong or a missing item.',
    `I'm sorry about that. Please contact our team with your inquiry reference and what you received. They'll check it with you directly.`,
    { alt: ['wrong medicine received', 'item missing', 'different product', 'short quantity', 'incomplete order'], kw: ['wrong', 'missing', 'different', 'incorrect', 'short', 'incomplete'], p: 9, escalate: true, links: [CONTACT] }),
  entry('complaint', 'returns', 'How do I make a complaint?',
    `I'm sorry you've had a problem. Please contact our team by email or phone, or ask me to connect you, and tell them your inquiry reference so they can look into it.`,
    { alt: ['i want to complain', 'bad experience', 'unhappy with service', 'file a complaint', 'legal', 'lawyer'], kw: ['complaint', 'complain', 'unhappy', 'bad', 'angry', 'legal', 'lawyer', 'escalate'], p: 8, escalate: true, links: [CONTACT] }),

  // -------------------------------------------------------------- privacy
  entry('privacy-data', 'privacy', 'How do you use my personal information?',
    `We use your details to respond to your requests and to process your inquiry. Our Privacy Policy explains what we collect and how it's used.`,
    { alt: ['is my data safe', 'privacy policy', 'what data do you collect', 'do you share my details', 'data protection', 'personal information'], kw: ['privacy', 'data', 'personal', 'information', 'share', 'collect', 'protect'], p: 8, links: [{ label: 'Privacy Policy', to: '/privacy-policy' }] }),
  entry('terms', 'privacy', 'Where can I read the Terms of Service?',
    `The Terms of Service are published on our website.`,
    { alt: ['terms and conditions', 'terms of use', 'legal terms'], kw: ['terms', 'conditions', 'tos', 'legal'], p: 5, links: [{ label: 'Terms of Service', to: '/terms-of-service' }] }),
  entry('delete-data', 'privacy', 'Can I ask you to delete my data?',
    `Please contact our team with your request and the email you used, and they will help. I can't delete data from chat.`,
    { alt: ['remove my information', 'delete my details', 'gdpr', 'erase my data'], kw: ['delete', 'remove', 'erase', 'gdpr', 'data'], p: 5, escalate: true, links: [CONTACT] }),
  entry('share-sensitive', 'privacy', 'Should I share health details or card numbers in chat?',
    `Please don't. Don't share card numbers, passwords or one-time codes here. If our team needs a prescription or other sensitive document, they'll tell you how to send it.`,
    { alt: ['can i send my prescription in chat', 'is chat private', 'share card number'], kw: ['share', 'card', 'password', 'otp', 'sensitive', 'private'], p: 6 }),

  // -------------------------------------------------------------- support
  entry('contact-support', 'support', 'How can I contact CureNeed?',
    `You can reach our team at ${BUSINESS.email} or ${BUSINESS.phone}. You can also use the Contact page, or ask me to connect you with the team in this chat.`,
    { alt: ['how can i contact you', 'how do i contact cureneed', 'how to contact', 'contact number', 'phone number', 'email address', 'customer care', 'customer support', 'talk to someone', 'helpline', 'whatsapp'], kw: ['contact', 'phone', 'email', 'call', 'number', 'support', 'help', 'whatsapp', 'customer', 'care'], p: 10, links: [CONTACT] }),
  entry('support-hours', 'support', 'What are your working hours?',
    `I don't have verified support hours to share. Send a message at any time and our team will reply as soon as they're available. If they're online you'll see it in live chat.`,
    { alt: ['when are you open', 'business hours', 'opening time', 'are you available now', 'is anyone online'], kw: ['hours', 'open', 'timing', 'timings', 'available', 'online', 'closed', 'working'], p: 7, escalate: true }),
  entry('talk-to-human', 'support', 'Can I talk to a real person?',
    `Of course. Choose "Talk to Our Team" in this chat, leave your details, and an expert will join the conversation. If you leave, we'll email you their reply.`,
    { alt: ['human agent', 'speak to representative', 'live agent', 'real person', 'talk to agent', 'connect me to support'], kw: ['human', 'person', 'agent', 'representative', 'live', 'talk', 'speak', 'someone'], p: 9, escalate: true }),

  // --------------------------------------------------------------- safety
  entry('side-effects', 'safety', 'What are the side effects of a medicine?',
    `I can't give medical advice. Please read the leaflet that comes with the medicine and ask a doctor or pharmacist about side effects or interactions.`,
    { alt: ['side effect', 'adverse reaction', 'interactions', 'is it safe with other medicines', 'can i take with alcohol', 'safe in pregnancy'], kw: ['side', 'effects', 'reaction', 'interaction', 'pregnancy', 'alcohol', 'allergy'], p: 8 }),
  entry('emergency', 'safety', 'What should I do in a medical emergency?',
    EMERGENCY_ANSWER,
    { alt: ['emergency', 'overdose', 'poisoning', 'i feel very sick', 'chest pain', 'cant breathe', 'ambulance'], kw: ['emergency', 'overdose', 'poison', 'ambulance', 'urgent', 'hospital'], p: 10 }),
  entry('children-elderly', 'safety', 'Can I give this medicine to a child or an elderly person?',
    `I can't advise on that. Please ask a doctor or pharmacist, who can consider age and health conditions.`,
    { alt: ['medicine for kids', 'safe for children', 'elderly dosage', 'baby medicine'], kw: ['child', 'children', 'kids', 'baby', 'elderly', 'old'], p: 6 }),

  // -------------------------------------------------------------- reviews
  entry('are-reviews-real', 'reviews', 'Are the customer reviews real?',
    `Reviews on our Reviews page are submitted by visitors and shown with a rating. We don't publish reviews we haven't received.`,
    { alt: ['customer reviews', 'testimonials', 'what do customers say', 'ratings', 'feedback from buyers'], kw: ['reviews', 'review', 'testimonial', 'rating', 'customers', 'feedback', 'stars'], p: 7, links: [{ label: 'Reviews', to: '/reviews' }] }),
  entry('write-review', 'reviews', 'How can I write a review?',
    `Open the Reviews page and use the form to share your rating and comments.`,
    { alt: ['leave feedback', 'rate cureneed', 'submit review', 'post a review'], kw: ['write', 'leave', 'submit', 'review', 'rate', 'feedback'], p: 5, links: [{ label: 'Write a review', to: '/reviews' }] }),

  // ----------------------------------------------------------------- chat
  entry('chat-what-can-you-do', 'chat', 'What can the chat assistant help with?',
    `I can look up medicines, prices and availability, explain how ordering and delivery work, answer common questions, start a quote request, check an inquiry's status and connect you with our team. I can't give medical advice or see payment, tracking or stock information.`,
    { alt: ['what can you do', 'how can you help', 'are you a bot', 'are you human', 'who am i talking to', 'are you ai'], kw: ['bot', 'assistant', 'chat', 'ai', 'robot', 'human', 'help', 'can'], p: 7 }),
  entry('chat-live-wait', 'chat', 'How long will I wait for a live chat?',
    `When you ask for our team, an expert usually joins within the wait time shown in the chat (typically 5–10 minutes when they're online). Please keep the chat open. If you leave, we'll email you the reply.`,
    { alt: ['wait time in chat', 'when will someone join', 'chat is waiting', 'nobody replied in chat'], kw: ['wait', 'live', 'chat', 'join', 'minutes', 'reply'], p: 6, escalate: true }),

  // -------------------------------------------------------------- website
  entry('website-problem', 'website', 'The website is not working properly.',
    `Try refreshing the page or using a different browser. If the problem continues, let our team know what you were doing and what you saw, and they'll look into it.`,
    { alt: ['site not loading', 'page not opening', 'error on website', 'button not working', 'bug', 'website slow'], kw: ['website', 'site', 'loading', 'error', 'bug', 'broken', 'working', 'slow', 'page'], p: 5, escalate: true, links: [CONTACT] }),
  entry('mobile-friendly', 'website', 'Does the website work on my phone?',
    `Yes. The website and this chat are designed to work on phones, tablets and computers.`,
    { alt: ['mobile app', 'is there an app', 'use on phone'], kw: ['mobile', 'phone', 'app', 'android', 'iphone', 'tablet'], p: 3 }),
  entry('favorites', 'website', 'Can I save medicines to look at later?',
    `Yes. Use the heart icon on a medicine to add it to your Favorites.`,
    { alt: ['wishlist', 'save for later', 'bookmark a product'], kw: ['favorite', 'favourite', 'wishlist', 'save', 'later', 'heart'], p: 3, links: [{ label: 'Favorites', to: '/favorites' }] }),

  // ------------------------------------------------------------- accounts
  entry('need-account', 'accounts', 'Do I need an account to order?',
    `No account is needed to browse or to send a quote request. Just fill in your details when you submit.`,
    { alt: ['do i have to register', 'sign up required', 'create account', 'login to order', 'guest order'], kw: ['account', 'register', 'sign', 'login', 'signup', 'guest'], p: 7 }),
  entry('stay-updated', 'accounts', 'How will I hear back about my request?',
    `By email at the address you entered, and in this chat if you're using live chat. Please make sure your email is correct.`,
    { alt: ['how will you contact me', 'will you email me', 'notification', 'updates about my request'], kw: ['updates', 'notify', 'notification', 'contact', 'email', 'hear'], p: 5 }),
];

export const publishedFaqs = () => FAQ_ENTRIES.filter((item) => item.published);
export const categoryById = (id) => FAQ_CATEGORIES.find((category) => category.id === id);

// Public shape for GET /api/faq: only published entries, empty categories dropped.
export const faqPayload = (entries = publishedFaqs()) => {
  const items = entries.filter((item) => item.published);
  return {
    categories: FAQ_CATEGORIES.map((category) => ({
      ...category,
      count: items.filter((item) => item.category === category.id).length,
    })).filter((category) => category.count > 0),
    items,
    popular: [...items].sort((a, b) => b.priority - a.priority).slice(0, 8).map((item) => item.id),
    support: { email: BUSINESS.email, phone: BUSINESS.phone },
  };
};
