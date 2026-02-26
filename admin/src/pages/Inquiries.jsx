import React, { useEffect, useState } from 'react';
import { getInquiries } from '../api/inquiryApi.js';
import Badge from '../components/ui/Badge.jsx';

const statusTone = {
  new: 'neutral',
  contacted: 'success',
  closed: 'danger',
};

export default function Inquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const { data } = await getInquiries();
      setItems(data || []);
      setError('');
    } catch (err) {
      setError('Unable to load inquiries.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="section-title">Leads</div>
      <h2 className="text-xl font-semibold">Inquiries</h2>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-600">Track incoming medicine inquiries</div>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Medicine</th>
                <th className="pb-3 pr-4">Phone</th>
                <th className="pb-3 pr-4">Qty</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">Loading...</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">No inquiries yet.</td>
                </tr>
              )}
              {!loading &&
                items.map((inq) => (
                  <tr key={inq._id} className="align-middle">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{inq.customerName}</td>
                    <td className="py-3 pr-4 text-slate-700">{inq.medicineName || '--'}</td>
                    <td className="py-3 pr-4 text-slate-700">{inq.phone}</td>
                    <td className="py-3 pr-4 text-slate-700">{inq.quantity || 1}</td>
                    <td className="py-3 pr-4 text-slate-600">{new Date(inq.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <Badge tone={statusTone[inq.status] || 'neutral'}>{inq.status || 'new'}</Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
