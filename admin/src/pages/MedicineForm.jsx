import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios.js';
import { slugify } from '../utils/slugify.js';
import ImageUploader from '../components/ImageUploader.jsx';

const makeId = () => Math.random().toString(36).slice(2, 10);
const makeVariant = () => ({
  id: makeId(),
  strength: '',
  form: '',
  packSize: '',
  packagingType: '',
  price: '',
  stock: '',
  sku: '',
});

const initialForm = {
  name: '',
  slug: '',
  category: '',
  manufacturer: '',
  brand: '',
  composition: '',
  usage: '',
  dosage: '',
  precautions: '',
  storage: '',
  requiresPrescription: false,
  shelfLife: '',
  image: '',
  images: [],
  inStock: true,
  description: '',
  metaTitle: '',
  metaDescription: '',
  keywords: '',
  customFields: [],
  variants: [makeVariant()],
};

const customFieldSections = ['Basic Info', 'Medical Info', 'Packaging', 'SEO'];

const sectionIcons = {
  'Basic Info': '💊',
  'Medical Info': '🩺',
  Packaging: '📦',
  Media: '🖼️',
  SEO: '📈',
};

function mapIncomingVariants(data = {}) {
  if (Array.isArray(data.variants) && data.variants.length) {
    return data.variants.map((variant) => ({
      ...makeVariant(),
      ...variant,
      price: variant.price ?? '',
      stock: variant.stock ?? '',
    }));
  }

  return [
    {
      ...makeVariant(),
      strength: data.strength || '',
      form: data.form || '',
      packSize: data.packSize || '',
      packagingType: data.packagingType || '',
      price: data.price ?? '',
      stock: data.stock ?? (data.inStock ? 1 : 0),
      sku: data.sku || '',
    },
  ];
}

const inputClasses = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100';

export default function MedicineForm({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  const pageTitle = isEdit ? 'Edit Medicine' : 'Add Medicine';
  const pageSubtitle = isEdit
    ? 'Update catalog entry with structured sections and live preview.'
    : 'Structured, schema-safe entry with live preview.';

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/medicines/${id}`);
        const incomingCustomFields = Array.isArray(data.customFields)
          ? data.customFields.map((field) => ({ ...field, id: makeId() }))
          : [];
        const incomingVariants = mapIncomingVariants(data);

        setForm({
          ...initialForm,
          ...data,
          images: Array.isArray(data.images) ? data.images : [],
          customFields: incomingCustomFields,
          variants: incomingVariants,
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
      const { data } = await api.get('/api/categories');
      setCategories(data || []);
    } catch (err) {
      // categories are optional fallback
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handleNameChange(value) {
    const nextSlug = userEditedSlug ? form.slug : slugify(value);
    setForm((prev) => ({ ...prev, name: value, slug: nextSlug }));
    setErrors((prev) => ({ ...prev, name: '' }));
  }

  function handleSlugChange(value) {
    setUserEditedSlug(true);
    setForm((prev) => ({ ...prev, slug: slugify(value) }));
    setErrors((prev) => ({ ...prev, slug: '' }));
  }

  function updateImages(nextImages) {
    setForm((prev) => ({
      ...prev,
      images: nextImages,
      image: nextImages?.[0] || '',
    }));
  }

  function addCustomField(section) {
    setForm((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { id: makeId(), section, label: '', value: '' }],
    }));
  }

  function updateCustomField(id, key, value) {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((field) => (field.id === id ? { ...field, [key]: value } : field)),
    }));
  }

  function removeCustomField(id) {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((field) => field.id !== id),
    }));
  }

  function addVariantBlock() {
    setForm((prev) => ({ ...prev, variants: [...(prev.variants || []), makeVariant()] }));
    setErrors((prev) => ({ ...prev, variants: '' }));
  }

  function updateVariant(id, key, value) {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant) => (variant.id === id ? { ...variant, [key]: value } : variant)),
    }));
  }

  function removeVariant(id) {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((variant) => variant.id !== id),
    }));
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    if (!form.category.trim()) nextErrors.category = 'Category is required';
    if (!form.slug.trim()) nextErrors.slug = 'Slug is required';

    const variantsValid = Array.isArray(form.variants) && form.variants.length > 0;
    if (!variantsValid) {
      nextErrors.variants = 'Add at least one variant with price and stock.';
    } else {
      const invalidVariant = form.variants.find(
        (variant) =>
          variant.price === '' || Number.isNaN(Number(variant.price)) || Number(variant.price) < 0 ||
          variant.stock === '' || Number.isNaN(Number(variant.stock)) || Number(variant.stock) < 0
      );
      if (invalidVariant) {
        nextErrors.variants = 'Each variant needs a valid price and stock.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    const customFieldsPayload = form.customFields
      .filter((field) => field.section && (field.label.trim() || field.value.trim()))
      .map((field) => ({ section: field.section, label: field.label.trim(), value: field.value.trim() }));

    const variantsPayload = (form.variants || [])
      .map((variant) => ({
        strength: variant.strength?.trim() || '',
        form: variant.form?.trim() || '',
        packSize: variant.packSize?.trim() || '',
        packagingType: variant.packagingType?.trim() || '',
        price: variant.price === '' ? null : Number(variant.price),
        stock: variant.stock === '' ? null : Number(variant.stock),
        sku: variant.sku?.trim() || '',
      }))
      .filter((variant) => variant.price !== null && !Number.isNaN(variant.price) && variant.stock !== null && !Number.isNaN(variant.stock));

    if (!variantsPayload.length) {
      setErrors((prev) => ({ ...prev, variants: 'At least one variant with price and stock is required.' }));
      setSaving(false);
      return;
    }

    const {
      variants: _variants,
      price: _legacyPrice,
      strength: _legacyStrength,
      form: _legacyForm,
      packSize: _legacyPackSize,
      packagingType: _legacyPackaging,
      ...restForm
    } = form;

    const payload = {
      ...restForm,
      image: form.images?.[0] || form.image || '',
      images: form.images,
      customFields: customFieldsPayload,
      variants: variantsPayload,
    };

    try {
      if (isEdit) {
        await api.put(`/api/medicines/${id}`, payload);
      } else {
        await api.post('/api/medicines', payload);
      }
      navigate('/medicines');
    } catch (err) {
      setError(err?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  const customFieldsBySection = useMemo(() => {
    return customFieldSections.reduce((acc, section) => {
      acc[section] = (form.customFields || []).filter((field) => field.section === section);
      return acc;
    }, {});
  }, [form.customFields]);

  const previewImage = form.image || form.images?.[0] || '';
  const previewDescription = (form.description || form.usage || '').slice(0, 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="section-title">Medicine</div>
          <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-600">{pageSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/medicines')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Update medicine' : 'Create medicine'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

      <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-start">
        <form onSubmit={handleSubmit} className="space-y-4">
          <SectionCard
            title="Basic Info"
            icon={sectionIcons['Basic Info']}
            hint="Core catalog attributes with auto slug."
            action={
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => handleChange('inStock', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                In stock
              </label>
            }
            onAddCustom={() => addCustomField('Basic Info')}
          >
            <div className="grid grid-cols-1 gap-3">
              <Field label="Name" required error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputClasses}
                  placeholder="Azithromycin Tablet"
                />
              </Field>
              <Field label="Slug" required error={errors.slug}>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={inputClasses}
                  placeholder="azithromycin-tablet"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Category" required error={errors.category}>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`${inputClasses} bg-white`}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Manufacturer">
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    className={inputClasses}
                  />
                </Field>
              </div>
              <Field label="Brand">
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className={inputClasses}
                />
              </Field>
              <Field label="Short description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={inputClasses}
                  placeholder="Concise summary for quick preview"
                />
              </Field>
            </div>
            <CustomFields
              section="Basic Info"
              fields={customFieldsBySection['Basic Info']}
              onChange={updateCustomField}
              onRemove={removeCustomField}
            />
          </SectionCard>

          <SectionCard
            title="Variants"
            icon="🔀"
            hint="Add one or more variants with pricing and stock."
            action={
              <button
                type="button"
                onClick={addVariantBlock}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                + Add Variant
              </button>
            }
          >
            {errors.variants && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errors.variants}
              </div>
            )}
            <div className="space-y-4">
              {(form.variants || []).map((variant) => (
                <div
                  key={variant.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3 shadow-inner"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-800">Variant</div>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      disabled={(form.variants || []).length === 1}
                      className="text-xs font-semibold text-rose-600 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Strength">
                      <input
                        type="text"
                        value={variant.strength}
                        onChange={(e) => updateVariant(variant.id, 'strength', e.target.value)}
                        className={inputClasses}
                        placeholder="500mg"
                      />
                    </Field>
                    <Field label="Form">
                      <input
                        type="text"
                        value={variant.form}
                        onChange={(e) => updateVariant(variant.id, 'form', e.target.value)}
                        className={inputClasses}
                        placeholder="Tablet, Syrup, Injection"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Pack Size">
                      <input
                        type="text"
                        value={variant.packSize}
                        onChange={(e) => updateVariant(variant.id, 'packSize', e.target.value)}
                        className={inputClasses}
                        placeholder="1x10"
                      />
                    </Field>
                    <Field label="Packaging Type">
                      <input
                        type="text"
                        value={variant.packagingType}
                        onChange={(e) => updateVariant(variant.id, 'packagingType', e.target.value)}
                        className={inputClasses}
                        placeholder="Blister"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Price" required>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                        className={inputClasses}
                      />
                    </Field>
                    <Field label="Stock" required>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                        className={inputClasses}
                      />
                    </Field>
                    <Field label="SKU (optional)">
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                        className={inputClasses}
                        placeholder="SKU-123"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Medical Info"
            icon={sectionIcons['Medical Info']}
            hint="Clinical usage and safety details."
            onAddCustom={() => addCustomField('Medical Info')}
          >
            <Field label="Composition">
              <input
                type="text"
                value={form.composition}
                onChange={(e) => handleChange('composition', e.target.value)}
                className={inputClasses}
                placeholder="Azithromycin"
              />
            </Field>
            <Field label="Usage">
              <textarea
                rows={2}
                value={form.usage}
                onChange={(e) => handleChange('usage', e.target.value)}
                className={inputClasses}
                placeholder="Indications and guidance"
              />
            </Field>
            <Field label="Dosage">
              <textarea
                rows={2}
                value={form.dosage}
                onChange={(e) => handleChange('dosage', e.target.value)}
                className={inputClasses}
                placeholder="Dosage instructions"
              />
            </Field>
            <Field label="Precautions">
              <textarea
                rows={2}
                value={form.precautions}
                onChange={(e) => handleChange('precautions', e.target.value)}
                className={inputClasses}
                placeholder="Warnings and precautions"
              />
            </Field>
            <Field label="Storage">
              <input
                type="text"
                value={form.storage}
                onChange={(e) => handleChange('storage', e.target.value)}
                className={inputClasses}
                placeholder="Store below 25°C"
              />
            </Field>
            <label className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              <input
                type="checkbox"
                checked={form.requiresPrescription}
                onChange={(e) => handleChange('requiresPrescription', e.target.checked)}
                className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              Requires prescription
            </label>
            <CustomFields
              section="Medical Info"
              fields={customFieldsBySection['Medical Info']}
              onChange={updateCustomField}
              onRemove={removeCustomField}
            />
          </SectionCard>

          <SectionCard
            title="Packaging"
            icon={sectionIcons.Packaging}
            hint="Commercial presentation details."
            onAddCustom={() => addCustomField('Packaging')}
          >
            <Field label="Shelf life">
              <input
                type="text"
                value={form.shelfLife}
                onChange={(e) => handleChange('shelfLife', e.target.value)}
                className={inputClasses}
                placeholder="24 months"
              />
            </Field>
            <CustomFields
              section="Packaging"
              fields={customFieldsBySection.Packaging}
              onChange={updateCustomField}
              onRemove={removeCustomField}
            />
          </SectionCard>

          <SectionCard title="Media" icon={sectionIcons.Media} hint="Primary and gallery media.">
            <ImageUploader images={form.images} onChange={updateImages} />
          </SectionCard>

          <SectionCard
            title="SEO (Optional)"
            icon={sectionIcons.SEO}
            hint="Metadata for search and marketing."
            onAddCustom={() => addCustomField('SEO')}
          >
            <Field label="Meta title">
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                className={inputClasses}
              />
            </Field>
            <Field label="Meta description">
              <textarea
                rows={2}
                value={form.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                className={inputClasses}
              />
            </Field>
            <Field label="Keywords" helper="Comma-separated">
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                className={inputClasses}
                placeholder="antibiotic, infection, azithromycin"
              />
            </Field>
            <CustomFields
              section="SEO"
              fields={customFieldsBySection.SEO}
              onChange={updateCustomField}
              onRemove={removeCustomField}
            />
          </SectionCard>
          <button type="submit" className="sr-only" aria-hidden="true">Submit</button>
        </form>

        <div className="sticky top-6">
          <LivePreview
            form={form}
            previewImage={previewImage}
            previewDescription={previewDescription}
            customFieldsBySection={customFieldsBySection}
          />
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading...</div>}
    </div>
  );
}

function SectionCard({ title, icon, hint, children, action, onAddCustom }) {
  return (
    <div className="card space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-lg">{icon}</span>
            {title}
          </div>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        {(action || onAddCustom) && (
          <div className="flex items-center gap-3 text-xs font-semibold text-emerald-700">
            {action}
            {onAddCustom && (
              <button
                type="button"
                onClick={onAddCustom}
                className="text-sm font-semibold text-emerald-600 hover:underline"
              >
                + Add field
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, helper, error, required, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-800">
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </div>
      {children}
      {helper && <span className="text-xs font-normal text-slate-500">{helper}</span>}
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function CustomFields({ section, fields, onChange, onRemove }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom Fields</p>
      {fields?.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">No custom fields yet.</div>}
      {fields?.map((field) => (
        <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3">
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange(field.id, 'label', e.target.value)}
            className={inputClasses}
            placeholder="Label"
          />
          <input
            type="text"
            value={field.value}
            onChange={(e) => onChange(field.id, 'value', e.target.value)}
            className={inputClasses}
            placeholder="Value"
          />
          <button
            type="button"
            onClick={() => onRemove(field.id)}
            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

function LivePreview({ form, previewImage, previewDescription, customFieldsBySection }) {
  const grouped = useMemo(() => {
    return customFieldSections.reduce((acc, section) => {
      const entries = (customFieldsBySection[section] || [])
        .filter((field) => field.label?.trim() || field.value?.trim())
        .map((field) => ({ label: field.label.trim(), value: field.value.trim() }));
      if (entries.length) acc.push({ section, entries });
      return acc;
    }, []);
  }, [customFieldsBySection]);

  const primaryVariant = (form.variants && form.variants[0]) || {};
  const priceLabel = primaryVariant.price !== '' && !Number.isNaN(Number(primaryVariant.price))
    ? `₹${Number(primaryVariant.price).toFixed(2)}`
    : '₹0.00';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Live Preview</p>
          <h3 className="text-lg font-semibold text-slate-900">Medicine Card</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Real-time</span>
      </div>

      <div className="space-y-4">
        <div className="aspect-square w-full max-h-[240px] rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
          {previewImage ? (
            <img src={previewImage} alt={form.name || 'Preview image'} className="max-h-[200px] w-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <span className="text-3xl">🖼️</span>
              <span className="text-xs">Image preview</span>
            </div>
          )}
        </div>

        {form.images?.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {form.images.slice(0, 6).map((img, idx) => (
              <div key={`${img}-${idx}`} className={`h-14 w-14 overflow-hidden rounded-lg border ${idx === 0 ? 'border-emerald-400' : 'border-slate-200'}`}>
                <img src={img} alt={`thumb-${idx}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">{form.name || 'Medicine name'}</h4>
              <p className="text-xs text-slate-500">{form.manufacturer || 'Manufacturer'}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{form.category || 'Category'}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${form.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {form.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{primaryVariant.form || 'Form'}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{primaryVariant.strength || 'Strength'}</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">{priceLabel}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            <InfoRowCompact label="Manufacturer" value={form.manufacturer} />
            <InfoRowCompact label="Form" value={primaryVariant.form} />
            <InfoRowCompact label="Strength" value={primaryVariant.strength} />
            <InfoRowCompact label="Composition" value={form.composition} />
            <InfoRowCompact label="Pack Size" value={primaryVariant.packSize} />
            <InfoRowCompact label="Packaging" value={primaryVariant.packagingType} />
            <InfoRowCompact label="Shelf Life" value={form.shelfLife} />
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            <p className="font-semibold">Description</p>
            <p className="text-slate-600">{previewDescription || 'Short description will appear here (first 100 characters).'}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <InfoRowBlock label="Usage" value={form.usage} />
            <InfoRowBlock label="Dosage" value={form.dosage} />
          </div>

          {grouped.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom fields</p>
              {grouped.map((group) => (
                <div key={group.section} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-xs font-semibold text-slate-600">{group.section}</p>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-800">
                    {group.entries.map((entry, idx) => (
                      <div key={`${group.section}-${idx}`} className="flex justify-between gap-2">
                        <span className="font-medium">{entry.label}</span>
                        <span className="text-slate-600">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRowCompact({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  );
}

function InfoRowBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  );
}

