// Client-only favorites list backed by localStorage. There's no user
// account system for customers (admin-only auth), so this intentionally
// doesn't sync anywhere - it's a real, working per-browser convenience,
// not a decorative element that implies account-level saved items.
const STORAGE_KEY = 'cureneed_wishlist';

function readWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWishlist(slugs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // localStorage unavailable (private browsing, quota) - fail silently,
    // the toggle just won't persist across reloads.
  }
}

export function isWishlisted(slug) {
  if (!slug) return false;
  return readWishlist().includes(slug);
}

export function toggleWishlist(slug) {
  if (!slug) return false;
  const current = readWishlist();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  writeWishlist(next);
  return next.includes(slug);
}
