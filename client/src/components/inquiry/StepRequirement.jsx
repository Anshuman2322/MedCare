import React from 'react';

export default function StepRequirement({
  medicineName,
  strengthOptions = [],
  packSizeOptions = [],
  selectedStrength,
  selectedVariant,
  onStrengthChange,
  onPackSizeChange,
  quantity,
  setQuantity,
}) {
  const summaryLines = [
    selectedVariant?.strength && `Strength: ${selectedVariant.strength}`,
    selectedVariant?.form && `Form: ${selectedVariant.form}`,
    selectedVariant?.packSize && `Pack size: ${selectedVariant.packSize}`,
    selectedVariant?.packagingType && `Packaging: ${selectedVariant.packagingType}`,
    Number.isFinite(selectedVariant?.price) && `Price: ${selectedVariant.price}`,
    Number.isFinite(selectedVariant?.stock) && `Stock: ${selectedVariant.stock}`,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">Confirm requirements</div>
        <p className="text-sm text-gray-600 mb-4">Select the exact variant you need for {medicineName}.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strengthOptions.length > 0 && (
            <label className="text-xs font-semibold text-gray-700 space-y-1">
              <span>Strength</span>
              <select
                value={selectedStrength}
                onChange={(e) => onStrengthChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                {strengthOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          )}

          {packSizeOptions.length > 0 && (
            <label className="text-xs font-semibold text-gray-700 space-y-1">
              <span>Pack Size</span>
              <select
                value={selectedVariant?.packSize || ''}
                onChange={(e) => onPackSizeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                {packSizeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700">Quantity</span>
            <div className="inline-flex items-center overflow-hidden rounded-xl bg-gray-100 shadow-inner">
              <button
                type="button"
                aria-label="Decrease quantity"
                className={`h-10 w-10 text-gray-700 hover:bg-gray-200/60 ${quantity === 1 ? 'text-gray-300 cursor-not-allowed' : ''}`}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity === 1}
              >
                −
              </button>
              <div className="h-10 min-w-12 px-3 inline-flex items-center justify-center text-gray-900 font-medium select-none">
                {quantity}
              </div>
              <button
                type="button"
                aria-label="Increase quantity"
                className="h-10 w-10 text-gray-700 hover:bg-gray-200/60"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
            <div className="font-semibold text-gray-800 mb-1">Selected Variant</div>
            {summaryLines.length ? summaryLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            )) : 'Auto-selected first available variant.'}
          </div>
        </div>
      </div>
    </div>
  );
}
