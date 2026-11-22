import { useSyncExternalStore } from 'react';

// CureNeed has no customer accounts (auth is admin-only), so the cart lives in
// the browser. Only medicine ids and quantities are ever trusted server-side —
// the snapshot fields here exist purely so the cart can render without
// re-fetching every product.
const STORAGE_KEY = 'cureneed_cart';

const listeners = new Set();
let items = readStorage();

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((line) => line?.lineId && line?.medicineId) : [];
  } catch {
    return [];
  }
}

function commit(next) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private browsing / quota — the cart still works for this page session.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => items;

if (typeof window !== 'undefined') {
  // Keep a second tab's cart in step with this one.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    items = readStorage();
    listeners.forEach((listener) => listener());
  });
}

export function variantSignature(variant = {}) {
  return ['strength', 'form', 'packSize', 'packagingType']
    .map((key) => String(variant?.[key] || '').trim().toLowerCase())
    .join('|');
}

function toLine(medicine, variant, quantity) {
  const resolved = variant || medicine?.variants?.[0] || {};
  const price = Number(resolved.price ?? medicine?.price);
  const slug = medicine?.slug || medicine?._id || medicine?.id;

  return {
    lineId: `${slug}::${variantSignature(resolved)}`,
    medicineId: String(medicine?._id || medicine?.id || ''),
    slug,
    name: medicine?.name || '',
    manufacturer: medicine?.manufacturer || medicine?.brand || '',
    category: medicine?.category || '',
    image: medicine?.image || medicine?.images?.[0] || '',
    requiresPrescription: Boolean(medicine?.requiresPrescription),
    inStock: medicine?.inStock !== false,
    variant: {
      strength: resolved.strength || '',
      form: resolved.form || '',
      packSize: resolved.packSize || '',
      packagingType: resolved.packagingType || '',
      sku: resolved.sku || '',
    },
    listedPrice: Number.isFinite(price) ? price : null,
    quantity: Math.max(1, Math.round(Number(quantity) || 1)),
  };
}

// Re-adding the same medicine/variant tops up the existing line instead of
// stacking duplicate rows; a different variant is a genuinely separate line.
export function addToCart(medicine, { variant, quantity = 1 } = {}) {
  const line = toLine(medicine, variant, quantity);
  if (!line.medicineId || !line.slug) return null;

  const existing = items.find((item) => item.lineId === line.lineId);
  commit(
    existing
      ? items.map((item) =>
          item.lineId === line.lineId ? { ...item, quantity: item.quantity + line.quantity } : item
        )
      : [...items, line]
  );

  return line;
}

export function removeFromCart(lineId) {
  commit(items.filter((item) => item.lineId !== lineId));
}

export function setLineQuantity(lineId, quantity) {
  const next = Math.max(1, Math.round(Number(quantity) || 1));
  commit(items.map((item) => (item.lineId === lineId ? { ...item, quantity: next } : item)));
}

export function clearCart() {
  commit([]);
}

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useCartCount() {
  return useCart().length;
}

export function cartSubtotal(lines) {
  return lines.reduce(
    (total, line) => total + (Number.isFinite(line.listedPrice) ? line.listedPrice * line.quantity : 0),
    0
  );
}
