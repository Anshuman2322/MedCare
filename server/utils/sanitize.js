// Escapes user input before it's interpolated into a MongoDB $regex filter,
// preventing ReDoS via crafted patterns and regex metacharacters changing the match semantics.
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
