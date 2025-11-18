import React, { useEffect, useState } from 'react';
import { api } from '../api/axios.js';

export default function ManageMedicines({ onEdit }) {
  const [items, setItems] = useState([]);

  async function load() {
    const { data } = await api.get('/medicines');
    setItems(data);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Delete this medicine?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to delete');
    }
  }

  return (
    <div className="grid gap-4">
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Medicines ({items.length})</h2>
          <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((m) => (
          <div className="bg-white rounded-xl border shadow-sm p-3 grid gap-2" key={m.id}>
            <div className="h-36 bg-slate-100 border rounded flex items-center justify-center overflow-hidden">
              {m.image ? <img src={m.image} alt="" className="h-full object-contain" /> : <span className="text-slate-400">No image</span>}
            </div>
            <div className="font-medium">{m.name}</div>
            <div className="text-sm text-slate-600">{m.category}</div>
            <div className="text-sm">Form: {m.form} · ${m.price}</div>
            <div className="flex gap-2 mt-1">
              <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => onEdit(m.id)}>Edit</button>
              <button className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => remove(m.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
