import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/axios.js';

export default function ManageCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [addWarning, setAddWarning] = useState('');
  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editLabel, setEditLabel] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editWarning, setEditWarning] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      const raw = data?.categories || [];
      const normalized = Array.isArray(raw)
        ? raw.map((c) => (typeof c === 'string' ? c : (c?.label ?? c?.name ?? String(c))))
        : [];
      setCats(normalized);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  const canAdd = useMemo(() => {
    const v = newLabel.trim();
    return v.length > 0 && !cats.includes(v);
  }, [newLabel, cats]);

  async function addCategory() {
    try {
      const label = newLabel.trim();
      if (!label) return;
      const exists = cats.includes(label);
      if (exists) {
        setAddWarning('This category already exists.');
        return;
      }
      await api.post('/categories', { label });
      setAddOpen(false);
      setNewLabel('');
      setAddWarning('');
      setToast({ type: 'success', message: `Added category: ${label}` });
      setTimeout(() => setToast(null), 2000);
      await refresh();
    } catch (e) {
      setAddWarning(e?.response?.data?.error || e.message || 'Failed to add category');
    }
  }

  function startEdit(label) {
    setEditLabel(label);
    setEditValue(label);
    setEditWarning('');
    setEditOpen(true);
  }
  function cancelEdit() {
    setEditOpen(false);
    setEditLabel(null);
    setEditValue('');
    setEditWarning('');
  }
  async function saveEdit() {
    try {
      const oldLabel = editLabel;
      const newLabel = editValue.trim();
      if (!newLabel) return;
      if (oldLabel === newLabel) {
        setEditWarning('No changes detected.');
        return;
      }
      if (cats.includes(newLabel)) {
        setEditWarning('Another category with this name already exists.');
        return;
      }
      await api.put('/categories', { oldLabel, newLabel });
      setToast({ type: 'success', message: `Renamed to: ${newLabel}` });
      setTimeout(() => setToast(null), 2000);
      cancelEdit();
      await refresh();
    } catch (e) {
      setEditWarning(e?.response?.data?.error || e.message || 'Failed to rename');
    }
  }

  async function remove(label) {
    if (!confirm(`Delete category "${label}"?`)) return;
    try {
      await api.delete('/categories', { data: { label } });
      setToast({ type: 'success', message: `Deleted: ${label}` });
      setTimeout(() => setToast(null), 2000);
      await refresh();
    } catch (e) {
      setToast({ type: 'error', message: e?.response?.data?.error || e.message || 'Failed to delete' });
      setTimeout(() => setToast(null), 2500);
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3">Manage Categories</h2>
      {toast && (
        <div className={`mb-3 rounded-md border px-3 py-2 text-sm ${toast.type==='success'?'border-emerald-300 bg-emerald-50 text-emerald-700':'border-red-300 bg-red-50 text-red-700'}`}>{toast.message}</div>
      )}
      {loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setAddOpen(true); setNewLabel(''); setAddWarning(''); }}
              className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            >Add Category</button>
          </div>

          <ul className="space-y-2">
            {cats.map((c) => (
              <li key={typeof c === 'string' ? c : String(c)} className="flex items-center gap-2">
                <>
                  <span className="flex-1">{c}</span>
                  <button className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={() => startEdit(c)}>Rename</button>
                  <button className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => remove(c)}>Delete</button>
                </>
              </li>
            ))}
          </ul>

          {/* Add Modal */}
          {addOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl border shadow-lg w-[90vw] max-w-md p-4">
                <h3 className="text-lg font-semibold">Add Category</h3>
                <p className="text-sm text-slate-600 mt-1">Enter a unique category name.</p>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => { setNewLabel(e.target.value); setAddWarning(''); }}
                  placeholder="e.g., Pain-Relief"
                  className="mt-3 w-full px-3 py-2 rounded-md border border-gray-300"
                />
                {addWarning && (
                  <div className="mt-2 text-sm text-red-600">{addWarning}</div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={() => { setAddOpen(false); setAddWarning(''); }}>Cancel</button>
                  <button className={`px-3 py-2 rounded-md ${canAdd ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} disabled={!canAdd} onClick={addCategory}>Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl border shadow-lg w-[90vw] max-w-md p-4">
                <h3 className="text-lg font-semibold">Rename Category</h3>
                <p className="text-sm text-slate-600 mt-1">Current: <span className="font-medium">{editLabel}</span></p>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => { setEditValue(e.target.value); setEditWarning(''); }}
                  placeholder="New category name"
                  className="mt-3 w-full px-3 py-2 rounded-md border border-gray-300"
                />
                {editWarning && (
                  <div className="mt-2 text-sm text-red-600">{editWarning}</div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={cancelEdit}>Cancel</button>
                  <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={saveEdit}>Save</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
