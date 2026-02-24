import React, { useMemo, useState } from 'react';
import { uploadToCloudinary } from '../utils/uploadImage.js';

const dropAreaClass =
  'flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-sm text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50';

export default function ImageUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState(null);

  async function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError('');

    try {
      const uploaded = [];
      for (const file of fileList) {
        const url = await uploadToCloudinary(file);
        uploaded.push(url);
      }
      const next = [...images, ...uploaded];
      onChange?.(next);
    } catch (err) {
      setError(err?.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e) {
    handleFiles(e.target.files);
    e.target.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function allowDrop(e) {
    e.preventDefault();
  }

  function handleRemove(index) {
    const next = images.filter((_, i) => i !== index);
    onChange?.(next);
  }

  function setMain(index) {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange?.(next);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDropOn(index, e) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    onChange?.(next);
  }

  const mainImage = useMemo(() => images[0] || '', [images]);

  return (
    <div className="space-y-3">
      <div
        className={dropAreaClass}
        onDrop={onDrop}
        onDragOver={allowDrop}
      >
        <p className="font-semibold">Drag & drop or select files</p>
        <p className="text-xs text-emerald-700/80">PNG, JPG up to a few MB. First image becomes the main image.</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <label className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700">
            {uploading ? 'Uploading...' : 'Upload images'}
            <input type="file" accept="image/*" multiple onChange={onInputChange} className="hidden" />
          </label>
          {mainImage && <span className="text-xs font-semibold text-emerald-700">Main: {truncate(mainImage)}</span>}
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm">{error}</div>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={allowDrop}
              onDrop={(e) => handleDropOn(index, e)}
            >
              <div className="aspect-square w-full bg-slate-50">
                <img src={url} alt={`upload-${index}`} className="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-2 py-1 text-xs font-semibold">
                <span className={`rounded-full px-2 py-0.5 ${index === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {index === 0 ? 'Main' : 'Image'}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded bg-white/90 px-2 py-0.5 text-rose-600 shadow-sm opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => setMain(index)}
                  className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm opacity-0 transition group-hover:opacity-100"
                >
                  Set as main
                </button>
              )}
              <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm opacity-0 transition group-hover:opacity-100">
                Drag to reorder
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function truncate(str = '') {
  if (str.length <= 30) return str;
  return `${str.slice(0, 14)}…${str.slice(-10)}`;
}
