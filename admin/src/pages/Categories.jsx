import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoriesWithCount, createCategory as apiCreateCategory, deleteCategory as apiDeleteCategory } from '../api/categoryApi.js';
import Modal from '../components/ui/Modal.jsx';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const { data } = await getCategoriesWithCount();
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
      await apiCreateCategory({ name: name.trim() });
      await load();
      setName('');
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Create failed.');
    }
  }

  async function deleteCategory(id) {
    try {
      await apiDeleteCategory(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      setConfirmId(null);
    } catch (err) {
      setError('Delete failed.');
    }
  }

  const handleCountClick = (categoryName) => {
    if (!categoryName) return;
    navigate(`/medicines?category=${encodeURIComponent(categoryName)}`);
  };

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
          {!loading && categories.length > 0 && (
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Products</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c) => (
                    <tr key={c._id} className="align-middle">
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.slug}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => handleCountClick(c.name)}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            c.productCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {c.productCount ?? 0}
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmId(c._id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
