import React, { useEffect, useMemo, useState } from 'react';
import { getInquiries, updateInquiryStatus } from '../api/inquiryApi.js';
import Modal from '../components/ui/Modal.jsx';

const statusStyles = {
  new: 'bg-blue-50 text-blue-700 border border-blue-100',
  contacted: 'bg-amber-50 text-amber-700 border border-amber-100',
  closed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
};

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Closed', value: 'closed' },
];

function StatusBadge({ status }) {
  const key = (status || 'new').toLowerCase();
  const label = key === 'contacted' ? 'Contacted' : key === 'closed' ? 'Closed' : 'New';
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[key] || statusStyles.new}`}>{label}</span>;
}

export default function Inquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, sort, search]);

  async function load() {
    try {
      setLoading(true);
      const { data } = await getInquiries({ page, limit, status, sort, search });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
      setError('');
    } catch (err) {
      setError('Unable to load inquiries.');
    } finally {
      setLoading(false);
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  async function handleStatusChange(id, nextStatus) {
    setSaving(true);
    try {
      await updateInquiryStatus(id, nextStatus);
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, status: nextStatus } : item)));
      if (selected?._id === id) {
        setSelected((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Status update failed');
    } finally {
      setSaving(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const empty = !loading && items.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="section-title">Leads</div>
          <h2 className="text-xl font-semibold">Inquiries</h2>
          <p className="text-sm text-slate-600">Manage inbound medicine requests with status tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => {
                  setStatus(opt.value);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
                  status === opt.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Apply
            </button>
          </form>
        </div>

        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

        {empty && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl">📭</div>
            <p className="mt-4 text-sm font-semibold">No inquiries yet</p>
            <p className="text-xs text-slate-500">Inbound leads will appear here once customers submit inquiries.</p>
          </div>
        )}

        {!empty && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="pb-3 pr-4">Ref</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">Medicine</th>
                  <th className="pb-3 pr-4">Variant</th>
                  <th className="pb-3 pr-4">State</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Created</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan="10" className="py-6 text-center text-slate-500">Loading...</td>
                  </tr>
                )}
                {!loading &&
                  items.map((inq) => {
                    const variant = inq.selectedVariant || {};
                    const variantLabel = [variant.strength, variant.form, variant.packSize].filter(Boolean).join(' · ');
                    return (
                      <tr key={inq._id} className="align-middle">
                        <td className="py-3 pr-4 font-semibold text-slate-900">{inq.referenceId || '—'}</td>
                        <td className="py-3 pr-4 text-slate-800">{inq.customerName || `${inq.firstName || ''} ${inq.lastName || ''}`.trim()}</td>
                        <td className="py-3 pr-4 text-slate-700">{inq.email || '—'}</td>
                        <td className="py-3 pr-4 text-slate-700">{inq.phone || '—'}</td>
                        <td className="py-3 pr-4 text-slate-800">{inq.medicineName || '—'}</td>
                        <td className="py-3 pr-4 text-slate-700">{variantLabel || '—'}</td>
                        <td className="py-3 pr-4 text-slate-700">{inq.state || '—'}</td>
                        <td className="py-3 pr-4"><StatusBadge status={inq.status} /></td>
                        <td className="py-3 pr-4 text-slate-600">{new Date(inq.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => setSelected(inq)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        {!empty && totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 text-sm text-slate-600">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected ? `Inquiry ${selected.referenceId || ''}` : ''}
        description="Review details and update status"
        onClose={() => setSelected(null)}
        footer={null}
      >
        {selected && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Customer" value={selected.customerName || `${selected.firstName || ''} ${selected.lastName || ''}`.trim()} />
              <Info label="Email" value={selected.email || '—'} />
              <Info label="Phone" value={selected.phone || '—'} />
              <Info label="State" value={selected.state || '—'} />
              <Info label="Medicine" value={selected.medicineName || '—'} />
              <Info label="Variant" value={[selected?.selectedVariant?.strength, selected?.selectedVariant?.form, selected?.selectedVariant?.packSize].filter(Boolean).join(' · ') || '—'} />
              <Info label="Quantity" value={selected.quantity || 1} />
              <Info label="Reference" value={selected.referenceId || '—'} />
            </div>
            <Info label="Message" value={selected.message || 'No message provided'} />

            <div className="flex items-center gap-2">
              <select
                value={selected.status}
                onChange={(e) => setSelected((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleStatusChange(selected._id, selected.status)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save status'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value || '—'}</div>
    </div>
  );
}
