import { useSyncExternalStore } from 'react';

const DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

const listeners = new Set();
let toasts = [];
let nextId = 0;

function commit(next) {
  toasts = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showToast({ text, actionLabel = '', actionTo = '' }) {
  const id = ++nextId;
  commit([...toasts.slice(-(MAX_VISIBLE - 1)), { id, text, actionLabel, actionTo }]);
  window.setTimeout(() => dismissToast(id), DISMISS_MS);
}

export function dismissToast(id) {
  commit(toasts.filter((toast) => toast.id !== id));
}

export function useToasts() {
  return useSyncExternalStore(subscribe, () => toasts, () => toasts);
}
