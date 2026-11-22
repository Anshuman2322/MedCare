import { useEffect, useSyncExternalStore } from 'react';

// A module-level store rather than a context provider, so publishing the
// currently-viewed product costs the page one hook call and App.jsx one line.
let currentProduct = null;
const listeners = new Set();

function setProduct(next) {
  currentProduct = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => currentProduct;

export function useChatProduct() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Product pages call this so the assistant knows what the visitor is looking at.
export function usePublishChatProduct(medicine) {
  const slug = medicine?.slug || '';
  const name = medicine?.name || '';

  useEffect(() => {
    if (!slug) return undefined;
    setProduct({ slug, name });
    return () => setProduct(null);
  }, [slug, name]);
}
