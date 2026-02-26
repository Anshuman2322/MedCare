import React, { useEffect, useMemo, useState } from 'react';
import { sendInquiry } from '../services/api';

export default function InquiryModal({
  isOpen,
  onClose,
  medicineName,
  quantity = 1,
  medicineId,
  slug,
  onSuccess,
  onError,
}) {
  const [form, setForm] = useState({ name: '', phone: '', message: '', quantity: quantity || 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({ ...prev, quantity: quantity || 1 }));
      setError('');
    }
  }, [isOpen, quantity]);

  const canSubmit = useMemo(() => form.name.trim() && form.phone.trim(), [form.name, form.phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError('Name and phone are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await sendInquiry({
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        quantity: Number(form.quantity) || quantity || 1,
        medicineName,
        medicineId,
        slug,
      });
      setForm({ name: '', phone: '', message: '', quantity: quantity || 1 });
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg = err?.message || 'Unable to send inquiry right now.';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-wide text-gray-500">Send Inquiry</div>
            <div className="text-lg font-semibold text-gray-900">{medicineName}</div>
            <div className="text-xs text-gray-500">Quantity preset: {quantity}</div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            aria-label="Close inquiry"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Name*</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Phone*</label>
              <input
                type="tel"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Quantity</label>
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Message (optional)</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Any notes"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm ${loading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Sending...
                </span>
              ) : (
                'Send Inquiry'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
