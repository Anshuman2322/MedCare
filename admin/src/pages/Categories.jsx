import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';
import Modal from '../components/ui/Modal.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get('/categories');
      setCategories(data || []);
      setError('');
    } catch (err) {
      setError('Unable to load categories.');
    } finally {
      setLoading(false);
    }
  }

  async function createCategory(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await api.post('/categories', { name: name.trim() });
      setCategories((prev) => [...prev, data]);
      setName('');
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Create failed.');
    }
  }

  async function deleteCategory(id) {
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setConfirmId(null);
    } catch (err) {
      setError('Delete failed.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="section-title">Taxonomy</div>
      <h2 className="text-xl font-semibold">Categories</h2>

      <div className="card p-4 space-y-4">
        <form onSubmit={createCategory} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700"
          >
            Add Category
          </button>
        </form>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

        <div className="border-t border-slate-100 pt-3">
          {loading && <div className="text-sm text-slate-500">Loading...</div>}
          {!loading && categories.length === 0 && <div className="text-sm text-slate-500">No categories yet.</div>}
          {!loading && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {categories.map((c) => (
                <li key={c._id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div>
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.slug}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmId(c._id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(confirmId)}
        title="Delete category"
        description="Removing a category will not delete medicines but may leave them uncategorized."
        onClose={() => setConfirmId(null)}
        onConfirm={() => deleteCategory(confirmId)}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
