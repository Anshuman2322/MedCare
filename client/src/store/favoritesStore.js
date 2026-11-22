import { useSyncExternalStore } from 'react';

// Same storage key the previous per-card wishlist used, so favourites saved
// before this store existed are still there. Only slugs are stored — the
// Favorites page re-reads price and availability from the catalogue so a saved
// item can never show a stale price.
const STORAGE_KEY = 'cureneed_wishlist';

const listeners = new Set();
let slugs = readStorage();

function readStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function commit(next) {
  slugs = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Private browsing / quota — the toggle still works for this page session.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => slugs;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    slugs = readStorage();
    listeners.forEach((listener) => listener());
  });
}

export function toggleFavorite(slug) {
  if (!slug) return false;
  const key = String(slug);
  const isNowFavorite = !slugs.includes(key);
  commit(isNowFavorite ? [...slugs, key] : slugs.filter((item) => item !== key));
  return isNowFavorite;
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useIsFavorite(slug) {
  return useFavorites().includes(String(slug || ''));
}
