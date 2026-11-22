import mongoose from 'mongoose';
import Medicine, { PUBLIC_MEDICINE_FILTER } from '../../models/Medicine.js';
import { normalize, words, wordSimilarity, editDistance, FILLER_WORDS, INTENT_WORDS, GENERIC_NAME_WORDS } from './text.js';

// Catalogue lookups for the chat assistant. The public catalogue is small (tens
// to a few hundred products), so matching runs in memory: that is what lets a
// typo ("ibuprofin", "cenfroce 100") or a molecule name still find the product.

const MAX_RESULTS = 4;
const FIELDS =
  'slug name category brand manufacturer composition image images inStock requiresPrescription variants shelfLife storage description';

function dbReady() {
  return mongoose.connection.readyState === 1;
}

export async function loadCatalogue() {
  if (!dbReady()) return [];
  return Medicine.find(PUBLIC_MEDICINE_FILTER).select(FIELDS).lean();
}

/** "Cefix 200 (Cefixime Tablets IP 200 mg)" -> "Cefix 200" */
export const shortName = (name) => String(name || '').split(' (')[0].trim();

export function toMedicineCard(medicine) {
  const variant = medicine?.variants?.[0] || {};
  const price = Number(variant.price ?? medicine?.price);

  return {
    type: 'medicine',
    slug: medicine?.slug || '',
    id: String(medicine?._id || medicine?.slug || ''),
    name: medicine?.name || '',
    category: medicine?.category || '',
    // Raw USD figure; the widget formats it in the shopper's selected currency.
    price: Number.isFinite(price) && price > 0 ? price : null,
    image: medicine?.image || medicine?.images?.[0] || '',
    inStock: medicine?.inStock !== false,
    requiresPrescription: Boolean(medicine?.requiresPrescription),
    strength: variant.strength || '',
    form: variant.form || '',
    packSize: variant.packSize || '',
    packagingType: variant.packagingType || '',
  };
}

// --------------------------------------------------------------- matching

// Composition text is prose ("Ibuprofen BP 400 mg per sugar-coated tablet");
// only the molecule part before the first number identifies a product.
const COMPOSITION_STOP = new Set(['herbal', 'formulation', 'including', 'blend', 'each', 'contains', 'film', 'coated', 'sugar', 'colour', 'color', 'per', 'with', 'and', 'the', 'of']);
const moleculeWords = (composition) =>
  words(String(composition || '').split(/\d/)[0]).filter((word) => !COMPOSITION_STOP.has(word));

function searchableWords(medicine) {
  return {
    name: words(medicine.name),
    composition: moleculeWords(medicine.composition),
    maker: words(`${medicine.brand || ''} ${medicine.manufacturer || ''}`),
    strength: words((medicine.variants || []).map((v) => v.strength).join(' ')),
  };
}

// The words of a message that could name a product: no filler, no units.
export function productTerms(text) {
  return words(text).filter((word) => !FILLER_WORDS.has(word) && !INTENT_WORDS.has(word));
}

function bestSimilarity(term, candidates) {
  let best = 0;
  for (const candidate of candidates) {
    const score = wordSimilarity(term, candidate);
    if (score > best) best = score;
    if (best === 1) break;
  }
  return best;
}

// Scores one medicine against the visitor's terms. A product only counts as
// found when a distinctive word (a brand or molecule, not "tablets" or "20")
// matches; numbers then narrow it to the right strength.
function scoreMedicine(medicine, terms) {
  const fields = searchableWords(medicine);
  let score = 0;
  let distinctive = 0;
  let closest = 0;
  let textTerms = 0;
  let matchedTextTerms = 0;

  for (const term of terms) {
    if (/^\d+(\.\d+)?%?$/.test(term)) {
      if (fields.name.includes(term) || fields.strength.includes(term)) score += 0.6;
      else score -= 0.4;
      continue;
    }
    if (term.length < 3) continue;
    textTerms += 1;

    const inName = bestSimilarity(term, fields.name);
    const inComposition = bestSimilarity(term, fields.composition) * 0.9;
    const inMaker = bestSimilarity(term, fields.maker) * 0.6;
    const best = Math.max(inName, inComposition, inMaker);
    if (best < 0.75) continue;

    matchedTextTerms += 1;
    score += best;
    if (!GENERIC_NAME_WORDS.has(term)) {
      distinctive += 1;
      closest = Math.max(closest, best);
    }
  }

  // An exact brand or molecule is enough on its own; a typo-corrected one
  // must also cover most of what was typed, to avoid far-fetched matches.
  if (!distinctive) return null;
  if (closest < 0.99 && matchedTextTerms < Math.ceil(textTerms / 2)) return null;
  if (medicine.inStock !== false) score += 0.05;
  return { score, exact: closest >= 0.99 };
}

// Well-known originator brands we don't list, mapped to the molecule our
// products contain, so "do you have viagra?" can point to sildenafil products
// (and say plainly that they are not the brand itself).
const BRAND_MOLECULES = {
  viagra: 'sildenafil',
  cialis: 'tadalafil',
  levitra: 'vardenafil',
  priligy: 'dapoxetine',
  stromectol: 'ivermectin',
  zithromax: 'azithromycin',
  azithral: 'azithromycin',
  advil: 'ibuprofen',
  motrin: 'ibuprofen',
  brufen: 'ibuprofen',
  nurofen: 'ibuprofen',
  tylenol: 'paracetamol',
  panadol: 'paracetamol',
  crocin: 'paracetamol',
  calpol: 'paracetamol',
  acetaminophen: 'paracetamol',
  glucophage: 'metformin',
  lexapro: 'escitalopram',
  cipralex: 'escitalopram',
  plaquenil: 'hydroxychloroquine',
  vermox: 'mebendazole',
  amoxil: 'amoxicillin',
  suprax: 'cefixime',
  vibramycin: 'doxycycline',
  rogaine: 'minoxidil',
  loniten: 'minoxidil',
  pataday: 'olopatadine',
  patanol: 'olopatadine',
};

function expandBrands(terms) {
  let brand = null;
  const expanded = terms.map((term) => {
    const known = Object.keys(BRAND_MOLECULES).find((name) => wordSimilarity(term, name) >= 0.85);
    if (!known) return term;
    brand = { brand: known, molecule: BRAND_MOLECULES[known] };
    return BRAND_MOLECULES[known];
  });
  return { terms: expanded, brand };
}

// Everything a reply needs about a product search:
//   results  ranked [{ medicine, score, exact }] (at most `limit`)
//   total    how many products matched in all
//   brand    { brand, molecule } when a brand we don't list was translated
// `exact` is false when the match needed a typo correction ("Did you mean").
export async function searchCatalogue(text, { limit = MAX_RESULTS, catalogue } = {}) {
  const empty = { results: [], total: 0, brand: null };
  const { terms, brand } = expandBrands(productTerms(text));
  if (!terms.some((term) => /[a-z]/.test(term) && term.length >= 3)) return empty;

  const items = catalogue || (await loadCatalogue());
  let scored = [];
  for (const medicine of items) {
    const result = scoreMedicine(medicine, terms);
    if (result) scored.push({ medicine, ...result });
  }
  if (!scored.length) return { ...empty, brand };

  // A product spelled exactly as typed beats ones that only look similar
  // ("Tadalista 20" shouldn't also bring up "Vidalista").
  if (scored.some((entry) => entry.exact)) scored = scored.filter((entry) => entry.exact);

  scored.sort((a, b) => b.score - a.score || String(a.medicine.name).localeCompare(String(b.medicine.name)));

  // Keep only results close to the best one, so "Tadalista 20" doesn't also
  // list every product that merely contains "20".
  const top = scored[0].score;
  const close = scored.filter((entry) => entry.score >= top - 0.75);
  return { results: close.slice(0, limit), total: close.length, brand };
}

export async function matchMedicines(text, options) {
  return (await searchCatalogue(text, options)).results;
}

export async function searchMedicines(query) {
  const matches = await matchMedicines(query);
  return matches.map((entry) => toMedicineCard(entry.medicine));
}

// Closest product names for a word that matched nothing, for "Did you mean...".
// Looser than matchMedicines on purpose: it only suggests, never answers.
export async function suggestNames(text, { catalogue } = {}) {
  const terms = productTerms(text).filter((term) => term.length >= 4 && /[a-z]/.test(term));
  if (!terms.length) return [];
  const items = catalogue || (await loadCatalogue());

  const looseSimilarity = (a, b) => 1 - editDistance(a, b) / Math.max(a.length, b.length);
  const scored = items
    .map((medicine) => {
      const nameWords = words(`${shortName(medicine.name)} ${moleculeWords(medicine.composition).join(' ')}`).filter(
        (word) => word.length >= 4 && !GENERIC_NAME_WORDS.has(word)
      );
      const best = Math.max(0, ...terms.flatMap((term) => nameWords.map((word) => looseSimilarity(term, word))));
      return { medicine, best };
    })
    .filter((entry) => entry.best >= 0.6)
    .sort((a, b) => b.best - a.best);

  // One suggestion per brand family ("Tadalista 5/10/20" -> one entry).
  const seen = new Set();
  return scored
    .filter((entry) => {
      const key = shortName(entry.medicine.name).replace(/\s+\d.*$/, '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .map((entry) => entry.medicine);
}

export async function findMedicineBySlug(slug) {
  if (!slug || !dbReady()) return null;

  const or = [{ slug: String(slug) }];
  if (mongoose.Types.ObjectId.isValid(slug)) or.push({ _id: slug });

  return Medicine.findOne({ ...PUBLIC_MEDICINE_FILTER, $or: or }).lean();
}

// --------------------------------------------------------------- categories

// Everyday words for each catalogue category, so "eye drops" or "ED tablets"
// finds the category even though nobody types its exact label.
const CATEGORY_WORDS = {
  'eye care': ['eye', 'eyes', 'eye drops', 'eye drop', 'ophthalmic', 'dry eye', 'dry eyes'],
  antibiotics: ['antibiotic', 'antibiotics', 'antibacterial'],
  'pain relief': ['pain relief', 'painkiller', 'painkillers', 'pain killer', 'pain killers', 'analgesic'],
  ed: ['ed', 'erectile', 'erectile dysfunction', 'sexual health', 'mens health', 'men s health', 'sexual wellness', 'premature ejaculation'],
  'mental health': ['mental health', 'antidepressant', 'antidepressants', 'ssri'],
  dermatology: ['skin', 'dermatology', 'skin care', 'hair', 'hair loss', 'hair growth'],
  diabetes: ['diabetes', 'diabetic', 'blood sugar'],
  'anti parasitic': ['anti parasitic', 'antiparasitic', 'parasite', 'parasites', 'deworming', 'dewormer', 'worms', 'worm'],
  'anti malarial': ['anti malarial', 'antimalarial', 'anti malaria'],
};

export async function listCategories({ catalogue } = {}) {
  const items = catalogue || (await loadCatalogue());
  const counts = new Map();
  for (const medicine of items) {
    const label = String(medicine.category || '').trim();
    if (label) counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

// The category a message is about, if it names one ("show me eye drops").
export async function matchCategory(text, { catalogue } = {}) {
  const message = ` ${normalize(text)} `;
  const categories = await listCategories({ catalogue });

  for (const { label } of categories) {
    const key = normalize(label);
    const phrases = [key, ...(CATEGORY_WORDS[key] || [])];
    if (phrases.some((phrase) => message.includes(` ${phrase} `))) return label;
  }
  return null;
}

export async function medicinesInCategory(label, { limit = MAX_RESULTS, catalogue } = {}) {
  const items = catalogue || (await loadCatalogue());
  return items
    .filter((medicine) => String(medicine.category || '').toLowerCase() === String(label).toLowerCase())
    .sort((a, b) => Number(b.inStock !== false) - Number(a.inStock !== false) || String(a.name).localeCompare(String(b.name)))
    .slice(0, limit);
}

// Other products with the same active ingredient (e.g. other azithromycin
// brands). Matching is on the molecule's first words, never on the strength.
export async function alternativesFor(medicine, { limit = MAX_RESULTS, catalogue } = {}) {
  const molecule = moleculeWords(medicine?.composition)
    .filter((word) => /[a-z]/.test(word) && !GENERIC_NAME_WORDS.has(word) && word.length > 3)
    .slice(0, 2);
  if (!molecule.length) return [];

  const items = catalogue || (await loadCatalogue());
  return items
    .filter((other) => other.slug !== medicine.slug)
    .filter((other) => {
      const otherWords = moleculeWords(other.composition);
      return molecule.every((word) => otherWords.includes(word));
    })
    .slice(0, limit);
}

// --------------------------------------------------------------- descriptions

const priceOf = (medicine) => {
  const price = Number(medicine?.variants?.[0]?.price);
  return Number.isFinite(price) && price > 0 ? price : null;
};

export const formatUsd = (amount) => `$${amount.toFixed(2)}`;

// "$15.28 per strip (Strip of 10 Tablets)" or null when no price is listed.
export function priceLine(medicine) {
  const price = priceOf(medicine);
  if (price === null) return null;
  const variant = medicine.variants?.[0] || {};
  const pack = String(variant.packagingType || '').toLowerCase();
  return `${formatUsd(price)}${pack ? ` per ${pack}` : ''}${variant.packSize ? ` (${variant.packSize})` : ''}`;
}

// Only fields that actually carry a value are returned: a blank manufacturer
// must read as absent, never be filled in with a plausible guess.
export function buildProductInfoLines(medicine) {
  const variant = medicine?.variants?.[0] || {};
  const candidates = [
    ['Category', medicine?.category],
    ['Manufacturer', medicine?.manufacturer],
    ['Composition', medicine?.composition],
    ['Strength', variant.strength],
    ['Form', variant.form],
    ['Pack Size', variant.packSize],
    ['Packaging', variant.packagingType],
    ['Shelf Life', medicine?.shelfLife],
    ['Storage', medicine?.storage],
  ];

  const lines = candidates
    .filter(([, value]) => typeof value === 'string' && value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`);

  const price = priceLine(medicine);
  if (price) lines.push(`Listed price: ${price}`);
  lines.push(`Availability: ${medicine?.inStock === false ? 'Out of Stock' : 'In Stock'}`);
  lines.push(`Prescription Required: ${medicine?.requiresPrescription ? 'Yes' : 'No'}`);

  return lines;
}

export function availabilityLine(medicine) {
  const inStock = medicine?.inStock !== false;
  const variant = medicine?.variants?.[0] || {};

  if (!inStock) {
    return `${shortName(medicine?.name)} is currently marked out of stock in our catalogue. Our team can tell you when it's expected back, or suggest an option with the same composition.`;
  }

  const label = shortName(medicine?.name);
  const strengthNote = variant.strength && !label.includes(variant.strength.replace(/\s+/g, ' ')) ? ` ${variant.strength}` : '';
  return `Yes, ${label}${strengthNote} is listed as in stock. Final availability for your quantity and destination is confirmed by our team in your quote.`;
}

// A compact, model-readable record of a product for the AI assistant.
export function describeForAssistant(medicine) {
  const variant = medicine?.variants?.[0] || {};
  return {
    slug: medicine.slug,
    name: medicine.name,
    category: medicine.category || '',
    manufacturer: medicine.manufacturer || '',
    composition: medicine.composition || '',
    strength: variant.strength || '',
    form: variant.form || '',
    packSize: variant.packSize || '',
    packaging: variant.packagingType || '',
    listedPriceUsd: priceOf(medicine),
    inStock: medicine.inStock !== false,
    prescriptionRequired: Boolean(medicine.requiresPrescription),
    shelfLife: medicine.shelfLife || '',
    storage: medicine.storage || '',
  };
}
