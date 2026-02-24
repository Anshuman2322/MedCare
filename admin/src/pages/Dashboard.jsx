import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        if (mounted) setStats(data);
      } catch (err) {
        setError('Unable to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const recent = stats?.recentMedicines || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Medicines" value={loading ? '...' : stats?.totalMedicines ?? 0} />
        <StatCard title="In Stock" value={loading ? '...' : stats?.inStock ?? 0} accent={!loading ? 'ready to ship' : ''} />
        <StatCard title="Out of Stock" value={loading ? '...' : stats?.outOfStock ?? 0} accent={!loading ? 'restock soon' : ''} />
        <StatCard title="Categories" value={loading ? '...' : stats?.totalCategories ?? 0} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-emerald-700">Recent Medicines</div>
            <p className="text-sm text-slate-600">Last 5 additions or updates</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Refresh
          </button>
        </div>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

        {!error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Price</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">Loading...</td>
                  </tr>
                )}
                {!loading && recent.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500">No medicines yet.</td>
                  </tr>
                )}
                {!loading &&
                  recent.map((item) => (
                    <tr key={item._id || item.slug} className="align-middle">
                      <td className="py-3 pr-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{item.category || '--'}</td>
                      <td className="py-3 pr-4 text-slate-700">Rs. {Number(item.price || 0).toFixed(2)}</td>
                      <td className="py-3 pr-4">
                        <Badge tone={item.inStock ? 'success' : 'danger'}>
                          {item.inStock ? 'In stock' : 'Out of stock'}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
