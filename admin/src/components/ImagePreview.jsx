import React from 'react';

export default function ImagePreview({ files = [], onRemove }) {
  if (!files.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {files.map((f, i) => (
        <div key={i} className="relative">
          <img src={URL.createObjectURL(f)} className="h-28 w-full object-cover rounded border" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
