import React, { useEffect, useMemo, useState } from 'react';
import CategorySelect from './CategorySelect.jsx';
import ImagePreview from './ImagePreview.jsx';
import { slugify } from '../utils/slugify.js';

export default function MedicineForm({ initial = {}, onSubmit, submitLabel = 'Save' }) {
  const [name, setName] = useState(initial.name || '');
  const [id, setId] = useState(initial.id || '');
  const [categories, setCategories] = useState(() => Array.isArray(initial.categories) && initial.categories.length ? initial.categories : (initial.category ? [initial.category] : []));
  const [price, setPrice] = useState(initial.price ?? 0);
  const [form, setForm] = useState(initial.form || 'Tablet');
  const [description, setDescription] = useState(initial.description || '');
  const [manufacturer, setManufacturer] = useState(initial.manufacturer || 'Generic');
  const [composition, setComposition] = useState(() => {
    if (initial.composition) return initial.composition;
    const row = (initial.details || []).find?.(r => r.label === 'Composition');
    return row?.value || '';
  });
  const [strength, setStrength] = useState(() => {
    const row = (initial.details || []).find?.(r => r.label === 'Strength');
    return row?.value || '';
  });
  const [packSize, setPackSize] = useState(() => {
    const row = (initial.details || []).find?.(r => r.label === 'Pack Size');
    return row?.value || '';
  });
  const [packType, setPackType] = useState(() => {
    const row = (initial.details || []).find?.(r => r.label === 'Packaging Type') || (initial.details || []).find?.(r => r.label === 'Pack Type');
    return row?.value || '';
  });
  const [tabletsInStrip, setTabletsInStrip] = useState(() => {
    const row = (initial.details || []).find?.(r => r.label === 'Tablets in a Strip');
    return row?.value || '';
  });
  const [shelfLife, setShelfLife] = useState(() => {
    const row = (initial.details || []).find?.(r => r.label === 'Shelf Life');
    return row?.value || '';
  });
  const [medicineType, setMedicineType] = useState(() => {
    const row = (initial.details || []).find?.(r => r.label === 'Medicine Type');
    return row?.value || '';
  });
  const [storage, setStorage] = useState(() => {
    const row = (initial.details || []).find?.(r => r.label === 'Storage');
    return row?.value || '';
  });
  const [requiresPrescription, setRequiresPrescription] = useState(initial.requiresPrescription ?? true);
  const [inStock, setInStock] = useState(initial.inStock ?? true);
  const [dosage, setDosage] = useState(initial.dosage || '');
  const [usage, setUsage] = useState(initial.usage || '');
  const [details, setDetails] = useState(() => {
    const arr = Array.isArray(initial.details) ? initial.details : [];
    // Remove predefined labels we now manage via dedicated fields
    const predefined = new Set(['Brand Name','Manufacturer','Strength','Composition','Form','Pack Size','Packaging Type','Tablets in a Strip','Shelf Life','Category','Medicine Type','Storage']);
    return arr.filter(r => r && r.label && !predefined.has(r.label));
  });
  const [files, setFiles] = useState([]);

  useEffect(() => setId(slugify(name)), [name]);

  const formData = useMemo(() => {
    const fd = new FormData();
    fd.append('name', name);
    // For backward compatibility, keep single category too
    fd.append('category', categories[0] || '');
    fd.append('categories', JSON.stringify(categories));
    fd.append('price', price);
    fd.append('form', form);
    fd.append('description', description);
    fd.append('manufacturer', manufacturer);
    fd.append('composition', composition);
    fd.append('requiresPrescription', requiresPrescription);
    fd.append('inStock', inStock);
    fd.append('dosage', dosage);
    fd.append('usage', usage);
    // Include custom rows (trimmed), ignore fully empty rows
    const extras = details
      .map((r) => ({ label: String(r?.label || '').trim(), value: String(r?.value ?? '').trim() }))
      .filter((r) => r.label || r.value);
    if (strength) {
      // Ensure single Strength row in extras (backend will merge with predefined)
      const idx = extras.findIndex(r => r.label === 'Strength');
      if (idx >= 0) extras[idx] = { label: 'Strength', value: strength };
      else extras.unshift({ label: 'Strength', value: strength });
    }
    if (composition) {
      const idxC = extras.findIndex(r => r.label === 'Composition');
      if (idxC >= 0) extras[idxC] = { label: 'Composition', value: composition };
      else extras.unshift({ label: 'Composition', value: composition });
    }
    // Add optional predefined fields when provided
    const upsert = (label, value) => {
      if (value == null || value === '') return;
      const i = extras.findIndex(r => r.label === label);
      if (i >= 0) extras[i] = { label, value };
      else extras.push({ label, value });
    };
    upsert('Pack Size', packSize);
    // Map Pack Type input to standardized 'Packaging Type'
    upsert('Packaging Type', packType);
    upsert('Tablets in a Strip', tabletsInStrip);
    upsert('Shelf Life', shelfLife);
    upsert('Medicine Type', medicineType);
    upsert('Storage', storage);
    fd.append('details', JSON.stringify(extras));
    files.forEach((f) => fd.append('images', f));
    return fd;
  }, [name, categories, price, form, description, manufacturer, composition, strength, packSize, packType, tabletsInStrip, shelfLife, medicineType, storage, requiresPrescription, inStock, dosage, usage, details, files]);

  const removeFile = (i) => setFiles((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <form className="bg-white rounded-xl border shadow-sm p-4 grid gap-4" onSubmit={(e) => { 
      e.preventDefault(); 
      // Basic validation: custom rows must have a label if value present
      const invalid = details.some((r) => (String(r?.value ?? '').trim() && !String(r?.label || '').trim()));
      if (invalid) {
        alert('Please provide a label for each custom detail.');
        return;
      }
      onSubmit(formData); 
    }}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Name</label>
          <input className="border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="text-xs text-slate-500">ID: {id || '-'}</div>
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-slate-600">Categories</label>
          <CategorySelect multiple value={categories} onChange={setCategories} />
          <div className="text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</div>
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
        <div className="md:col-span-2 text-sm font-medium text-slate-700">Specifications (Predefined)</div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm text-slate-600 col-span-1">Manufacturer</label>
            <input className="border rounded-md px-3 py-2 col-span-2" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm text-slate-600 col-span-1">Composition</label>
            <input className="border rounded-md px-3 py-2 col-span-2" value={composition} onChange={(e) => setComposition(e.target.value)} placeholder="e.g., Paracetamol 500 mg" />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm text-slate-600 col-span-1">Strength</label>
            <input className="border rounded-md px-3 py-2 col-span-2" value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g., 500 mg" />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm text-slate-600 col-span-1">Requires Prescription</label>
            <div className="col-span-2 inline-flex items-center gap-3">
              <input type="checkbox" checked={requiresPrescription} onChange={(e) => setRequiresPrescription(e.target.checked)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm text-slate-600 col-span-1">In Stock</label>
            <div className="col-span-2 inline-flex items-center gap-3">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
            </div>
          </div>
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

      {/* Additional predefined fields */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="text-sm text-slate-600 col-span-1">Pack Size</label>
          <input className="border rounded-md px-3 py-2 col-span-2" value={packSize} onChange={(e) => setPackSize(e.target.value)} placeholder="e.g., 10x10 tablets" />
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="text-sm text-slate-600 col-span-1">Pack Type</label>
          <input className="border rounded-md px-3 py-2 col-span-2" value={packType} onChange={(e) => setPackType(e.target.value)} placeholder="e.g., Box / Blister" />
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="text-sm text-slate-600 col-span-1">Tablets in a Strip</label>
          <input className="border rounded-md px-3 py-2 col-span-2" value={tabletsInStrip} onChange={(e) => setTabletsInStrip(e.target.value)} placeholder="e.g., 10" />
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="text-sm text-slate-600 col-span-1">Shelf Life</label>
          <input className="border rounded-md px-3 py-2 col-span-2" value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} placeholder="e.g., 24 months" />
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="text-sm text-slate-600 col-span-1">Medicine Type</label>
          <input className="border rounded-md px-3 py-2 col-span-2" value={medicineType} onChange={(e) => setMedicineType(e.target.value)} placeholder="e.g., Allopathic" />
        </div>
        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="text-sm text-slate-600 col-span-1">Storage</label>
          <input className="border rounded-md px-3 py-2 col-span-2" value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="e.g., Store below 25°C" />
        </div>
      </div>

      <div className="md:col-span-2 text-sm font-medium text-slate-700">Dosage & Usage</div>
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
        <div className="text-sm font-medium text-slate-700">Details (Custom rows)</div>
        <div className="grid gap-2">
          {details.map((row, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
              <input className="border rounded-md px-3 py-2 md:col-span-2" placeholder="Label (required)" value={row.label || ''} onChange={(e) => setDetails((d) => d.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} />
              <input className="border rounded-md px-3 py-2 md:col-span-3" placeholder="Value" value={row.value || ''} onChange={(e) => setDetails((d) => d.map((r, idx) => idx === i ? { ...r, value: e.target.value } : r))} />
              <button type="button" className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => setDetails((d) => d.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
        </div>
        <div>
          <button type="button" className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300" onClick={() => setDetails((d) => [...d, { label: '', value: '' }])}>+ Add Row</button>
        </div>
      </div>

      {/* Read-only preview of standardized details for clarity */}
      <div className="grid gap-2">
        <div className="text-sm font-medium text-slate-700">Standardized Details Preview</div>
        <div className="text-xs text-slate-500">These fields are saved automatically and shown across the site.</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-slate-200 rounded-md overflow-hidden">
            <tbody className="divide-y divide-slate-200">
              {[
                ['Brand Name', name || '-'],
                ['Manufacturer', manufacturer || '-'],
                ['Form', form || '-'],
                ['Strength', strength || '-'],
                ['Composition', composition || '-'],
                ['Pack Size', packSize || '-'],
                ['Pack Type', packType || '-'],
                ['Shelf Life', shelfLife || '-'],
                ['Storage', storage || '-'],
                ['Category', categories[0] || '-'],
                ['Medicine Type', medicineType || '-'],
              ].map(([label, value]) => (
                <tr key={label} className="odd:bg-slate-50/50">
                  <th className="text-slate-600 font-medium text-left py-2 px-3 w-48 align-top">{label}</th>
                  <td className="text-slate-800 py-2 px-3">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
