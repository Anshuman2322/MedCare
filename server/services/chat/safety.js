// Guardrail that runs before anything else. A medicine supplier's assistant
// must never answer "what should I take" style questions, so anything that
// reads as a request for diagnosis, dosing or treatment advice gets a refusal
// and a route to a person instead of a product search. Covers English and the
// Hinglish many Indian visitors type.

const SYMPTOMS = [
  // English
  'fever', 'temperature', 'headache', 'migraine', 'pain', 'ache', 'aching', 'cough', 'cold', 'flu', 'infection',
  'rash', 'itching', 'itchy', 'allergy', 'allergic', 'vomit', 'vomiting', 'nausea', 'diarrh(?:o)?ea', 'loose motions?',
  'constipation', 'acidity', 'gas', 'ulcer', 'asthma', 'breathless', 'diabetes', 'sugar', 'blood pressure', 'bp',
  'cholesterol', 'thyroid', 'depress\\w*', 'anxiety', 'insomnia', 'sleepless', 'pregnan\\w*', 'period', 'cramps',
  'swelling', 'wound', 'burn', 'injur\\w*', 'covid', 'dengue', 'malaria', 'typhoid', 'piles', 'stress',
  'erection', 'impotence', 'ejaculation', 'acne', 'pimples', 'hair ?fall', 'worms?', 'sore throat',
  // Hinglish
  'bukhar', 'bukhaar', 'dard', 'khansi', 'khaansi', 'sardi', 'zukam', 'jukam', 'ulti', 'dast', 'khujli',
  'kamzori', 'chakkar', 'jalan', 'sujan', 'neend',
].join('|');

const ADVICE_PATTERNS = [
  // "what should I take", "which medicine for me", "suggest a tablet"
  /\bwh(?:at|ich)\b[^?.!]{0,40}\b(?:should|can|do|must)\s+i\s+(?:take|use|have|try|buy)\b/i,
  /\bwh(?:at|ich)\s+(?:medicine|medication|tablet|drug|capsule|syrup|injection|treatment)\b[^?.!]{0,30}\b(?:for|should|do|is\s+(?:best|good|right))\b/i,
  /\b(?:suggest|recommend|prescribe|advise)\b[^?.!]{0,30}\b(?:medicine|medication|tablet|drug|capsule|syrup|treatment|dose|dosage|something)\b/i,
  // "something for fever", "any tablet for cough"
  new RegExp(`\\b(?:something|anything|some|any|best|good)\\b[^?.!]{0,25}\\bfor\\b[^?.!]{0,20}\\b(?:${SYMPTOMS})\\b`, 'i'),
  new RegExp(`\\b(?:medicine|medication|tablet|drug|capsule|syrup|treatment|cure|dawa|dawai)\\s+(?:for|to\\s+(?:treat|cure|stop))\\b[^?.!]{0,20}\\b(?:${SYMPTOMS})\\b`, 'i'),
  // dosing questions
  /\bhow\s+(?:much|many|often)\b[^?.!]{0,40}\b(?:take|use|dose|dosage|consume)\b/i,
  /\b(?:dose|dosage)\b[^?.!]{0,20}\bfor\s+(?:me|my|a\s+\d+|an?\s+\d+|\d+\s*(?:year|yr|month))/i,
  /\b(?:dose|dosage)\s+(?:of|for)\b/i,
  // interaction / suitability / stopping medication
  /\b(?:can|should|may)\s+i\s+(?:take|use|stop|start|continue|combine|mix)\b/i,
  /\bis\s+(?:it|this|that)\s+(?:safe|ok|okay|good|suitable|fine)\b[^?.!]{0,25}\b(?:for\s+(?:me|my|him|her|kids?|children|pregnan)|to\s+take)/i,
  /\b(?:side\s*effects?|reaction)\b[^?.!]{0,25}\b(?:for|on)\s+(?:me|my)\b/i,
  /\bwith\s+alcohol\b/i,
  // "do I need X", "am I allowed"
  /\bdo\s+i\s+need\b[^?.!]{0,30}\b(?:medicine|medication|tablet|antibiotic|treatment)\b/i,
  // Hinglish: "kaunsi dawa lu", "kya khau", "kitni goli"
  /\b(?:kaun\s*si|kaunsi|konsi|kon\s*si)\b[^?.!]{0,25}\b(?:dawa|dawai|davai|goli|tablet|medicine)\b/i,
  /\b(?:kya|kaunsi|konsi)\s+(?:lu|loon|lun|khau|khaun|khaoon|lena\s+chahiye|khana\s+chahiye)\b/i,
  /\bkitni\s+(?:goli|tablet|dose)\b/i,
];

const SYMPTOM_REPORT = new RegExp(
  `\\bi\\s+(?:have|has|had|am\\s+having|'?m\\s+having|am\\s+suffering|'?m\\s+suffering|feel|'?m\\s+feeling|am\\s+feeling|got|get)\\b[^?.!]{0,40}\\b(?:${SYMPTOMS})\\b`,
  'i'
);

const BODY_PARTS =
  'head|stomach|tummy|belly|back|chest|throat|skin|eyes?|ears?|tooth|teeth|legs?|arms?|knees?|joints?|body|heart|blood|sugar|bp|pressure|liver|kidneys?|hair|face|nose|feet|foot|hands?|neck|shoulders?|penis|testicles?';
const RELATIVES = 'son|daughter|child|kid|baby|wife|husband|mother|mom|mum|father|dad|friend|brother|sister|grandmother|grandfather|patient';

const BODY_COMPLAINT = new RegExp(
  [
    `\\bmy\\s+(?:\\w+\\s+)?(?:${BODY_PARTS})\\s+(?:\\w+\\s+)?(?:is|are|has\\s+been|hurts?|paining|aching|swollen|high|low)\\b`,
    `\\bmy\\s+(?:${RELATIVES})\\b[^?.!]{0,30}\\b(?:${SYMPTOMS})\\b`,
    `\\bi'?m\\s+(?:sick|ill|unwell)\\b`,
    `\\bsuffering\\s+from\\b`,
    // Hinglish: "mujhe bukhar hai", "sir me dard hai"
    `\\b(?:mujhe|muje|mere|meri|mera|hume)\\b[^?.!]{0,30}\\b(?:${SYMPTOMS})\\b`,
    `\\b(?:${SYMPTOMS})\\b[^?.!]{0,15}\\b(?:ho\\s+raha|ho\\s+rahi|hai\\s+mujhe)\\b`,
  ].join('|'),
  'i'
);

export function needsMedicalRefusal(text) {
  const value = String(text || '').trim();
  if (!value) return false;

  if (SYMPTOM_REPORT.test(value)) return true;
  if (BODY_COMPLAINT.test(value)) return true;
  return ADVICE_PATTERNS.some((pattern) => pattern.test(value));
}
