import React from 'react';

export default function Modal({ open, title, description, onClose, onConfirm, confirmLabel = 'Confirm', tone = 'danger' }) {
  if (!open) return null;

  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : 'bg-emerald-600 hover:bg-emerald-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-card border border-emerald-50 p-6">
        <div className="text-lg font-semibold text-slate-900">{title}</div>
        {description && <p className="mt-2 text-sm text-slate-700 leading-relaxed">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-card ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
