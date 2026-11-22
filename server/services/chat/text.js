// Text helpers shared by the chat assistant: normalising what a visitor typed,
// tolerating typos, and varying the wording of replies so the assistant doesn't
// repeat itself word for word.

// "400mg" and "400 mg" are the same strength written two ways, and "Tadalista-20"
// is "tadalista 20": split digits from letters and drop punctuation.
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[^a-z0-9%.\s]/g, ' ')
    .replace(/(?<!\d)\.|\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const words = (text) => normalize(text).split(' ').filter(Boolean);

// Words that carry no product meaning, in English and in the Hinglish many
// Indian visitors type ("ibuprofen ka price kya hai").
export const FILLER_WORDS = new Set([
  // English
  'a', 'an', 'the', 'do', 'does', 'did', 'you', 'u', 'ur', 'your', 'have', 'has', 'had', 'got', 'i', 'im', 'me', 'my',
  'we', 'us', 'our', 'is', 'are', 'am', 'was', 'were', 'be', 'want', 'wanted', 'need', 'needed', 'needs', 'looking',
  'look', 'for', 'find', 'search', 'searching', 'show', 'see', 'get', 'buy', 'order', 'ordering', 'purchase', 'please',
  'pls', 'plz', 'any', 'some', 'available', 'availability', 'stock', 'price', 'prices', 'pricing', 'cost', 'costs',
  'rate', 'rates', 'of', 'to', 'in', 'on', 'at', 'about', 'tell', 'info', 'information', 'details', 'detail',
  'medicine', 'medicines', 'medication', 'medications', 'drug', 'drugs', 'product', 'products', 'item', 'items',
  'can', 'could', 'would', 'will', 'shall', 'should', 'there', 'this', 'that', 'it', 'its', 'and', 'or', 'with',
  'hi', 'hello', 'hey', 'what', 'whats', 'which', 'how', 'much', 'many', 'is', 'sell', 'selling', 'carry', 'stocked',
  'know', 'like', 'check', 'also', 'still', 'just', 'now', 'today', 'thanks', 'thank', 'ok', 'okay', 'yes', 'no',
  'send', 'inquiry', 'enquiry', 'quote', 'request', 'per', 'one', 'more', 'than', 'from', 'by', 'if', 'so', 'then',
  // Hinglish
  'kya', 'hai', 'hain', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein', 'mai', 'main', 'mujhe', 'muje', 'hume', 'humko',
  'chahiye', 'chaiye', 'chahie', 'dawa', 'dawai', 'davai', 'dawaai', 'batao', 'bataiye', 'bata', 'do', 'dijiye',
  'kitna', 'kitni', 'kitne', 'milega', 'milegi', 'mil', 'sakta', 'sakti', 'sakte', 'aap', 'ap', 'apke', 'aapke',
  'bhai', 'sir', 'mam', 'madam', 'ji', 'h', 'hai.', 'wala', 'wali', 'wale', 'ye', 'yeh', 'vo', 'woh', 'kaise',
  'kab', 'kaha', 'kahan', 'koi', 'kuch', 'aur', 'or', 'bhi', 'tha', 'thi', 'the', 'ho', 'hoga', 'hogi', 'raha', 'rahi',
]);

// Words that say what the visitor wants to know rather than which product,
// plus country names: kept out of product matching so "shipping cost to Canada
// for Cenforce" still finds Cenforce.
export const INTENT_WORDS = new Set([
  'shipping', 'ship', 'ships', 'shipped', 'delivery', 'deliver', 'delivered', 'courier', 'dispatch', 'charge',
  'charges', 'fee', 'fees', 'alternative', 'alternatives', 'substitute', 'substitutes', 'similar', 'generic',
  'composition', 'ingredient', 'ingredients', 'salt', 'manufacturer', 'company', 'maker', 'status', 'track',
  'tracking', 'payment', 'pay', 'paying', 'prescription', 'rx', 'country', 'countries', 'compare', 'difference',
  'between', 'vs', 'versus', 'best', 'cheap', 'cheaper', 'cheapest', 'discount', 'offer', 'bulk', 'wholesale',
  'minimum', 'quantity', 'qty', 'strips', 'boxes', 'units', 'pieces', 'bottles', 'expiry', 'shelf', 'life',
  'storage', 'store', 'side', 'effects', 'review', 'reviews', 'rating', 'genuine', 'original', 'authentic',
  'usa', 'us', 'america', 'united', 'states', 'uk', 'kingdom', 'england', 'britain', 'canada', 'australia',
  'zealand', 'new', 'india', 'kuwait', 'philippines', 'bangladesh', 'aruba', 'uae', 'dubai', 'germany',
  'france', 'europe', 'singapore', 'malaysia', 'nigeria', 'kenya', 'brazil', 'mexico', 'daam', 'keemat', 'kimat',
  'bhejo', 'bhej', 'bhejte', 'mangwana', 'mangwa', 'kharidna', 'lena', 'lene',
]);

// Words that appear in many product names and can't identify one on their own.
export const GENERIC_NAME_WORDS = new Set([
  'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules', 'cap', 'caps', 'cream', 'gel', 'drops', 'drop', 'eye',
  'oral', 'jelly', 'soft', 'professional', 'super', 'active', 'forte', 'max', 'plus', 'ip', 'bp', 'usp', 'mg', 'ml',
  'gm', 'g', 'w', 'v', 'star', 'hcl', 'hydrochloride', 'citrate', 'sulphate', 'solution', 'infusion', 'chewable',
  'sublingual', 'film', 'coated', 'prolonged', 'release', 'sr', 'er', 'xr', 'ophthalmic', 'proprietary',
  'ayurvedic', 'kairali', 'herbal', 'strip', 'box', 'bottle', 'pack', 'sachet', 'gelatin',
]);

// Damerau-Levenshtein distance (adjacent swaps count as one edit: "ibuporfen").
export function editDistance(a, b) {
  if (a === b) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) => {
    const row = new Array(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j += 1) d[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[rows - 1][cols - 1];
}

// 1 = same word; ~0.8 = one typo in a medium word; 0 = unrelated.
export function wordSimilarity(query, candidate) {
  if (!query || !candidate) return 0;
  if (query === candidate) return 1;
  if (query.length >= 4 && candidate.startsWith(query)) return 0.92;
  if (candidate.length >= 4 && query.startsWith(candidate)) return 0.88;
  if (query.length < 4) return 0;
  const distance = editDistance(query, candidate);
  const allowed = query.length >= 8 ? 2 : 1;
  if (distance > allowed) return 0;
  return 1 - distance / Math.max(query.length, candidate.length);
}

// Picks one of several phrasings, varying with the turn number so consecutive
// replies don't read identically, while staying deterministic for tests.
export function vary(options, seed = 0) {
  if (!Array.isArray(options) || !options.length) return '';
  const index = Math.abs(Number(seed) || 0) % options.length;
  return options[index];
}

export const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';

export const listToSentence = (items) => {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
};
