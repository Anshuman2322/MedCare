import React, { useEffect, useMemo, useState } from 'react';
import { getInquiries, updateInquiryStatus } from '../api/inquiryApi.js';

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
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, sort, searchName, searchEmail]);

  async function load() {
    try {
      setLoading(true);
      const { data } = await getInquiries({
        page,
        limit,
        status,
        sort,
        name: searchName,
        email: searchEmail,
      });
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

  function handleFiltersSubmit(e) {
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

          <form onSubmit={handleFiltersSubmit} className="flex flex-wrap gap-2">
            <input
              type="search"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search name"
              className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            <input
              type="search"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Search email"
              className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
              <thead className="sticky top-0 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <tr className="text-left text-slate-600">
                  <th className="pb-3 pr-4 font-semibold">Ref</th>
                  <th className="pb-3 pr-4 font-semibold">Customer</th>
                  <th className="pb-3 pr-4 font-semibold">City</th>
                  <th className="pb-3 pr-4 font-semibold">Medicine</th>
                  <th className="pb-3 pr-4 font-semibold">Variant</th>
                  <th className="pb-3 pr-4 font-semibold">Qty / Pack</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan="9" className="py-6 text-center text-slate-500">Loading...</td>
                  </tr>
                )}
                {!loading &&
                  items.map((inq) => {
                    const variant = inq.selectedVariant || {};
                    const variantLabel = [variant.strength, variant.brand || inq.brandPreference].filter(Boolean).join(' · ');
                    const packaging = variant.packagingType || '—';
                    const displayName = inq.customerName || `${inq.firstName || ''} ${inq.lastName || ''}`.trim() || '—';
                    return (
                      <tr key={inq._id} className="align-middle hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-semibold text-slate-900">{inq.referenceId || '—'}</td>
                        <td className="py-3 pr-4 text-slate-800">{displayName}</td>
                        <td className="py-3 pr-4 text-slate-700">{inq.city || '—'}</td>
                        <td className="py-3 pr-4 text-slate-800">{inq.medicineName || '—'}</td>
                        <td className="py-3 pr-4 text-slate-700">{variantLabel || '—'}</td>
                        <td className="py-3 pr-4 text-slate-700">{`${inq.quantity || 1} · ${packaging || '—'}`}</td>
                        <td className="py-3 pr-4 space-y-1">
                          <StatusBadge status={inq.status} />
                          <select
                            value={inq.status}
                            onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
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

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Inquiry</div>
                <div className="text-xl font-semibold text-slate-900">{selected.referenceId || 'No reference'}</div>
                <div className="text-sm text-slate-600">{new Date(selected.createdAt).toLocaleString()}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="space-y-4 overflow-y-auto pr-1">
              <Section title="Customer Info">
                <Info label="Name" value={selected.customerName || `${selected.firstName || ''} ${selected.lastName || ''}`.trim()} />
                <Info label="City" value={selected.city || '—'} />
                <Info label="Email" value={selected.email || '—'} />
                <Info label="Phone" value={selected.phone || '—'} />
              </Section>

              <Section title="Product Info">
                <Info label="Medicine" value={selected.medicineName || '—'} />
                <Info label="Strength" value={selected?.selectedVariant?.strength || '—'} />
                <Info label="Brand" value={selected?.selectedVariant?.brand || selected.brandPreference || '—'} />
                <Info label="Quantity" value={selected.quantity || 1} />
                <Info label="Packaging" value={selected?.selectedVariant?.packagingType || '—'} />
              </Section>

              <Section title="Additional Notes">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {selected.additionalNotes || 'No additional notes'}
                </div>
              </Section>

              <Section title="Status">
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
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </Section>
            </div>
          </div>
        )}
      </Drawer>
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

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">{title}</div>
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-800">{children}</div>
    </div>
  );
}

function Drawer({ open, onClose, children }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-slate-100 transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col p-6 gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
