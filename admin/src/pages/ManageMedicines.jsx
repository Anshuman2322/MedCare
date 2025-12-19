import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/axios.js';

export default function ManageMedicines({
  onEdit,
  onReady,
  showDeleted: showDeletedProp,
  onToggleDeleted,
  onDeletedCountChange,
}) {
  const [items, setItems] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const [internalShowDeleted, setInternalShowDeleted] = useState(false);
  const [binCount, setBinCount] = useState(0);
  const showDeleted =
    typeof showDeletedProp === 'boolean' ? showDeletedProp : internalShowDeleted;

  const applyDeletedCount = useCallback((count) => {
    setBinCount(count);
    onDeletedCountChange?.(count);
  }, [onDeletedCountChange]);

  const refreshDeletedCount = useCallback(async () => {
    try {
      const { data } = await api.get('/medicines?deleted=true');
      applyDeletedCount(data?.length || 0);
    } catch {
      applyDeletedCount(0);
    }
  }, [applyDeletedCount]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/medicines${showDeleted ? '?deleted=true' : ''}`);
      setItems(data);
      if (showDeleted) {
        applyDeletedCount(data?.length || 0);
      } else {
        await refreshDeletedCount();
      }
      // Notify parent that list is ready for scroll restoration
      setTimeout(() => onReady?.(), 0);
    } catch (error) {
      console.error('Failed to load medicines', error);
    }
  }, [showDeleted, onReady, applyDeletedCount, refreshDeletedCount]);

  const setShowDeletedValue = (next) => {
    if (typeof onToggleDeleted === 'function') {
      onToggleDeleted(next);
    } else {
      setInternalShowDeleted(next);
    }
  };
  const toggleShowDeleted = () => setShowDeletedValue(!showDeleted);

  useEffect(() => { load(); }, [load]);

  async function removeConfirmed() {
    if (!confirmId) return;
    try {
      await api.delete(`/medicines/${confirmId}`);
      setConfirmId(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to delete');
    }
  }
  async function restore(id) {
    try {
      await api.put(`/medicines/${id}/restore`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to restore');
    }
  }

  return (
    <div className="grid gap-4">
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{showDeleted ? 'Recycle Bin' : 'Medicines'} ({items.length})</h2>
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 rounded-md flex items-center gap-2 transition-colors ${
                showDeleted 
                  ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              onClick={toggleShowDeleted}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill={showDeleted ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916C15.75 3.32 14.48 2.25 12.75 2.25S9.75 3.32 9.75 3.874v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <span>{showDeleted ? 'Show Active' : 'Recycle Bin'}</span>
              {binCount > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  showDeleted 
                    ? 'bg-red-200 text-red-800'
                    : 'bg-slate-300 text-slate-700'
                }`}>
                  {binCount > 99 ? '99+' : binCount}
                </span>
              )}
            </button>
            <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={load}>Refresh</button>
          </div>
        </div>
      </div>

      {showDeleted && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex gap-3 items-start">
          <div className="mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Items stay in the Recycle Bin for 7 days.</p>
            <p className="text-sm">After 7 days they will be automatically and permanently deleted.</p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && showDeleted ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            <div className="text-lg">Recycle Bin is empty</div>
            <div className="text-sm mt-1">No deleted medicines to restore.</div>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            <div className="text-lg">No medicines found</div>
            <div className="text-sm mt-1">Add a new medicine to get started.</div>
          </div>
        ) : items.map((m) => (
          <div className="bg-white rounded-xl border shadow-sm p-3 grid gap-2" key={m.id}>
            <div className="h-36 bg-slate-100 border rounded flex items-center justify-center overflow-hidden">
              {m.image ? <img src={m.image} alt="" className="h-full object-contain" /> : <span className="text-slate-400">No image</span>}
            </div>
            <div className="font-medium">{m.name}</div>
            <div className="text-sm text-slate-600">{m.category}</div>
            <div className="text-sm">Form: {m.form} · ${m.price}</div>
            {showDeleted && m.deletedAt && (
              <div className="text-xs text-red-500">Deleted: {new Date(m.deletedAt).toLocaleDateString()}</div>
            )}
            <div className="flex gap-2 mt-1">
              {!showDeleted ? (
                <>
                  <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => onEdit(m.id)}>Edit</button>
                  <button className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => setConfirmId(m.id)}>Delete</button>
                </>
              ) : (
                <>
                  <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => restore(m.id)}>Restore</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {confirmId && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border shadow-lg w-[90vw] max-w-md p-4">
            <h3 className="text-lg font-semibold text-red-600">Delete Medicine</h3>
            <p className="mt-2 text-sm text-slate-700">Are you sure you want to delete this medicine? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={removeConfirmed}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
