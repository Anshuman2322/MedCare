import React, { useEffect, useMemo, useState } from 'react';
import CategorySelect from './CategorySelect.jsx';
import ImagePreview from './ImagePreview.jsx';
import { slugify } from '../utils/slugify.js';

export default function MedicineForm({ initial = {}, onSubmit, submitLabel = 'Save' }) {
  const [name, setName] = useState(initial.name || '');
  const [id, setId] = useState(initial.id || '');
  const [category, setCategory] = useState(initial.category || '');
  const [price, setPrice] = useState(initial.price ?? 0);
  const [form, setForm] = useState(initial.form || 'Tablet');
  const [description, setDescription] = useState(initial.description || '');
  const [manufacturer, setManufacturer] = useState(initial.manufacturer || 'Generic');
  const [requiresPrescription, setRequiresPrescription] = useState(initial.requiresPrescription ?? true);
  const [inStock, setInStock] = useState(initial.inStock ?? true);
  const [dosage, setDosage] = useState(initial.dosage || '');
  const [usage, setUsage] = useState(initial.usage || '');
  const [details, setDetails] = useState(Array.isArray(initial.details) ? initial.details : []);
  const [files, setFiles] = useState([]);

  useEffect(() => setId(slugify(name)), [name]);

  const formData = useMemo(() => {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('category', category);
    fd.append('price', price);
    fd.append('form', form);
    fd.append('description', description);
    fd.append('manufacturer', manufacturer);
    fd.append('requiresPrescription', requiresPrescription);
    fd.append('inStock', inStock);
    fd.append('dosage', dosage);
    fd.append('usage', usage);
    fd.append('details', JSON.stringify(details));
    files.forEach((f) => fd.append('images', f));
    return fd;
  }, [name, category, price, form, description, manufacturer, requiresPrescription, inStock, dosage, usage, details, files]);

  const removeFile = (i) => setFiles((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <form className="bg-white rounded-xl border shadow-sm p-4 grid gap-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Name</label>
          <input className="border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="text-xs text-slate-500">ID: {id || '-'}</div>
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Category</label>
          <CategorySelect value={category} onChange={setCategory} />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Price</label>
          <input type="number" className="border rounded-md px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Form</label>
          <input className="border rounded-md px-3 py-2" value={form} onChange={(e) => setForm(e.target.value)} />
        </div>
        <div className="grid gap-1 md:col-span-2">
          <label className="text-sm text-slate-600">Description</label>
          <textarea className="border rounded-md px-3 py-2" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Manufacturer</label>
          <input className="border rounded-md px-3 py-2" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
        </div>
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={requiresPrescription} onChange={(e) => setRequiresPrescription(e.target.checked)} />
            Requires Prescription
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
            In Stock
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Dosage</label>
          <textarea className="border rounded-md px-3 py-2" rows="3" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g., 500 mg once daily for 3 days" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Usage</label>
          <textarea className="border rounded-md px-3 py-2" rows="3" value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="e.g., Take with water after meals" />
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-sm text-slate-600">Details (table rows)</div>
        <div className="grid gap-2">
          {details.map((row, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
              <input className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Label (e.g., Strength)" value={row.label || ''} onChange={(e) => setDetails((d) => d.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} />
              <input className="border rounded-md px-3 py-2 md:col-span-3" placeholder="Value (e.g., 500 mg)" value={row.value || ''} onChange={(e) => setDetails((d) => d.map((r, idx) => idx === i ? { ...r, value: e.target.value } : r))} />
              <button type="button" className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => setDetails((d) => d.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
        </div>
        <div>
          <button type="button" className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={() => setDetails((d) => [...d, { label: '', value: '' }])}>+ Add Row</button>
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm text-slate-600">Images (multiple)</label>
        <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        <ImagePreview files={files} onRemove={removeFile} />
      </div>

      <div className="flex justify-end">
        <button className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
