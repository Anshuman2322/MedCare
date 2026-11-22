// Works out what a visitor is asking for. A message can carry several intents
// ("hi, do you ship Cenforce to Canada?" is a greeting, a shipping question and
// a product), so detect() returns all of them and the engine decides which one
// leads. Patterns cover English and common Hinglish.

const INTENTS = {
  restart: [
    /^(?:new|new chat|new conversation|start (?:a )?new(?: chat| conversation)?|start over|start again|restart|reset|clear(?: chat)?|begin again|fresh start|naya chat|new topic)[\s.!]*$/i,
  ],
  greeting: [
    /^\s*(?:hi+|hey+|hello+|helo|hlo|hii+|hola|namaste|namaskar|yo|sup|greetings|good\s+(?:morning|afternoon|evening|day)|gm|howdy)\b/i,
  ],
  thanks: [
    /\b(?:thanks?|thank\s*you|thankyou|thx|tnx|ty|tysm|thnx|dhanyavaa?d|dhanyawad|shukriya|appreciate\s+it|much\s+appreciated)\b/i,
  ],
  goodbye: [
    /\b(?:bye+|goodbye|good\s+bye|see\s+you|see\s+ya|take\s+care|that'?s\s+all|thats\s+it|nothing\s+else|no\s+more\s+questions|cya|alvida|tata)\b/i,
  ],
  affirm: [
    /^(?:y|yes|yeah|yea|yep|yup|sure|ok|okay|okk+|ofc|of course|please|please do|yes please|go ahead|do it|haan?|haa+|ha|ji|ji haan|bilkul|theek hai|thik hai|sounds good|why not|absolutely|definitely|alright|right)[\s.!]*$/i,
  ],
  deny: [
    /^(?:n|no|nope|nah|not now|no thanks|no thank you|nahi|nahin|na|mat|later|maybe later|not really|never ?mind)[\s.!]*$/i,
  ],
  identity: [
    /\b(?:are\s+you\s+(?:a\s+)?(?:bot|robot|human|real|ai|person|machine|chatbot)|who\s+are\s+you|what\s+are\s+you|your\s+name|tum\s+kaun|aap\s+kaun|is\s+this\s+(?:a\s+)?(?:bot|human|real\s+person|ai))\b/i,
  ],
  frustration: [
    /\b(?:useless|not\s+helpful|unhelpful|stupid|dumb|idiot|nonsense|bakwas|bekaa?r|you\s+don'?t\s+understand|not\s+understanding|doesn'?t\s+work|not\s+working|wrong\s+answer|irrelevant|bad\s+bot|worst|pathetic|frustrat\w*|annoy\w*|samajh\s+nahi)\b/i,
  ],
  human: [
    /\b(?:talk|speak|chat|connect|transfer)\b[^?.!]{0,20}\b(?:to|with)\b[^?.!]{0,20}\b(?:support|agent|human|someone|team|person|representative|executive|manager|staff)\b/i,
    /\b(?:human|live)\s+(?:agent|support|person|rep|chat)\b/i,
    /\b(?:real|actual)\s+person\b/i,
    /\bcustomer\s+(?:care|support|service)\b/i,
    /\bcall\s*(?:me|back)\b|\bcallback\b/i,
    /\b(?:kisi|insaan|agent|team)\s+(?:se|ko)\b[^?.!]{0,15}\b(?:baat|connect|call)\b/i,
  ],
  contact: [
    /\b(?:contact|phone|mobile|number|email|e-mail|mail\s+id|whatsapp|address|office|helpline|get\s+in\s+touch|reach\s+(?:you|out))\b/i,
  ],
  check_inquiry: [
    /\b(?:CN|BP)-\d{4}-\d{3,}\b/i,
    /\b(?:check|track|status|where\s+is|update\s+on|follow\s*up)\b[^?.!]{0,25}\b(?:inquiry|enquiry|order|reference|request|quote)\b/i,
    /\b(?:inquiry|enquiry|order|reference|request|quote)\b[^?.!]{0,15}\bstatus\b/i,
    /\bmy\s+(?:inquiry|enquiry|order|request|quote)\b/i,
  ],
  how_it_works: [
    /\bhow\s+(?:does\s+(?:it|this|cureneed|ordering)\s+work|do(?:es)?\s+(?:this|it)\s+work|to\s+(?:order|buy|purchase|place\s+an?\s+order)|(?:can|do)\s+i\s+(?:order|buy|purchase|place)|(?:is\s+)?ordering\s+(?:done|work))\b/i,
    /\b(?:ordering|order|buying|purchase)\s+process\b/i,
    /\b(?:kaise|kese)\s+(?:order|kharid|mangwa|le)\w*\b|\border\s+(?:kaise|kese)\b/i,
  ],
  submit_inquiry: [
    /\b(?:submit|send|place|raise|create|make|start|get|request)\b[^?.!]{0,20}\b(?:an?\s+)?(?:inquiry|enquiry|quote|quotation|order)\b/i,
    /\bi\s+(?:want|need|would\s+like|wish|'?d\s+like)\s+to\s+(?:buy|order|purchase)\b/i,
    /\b(?:order|buy|purchase)\s+(?:\d+|some|a\s+few)\b/i,
    /\b(?:order|kharidna|mangwana|lena)\s+(?:karna\s+)?(?:hai|h)\b/i,
  ],
  payment: [
    /\b(?:pay|payment|payments|paypal|credit\s+card|debit\s+card|card\s+payment|upi|bank\s+transfer|wire\s+transfer|western\s+union|crypto|bitcoin|cod|cash\s+on\s+delivery|invoice|bhugtan)\b/i,
  ],
  bulk: [
    /\b(?:bulk|wholesale|wholesaler|distributor|distribution|reseller|large\s+(?:quantity|order|volume)|minimum\s+order|moq|min\.?\s+order|minimum\s+quantity|b2b|tender)\b/i,
  ],
  discount: [
    /\b(?:discount|coupon|promo|offers?|cheaper|lower\s+price|best\s+price|negotiat\w*|deal|sale|kam\s+(?:karo|kar\s+do|me)|sasta)\b/i,
  ],
  ship_locations: [
    /\b(?:ship|deliver|send|export|supply|available)\w*\b[^?.!]{0,25}\b(?:to|in)\s+(?:my\s+)?(?:country|[a-z]{2,})\b/i,
    /\b(?:which|what)\s+countries\b|\b(?:international|internationally|worldwide|overseas|abroad)\b/i,
  ],
  ship_time: [
    /\bhow\s+(?:long|many\s+days|soon)\b|\bwhen\s+will\s+(?:it|i|my\s+(?:order|parcel|package))\b|\b(?:delivery|shipping|transit)\s+time\b|\barrive\b|\beta\b|\bkitne\s+din\b|\bkab\s+(?:tak|aayega|milega|aaega)\b/i,
  ],
  ship_cost: [
    /\b(?:shipping|delivery|courier|postage)\s+(?:cost|charges?|fees?|price|rate)\b|\bcost\s+of\s+(?:shipping|delivery)\b|\bfree\s+(?:shipping|delivery)\b/i,
  ],
  ship_tracking: [/\b(?:track|tracking)\b|\bwhere\s+is\s+my\s+(?:parcel|package|shipment)\b/i],
  shipping: [/\b(?:ship|shipping|shipment|deliver|delivery|dispatch|courier|freight)\w*\b/i, /\bdo\s+you\s+(?:ship|deliver)\b/i],
  prescription: [/\bprescriptions?\b|\brx\b|\bparcha\b|\bdoctor'?s?\s+(?:note|slip|letter)\b/i],
  alternatives: [
    /\b(?:alternatives?|substitutes?|similar\s+(?:to|medicine|product)|generic\s+(?:of|for|version)|same\s+(?:composition|salt|ingredient|medicine)|other\s+brands?|instead\s+of)\b/i,
  ],
  price: [/\b(?:price|prices|pricing|cost|costs|rate|charges?|daam|dam|keemat|kimat)\b/i, /\bhow\s+much\b/i, /\bkitne\s+ka\b|\bkitna\s+(?:hai|h|ka|padega)\b/i],
  availability: [/\b(?:in\s+stock|out\s+of\s+stock|availability|available)\b/i, /\b(?:milega|milegi|stock\s+(?:me|mein))\b/i],
  product_info: [
    /\b(?:composition|ingredients?|salt|manufacturer|made\s+by|which\s+company|expiry|shelf\s+life|storage|pack\s*size|packaging|strength|specifications?|details|information|info)\b/i,
    /\btell\s+me\s+(?:more\s+)?about\b/i,
  ],
  browse: [
    /\bwhat\s+(?:do\s+you|products\s+do\s+you|medicines\s+do\s+you|all\s+do\s+you)\s+(?:sell|have|offer|stock|carry)\b/i,
    /\b(?:what|which)\s+(?:products|medicines|categories)\b|\bcategor(?:y|ies)\b|\bcatalog(?:ue)?\b|\bproduct\s+list\b|\bfull\s+list\b|\ball\s+(?:products|medicines)\b|\bkya\s+kya\b/i,
  ],
  trust: [
    /\b(?:legit|legitimate|trusted|trustworthy|genuine|authentic|fake|scam|fraud|real\s+company|verified|safe\s+to\s+(?:buy|order)|reliable)\b/i,
    /\b(?:reviews?|ratings?|testimonials?)\b/i,
  ],
  about: [
    /\babout\s+(?:you|cureneed|your\s+company|the\s+company)\b|\bwho\s+(?:is|are)\s+cureneed\b|\bwhere\s+are\s+you\s+(?:based|located|from)\b|\byour\s+company\b/i,
  ],
  returns: [
    /\b(?:refund|return|returns|cancel|cancellation|exchange|damaged|broken|wrong\s+(?:item|product|medicine)|missing|complaint|not\s+received|didn'?t\s+receive)\b/i,
  ],
  find: [/\b(?:find|search|looking\s+for|look\s+for|do\s+you\s+(?:have|sell|stock|carry)|have\s+you\s+got|need|want|chahiye)\b/i],
};

const COUNTRIES = {
  'united states': ['usa', 'us', 'u.s.', 'america', 'united states', 'states'],
  'united kingdom': ['uk', 'u.k.', 'united kingdom', 'england', 'britain', 'great britain', 'scotland', 'wales'],
  canada: ['canada'],
  australia: ['australia'],
  'new zealand': ['new zealand', 'nz'],
  india: ['india'],
  kuwait: ['kuwait'],
  philippines: ['philippines'],
  bangladesh: ['bangladesh'],
  aruba: ['aruba'],
};

const COUNTRY_LABELS = {
  'united states': 'the United States',
  'united kingdom': 'the United Kingdom',
  'new zealand': 'New Zealand',
};

// The country a message mentions, if it's one we regularly supply; `other`
// is set when the message names a destination we don't list ("ship to Brazil").
export function detectCountry(text) {
  const value = ` ${String(text || '').toLowerCase().replace(/[^a-z.\s]/g, ' ').replace(/\s+/g, ' ')} `;
  for (const [key, aliases] of Object.entries(COUNTRIES)) {
    if (aliases.some((alias) => value.includes(` ${alias} `))) {
      return { known: true, label: COUNTRY_LABELS[key] || key.replace(/\b\w/g, (c) => c.toUpperCase()) };
    }
  }
  const named = value.match(/\b(?:ship|deliver|send|export|supply)\w*\s+(?:\w+\s+)?(?:to|in)\s+([a-z]{3,}(?:\s+[a-z]{3,})?)\b/);
  if (named && !/^(?:my|me|you|your|us|the|our|which|what|this|that|home|india)\b/.test(named[1])) {
    return { known: false, label: named[1].replace(/\b\w/g, (c) => c.toUpperCase()) };
  }
  return null;
}

export function detect(text) {
  const value = String(text || '').trim();
  const found = new Set();
  if (!value) return { intents: found, referenceId: '', country: null };

  for (const [id, patterns] of Object.entries(INTENTS)) {
    if (patterns.some((pattern) => pattern.test(value))) found.add(id);
  }

  // "call me" is a request for a person, not for our phone number.
  if (found.has('human')) found.delete('contact');
  // A reference number is an inquiry lookup, whatever else is said.
  const reference = value.match(/\b(?:CN|BP)-\d{4}-\d{3,}\b/i);
  // Asking for prices in bulk is a bulk question, not a single price lookup.
  if (found.has('bulk')) found.delete('discount');

  return {
    intents: found,
    referenceId: reference ? reference[0].toUpperCase() : '',
    country: detectCountry(value),
  };
}

// Kept for older callers: the single strongest intent.
const PRIORITY = [
  'human', 'check_inquiry', 'submit_inquiry', 'prescription', 'shipping', 'availability', 'price', 'product_info',
  'find', 'greeting',
];
export function classifyIntent(text) {
  const { intents } = detect(text);
  const id = PRIORITY.find((intent) => intents.has(intent));
  return id === 'find' ? 'find_medicine' : id || null;
}

// A bare "Azithromycin" or "Cefixime 200mg" carries no intent words at all, so
// a short, name-shaped message is treated as a catalogue lookup.
export function looksLikeMedicineName(text) {
  const value = String(text || '').trim();
  if (!value || value.length > 60) return false;
  if (/[?]/.test(value)) return false;

  const tokens = value.split(/\s+/);
  if (tokens.length > 5) return false;

  return /^[A-Za-z][A-Za-z0-9\s./+-]*$/.test(value);
}
