import React, { useEffect, useState } from 'react';
import { getContactMessages, markContactMessageRead } from '../api/contactApi.js';

export default function Messages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const { data } = await getContactMessages({ limit: 50 });
      setItems(data?.items || []);
      setError('');
    } catch (err) {
      setError('Unable to load messages.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen(item) {
    setSelected(item);
    if (item.status === 'new') {
      try {
        await markContactMessageRead(item._id);
        setItems((prev) => prev.map((m) => (m._id === item._id ? { ...m, status: 'read' } : m)));
      } catch (err) {
        // non-critical — leave status as-is if this fails
      }
    }
  }

  const empty = !loading && items.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="section-title">Contact Us</div>
          <h2 className="text-xl font-semibold">Messages</h2>
          <p className="text-sm text-slate-600">Messages submitted through the site's Contact page.</p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="card p-4 space-y-4">
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

        {empty && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl">✉️</div>
            <p className="mt-4 text-sm font-semibold">No messages yet</p>
            <p className="text-xs text-slate-500">Submissions from the Contact page will appear here.</p>
          </div>
        )}

        {!empty && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Email</th>
                  <th className="pb-3 pr-4 font-semibold">Message</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">Loading...</td>
                  </tr>
                )}
                {!loading &&
                  items.map((m) => (
                    <tr key={m._id} className="align-middle hover:bg-slate-50/50">
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            m.status === 'new'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {m.status === 'new' ? 'New' : 'Read'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-800">{m.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{m.email}</td>
                      <td className="py-3 pr-4 text-slate-700 max-w-xs truncate">{m.message}</td>
                      <td className="py-3 pr-4 text-slate-600">{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleOpen(m)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelected(null)} />
          <div className="absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-slate-100">
            <div className="h-full flex flex-col p-6 gap-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="h-10 w-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-slate-500 font-semibold">Message</div>
                  <div className="text-xl font-semibold text-slate-900">{selected.name}</div>
                  <div className="text-sm text-slate-600">{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Email</div>
                  <div className="text-sm font-semibold text-slate-900">{selected.email}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Message</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
