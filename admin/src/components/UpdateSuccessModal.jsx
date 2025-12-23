import React from 'react';
import { createPortal } from 'react-dom';

export default function UpdateSuccessModal({ item, onBack, onClose }) {
  if (!item) return null;

  const detailsByLabel = new Map((item.details || []).map((r) => [r.label, r.value]));
  const get = (label) => detailsByLabel.get(label) || '';
  const strength = get('Strength');
  const composition = item.composition || get('Composition');
  const packSize = get('Pack Size');
  const packagingType = get('Packaging Type') || get('Pack Type');
  const shelfLife = get('Shelf Life');
  const storage = get('Storage');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl border shadow-xl w-[92vw] max-w-2xl p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-emerald-700">Medicine Updated</h3>
          <button
            className="px-2 py-1 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-3">
          <div className="sm:col-span-1">
            <div className="h-32 bg-slate-100 border rounded flex items-center justify-center overflow-hidden">
              {item.image ? (
                <img src={item.image} alt="" className="h-full object-contain" />
              ) : (
                <span className="text-slate-400 text-sm">No image</span>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">ID: {item.id}</div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-base font-medium">{item.name}</div>
            <div className="text-sm text-slate-600">{Array.isArray(item.categories) && item.categories.length ? item.categories.join(', ') : item.category}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>Form: <span className="text-slate-800">{item.form}</span></div>
              <div>Price: <span className="text-slate-800">${item.price}</span></div>
              {composition ? (<div>Composition: <span className="text-slate-800">{composition}</span></div>) : null}
              {strength ? (<div>Strength: <span className="text-slate-800">{strength}</span></div>) : null}
              {packSize ? (<div>Pack Size: <span className="text-slate-800">{packSize}</span></div>) : null}
              {packagingType ? (<div>Packaging: <span className="text-slate-800">{packagingType}</span></div>) : null}
              {shelfLife ? (<div>Shelf Life: <span className="text-slate-800">{shelfLife}</span></div>) : null}
              {storage ? (<div>Storage: <span className="text-slate-800">{storage}</span></div>) : null}
            </div>
            {item.description && (
              <div className="mt-3">
                <div className="text-sm font-medium text-slate-700">Description</div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={onClose}>Continue Editing</button>
          <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={onBack}>Yes, Update</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
