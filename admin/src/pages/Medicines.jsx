import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios.js';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { resolveMedicineImageUrl } from '../utils/resolveMedicineImageUrl.js';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFilter = params.get('category');
    if (categoryFilter) {
      setSearch(categoryFilter);
    }
  }, [location.search]);

  async function fetchMedicines() {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/medicines');
      setMedicines(data || []);
      setError('');
    } catch (err) {
      setError('Unable to load medicines.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/api/medicines/${id}`);
      setMedicines((prev) => prev.filter((m) => (m._id || m.id) !== id));
      setConfirmId(null);
    } catch (err) {
      setError('Delete failed.');
    }
  }

  async function setVisibility(id, isPublished) {
    setError('');
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await api.patch(`/api/medicines/${id}/visibility`, { isPublished });
      setMedicines((prev) => prev.map((m) => ((m._id || m.id) === id ? { ...m, isPublished } : m)));
    } catch (err) {
      setError('Could not update website visibility.');
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // Going live is public and immediate, so only that direction asks first.
  function handleVisibilityToggle(med, id) {
    if (med.isPublished === false) {
      setPublishTarget({ id, name: med.name });
    } else {
      setVisibility(id, false);
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return medicines;
    return medicines.filter((m) =>
      [m.name, m.category, m.slug].some((field) => field && field.toLowerCase().includes(term))
    );
  }, [medicines, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="section-title">Catalog</div>
          <h2 className="text-xl font-semibold">Medicines</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchMedicines}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
          <Link
            to="/medicines/add"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700"
          >
            Add Medicine
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <input
            type="search"
            placeholder="Search by name, category, or slug"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <div className="text-sm text-slate-500">
            Showing {filtered.length} of {medicines.length} items
          </div>
        </div>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="pb-3 pr-4">Image</th>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Stock</th>
                <th className="pb-3 pr-4">Website</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">Loading...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">No medicines found.</td>
                </tr>
              )}
              {!loading &&
                filtered.map((med) => {
                  const id = med._id || med.id;
                  const variantPrice = med?.variants?.[0]?.price ?? med.price;
                  const isLive = med.isPublished !== false;
                  return (
                    <tr key={id} className="align-middle">
                      <td className="py-3 pr-4">
                        {med.image ? (
                          <img
                            src={resolveMedicineImageUrl(med.image)}
                            alt={med.name}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">{med.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{med.category || 'Uncategorized'}</td>
                      <td className="py-3 pr-4 text-slate-700">${Number(variantPrice || 0).toFixed(2)}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={med.inStock ? 'success' : 'danger'}>{med.inStock ? 'In stock' : 'Out of stock'}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isLive}
                          aria-label={`Show ${med.name} on website`}
                          disabled={pendingIds.has(id)}
                          onClick={() => handleVisibilityToggle(med, id)}
                          className="inline-flex items-center gap-2 disabled:cursor-wait disabled:opacity-60"
                        >
                          <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${isLive ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                            <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isLive ? 'translate-x-4' : ''}`} />
                          </span>
                          <span className={`text-xs font-semibold ${isLive ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {isLive ? 'Live' : 'Hidden'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/medicines/edit/${id}`)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(id)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(publishTarget)}
        title="Show on website"
        description={`${publishTarget?.name || 'This medicine'} will become visible to everyone on the public website immediately.`}
        onClose={() => setPublishTarget(null)}
        onConfirm={() => {
          setVisibility(publishTarget.id, true);
          setPublishTarget(null);
        }}
        confirmLabel="Show on website"
        tone="success"
      />

      <Modal
        open={Boolean(confirmId)}
        title="Delete medicine"
        description="This action will permanently remove the medicine from the catalog."
        onClose={() => setConfirmId(null)}
        onConfirm={() => handleDelete(confirmId)}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
