import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
  }, []);

  async function fetchMedicines() {
    try {
      setLoading(true);
      const { data } = await api.get('/medicines');
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
      await api.delete(`/medicines/${id}`);
      setMedicines((prev) => prev.filter((m) => (m._id || m.id) !== id));
      setConfirmId(null);
    } catch (err) {
      setError('Delete failed.');
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
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">Loading...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">No medicines found.</td>
                </tr>
              )}
              {!loading &&
                filtered.map((med) => {
                  const id = med._id || med.id;
                  return (
                    <tr key={id} className="align-middle">
                      <td className="py-3 pr-4">
                        {med.image ? (
                          <img src={med.image} alt={med.name} className="h-12 w-12 rounded-lg object-cover border border-slate-100" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">{med.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{med.category || 'Uncategorized'}</td>
                      <td className="py-3 pr-4 text-slate-700">${Number(med.price || 0).toFixed(2)}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={med.inStock ? 'success' : 'danger'}>{med.inStock ? 'In stock' : 'Out of stock'}</Badge>
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
