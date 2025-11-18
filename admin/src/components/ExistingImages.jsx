import React from 'react';

export default function ExistingImages({ images = [], onRemove }) {
  if (!images?.length) return null;
  return (
    <div className="grid gap-2">
      <div className="text-sm text-slate-600">Existing Images</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative">
            <img src={url} className="h-28 w-full object-cover rounded border bg-white" />
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
