/** "12 Mar 2026" by default; empty string for a missing or bad date. */
export function formatReviewDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('en-GB', options) : '';
}

/** Up to two initials for an avatar: "Jane D." -> "JD". */
export function initials(name) {
  return String(name || '?')
    .replace(/\./g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
