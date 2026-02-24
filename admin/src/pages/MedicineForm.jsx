import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import { slugify } from '../utils/slugify.js';

const initialForm = {
  name: '',
  slug: '',
  brand: '',
  category: '',
  price: '',
  form: '',
  manufacturer: '',
  strength: '',
  composition: '',
  usage: '',
  dosage: '',
  precautions: '',
  storage: '',
  requiresPrescription: false,
  packSize: '',
  packagingType: '',
  shelfLife: '',
  image: '',
  imagesText: '',
  inStock: true,
  description: '',
};

export default function MedicineForm({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const { data } = await api.get(`/medicines/${id}`);
        setForm({
          ...initialForm,
          ...data,
          imagesText: Array.isArray(data.images) ? data.images.join('\n') : '',
          price: data.price ?? '',
        });
      } catch (err) {
        setError('Unable to load medicine.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  async function loadCategories() {
    try {
      const { data } = await api.get('/categories');
      setCategories(data || []);
    } catch (err) {
      // categories are optional fallback
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(value) {
    const nextSlug = userEditedSlug ? form.slug : slugify(value);
    setForm((prev) => ({ ...prev, name: value, slug: nextSlug }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      price: form.price === '' ? 0 : Number(form.price),
      images: form.imagesText
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit) {
        await api.put(`/medicines/${id}`, payload);
      } else {
        await api.post('/medicines', payload);
      }
      navigate('/medicines');
    } catch (err) {
      setError(err?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="section-title">Medicine</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Basic Info</h2>
            <label className="text-xs font-semibold text-slate-600">
              In stock
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => handleChange('inStock', e.target.checked)}
                className="ml-2 align-middle h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Name
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Slug
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setUserEditedSlug(true);
                  handleChange('slug', slugify(e.target.value));
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Category
                <select
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Form
                <input
                  type="text"
                  value={form.form}
                  onChange={(e) => handleChange('form', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Tablet, Syrup, Injection"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-slate-700">
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Manufacturer
                <input
                  type="text"
                  value={form.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              Brand
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Medical Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Strength
              <input
                type="text"
                value={form.strength}
                onChange={(e) => handleChange('strength', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Composition
              <input
                type="text"
                value={form.composition}
                onChange={(e) => handleChange('composition', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Usage
            <textarea
              value={form.usage}
              onChange={(e) => handleChange('usage', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Dosage
            <textarea
              value={form.dosage}
              onChange={(e) => handleChange('dosage', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Precautions
            <textarea
              value={form.precautions}
              onChange={(e) => handleChange('precautions', e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Storage
            <input
              type="text"
              value={form.storage}
              onChange={(e) => handleChange('storage', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.requiresPrescription}
              onChange={(e) => handleChange('requiresPrescription', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Requires prescription
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Packaging</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Pack size
              <input
                type="text"
                value={form.packSize}
                onChange={(e) => handleChange('packSize', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Packaging type
              <input
                type="text"
                value={form.packagingType}
                onChange={(e) => handleChange('packagingType', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Shelf life
            <input
              type="text"
              value={form.shelfLife}
              onChange={(e) => handleChange('shelfLife', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Media</h2>
          <label className="text-sm font-semibold text-slate-700">
            Primary image URL
            <input
              type="url"
              value={form.image}
              onChange={(e) => handleChange('image', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="https://..."
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Gallery image URLs (one per line)
            <textarea
              rows={4}
              value={form.imagesText}
              onChange={(e) => handleChange('imagesText', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="https://cdn.example.com/image1.webp\nhttps://cdn.example.com/image2.webp"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : isEdit ? 'Update medicine' : 'Create medicine'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/medicines')}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading...</div>}
    </form>
  );
}
