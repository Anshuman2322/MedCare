// Deterministic category -> badge color mapping. Hashes the category label
// into a fixed pastel palette so the same category always gets the same
// tint across cards/pages without needing an exhaustive hardcoded map that
// falls out of sync with the real taxonomy (server/scripts/seedCategories.js).
const PALETTE = [
  { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' },
  { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' },
  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
];

export function getCategoryBadgeStyle(category) {
  const label = String(category || '').trim();
  if (!label) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
