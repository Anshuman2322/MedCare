import React from 'react';

export default function StepPreferences({ formData, onChange }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div className="text-sm font-semibold text-gray-900">Additional preferences</div>
      <div className="grid grid-cols-1 gap-3">
        <label className="text-xs font-semibold text-gray-700 space-y-1">
          <span>Brand preference (optional)</span>
          <input
            type="text"
            value={formData.brandPreference}
            onChange={(e) => onChange('brandPreference', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="e.g., Prefer Brand X if available"
          />
        </label>
        <label className="text-xs font-semibold text-gray-700 space-y-1">
          <span>Additional notes</span>
          <textarea
            rows={4}
            value={formData.additionalNotes}
            onChange={(e) => onChange('additionalNotes', e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="Share any specific requirements, delivery timing, or instructions"
          />
        </label>
      </div>
    </div>
  );
}
