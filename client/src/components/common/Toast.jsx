import React from 'react';
import { Link } from 'react-router-dom';
import { useToasts, dismissToast } from '../../store/toastStore.js';

export default function ToastViewport() {
  const items = useToasts();

  // Nothing to announce and nothing to paint — keep the DOM clean.
  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:left-6 sm:items-start"
      role="status"
      aria-live="polite"
    >
      {items.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg"
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
            aria-hidden="true"
          >
            ✓
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-gray-800">{toast.text}</span>
          {toast.actionTo && (
            <Link
              to={toast.actionTo}
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {toast.actionLabel}
            </Link>
          )}
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
