import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MedicineCard from '../components/MedicineCard';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';
import InquiryModal from '../components/InquiryModal.jsx';

export default function MedicineDetails() {
  const { slug } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [selectedStrength, setSelectedStrength] = useState('');
  const [filteredVariants, setFilteredVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [tab, setTab] = useState('Dosage');
  const [showInquiry, setShowInquiry] = useState(false);
  const { currency } = useCurrency();

  const [imageRef, imageVisible] = useScrollAnimation(0.1, 80);
  const [contentRef, contentVisible] = useScrollAnimation(0.1, 140);
  const [tabsRef, tabsVisible] = useScrollAnimation(0.1, 200);
  const [relatedRef, relatedVisible] = useScrollAnimation(0.1, 260);
  const sliderRef = useRef(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const CATEGORY_DESCRIPTIONS = {
    'Antibiotics': '',
    'Pain Relief': 'Fast-acting analgesics for headaches, muscle aches and minor pains. Use the lowest effective dose.',
    'Vitamins': 'Daily nutritional support to maintain general health and wellness.',
    'Skincare': 'Dermatologically inspired products to protect, soothe and nourish your skin.',
    'Hormones & Steroids': 'Specialized hormone modulators and steroid therapies. Use only under medical supervision.',
    'Anti Cancer': 'Targeted oncology treatments. Handling and dosing must follow professional guidance.',
    'Anti Viral': 'Medicines formulated to combat viral infections. Complete prescribed regimens.',
    'Anti Malarial': 'Therapies for prevention and treatment of malaria. Follow regional guidelines.',
    'Injections': 'Sterile injectable formulations. Administration should be performed by qualified personnel.',
    'Skin / Allergy / Asthma': 'Products addressing dermatologic, allergic and respiratory conditions.',
    'Supplements & Hair': 'Supportive supplements for general well-being and hair health.',
    'Chronic / Cardiac': 'Long-term therapies supporting cardiovascular and chronic condition management.',
    'Erectile Dysfunction': 'Prescription medications for erectile dysfunction. Consult healthcare provider for proper dosing and contraindications.',
    'Antidepressant / Anti-Anxiety': 'Mental health medications for depression and anxiety disorders. Regular monitoring and gradual dosing changes required.',
    'Sleep Disorders': 'Medications for insomnia and sleep disturbances. Use as directed and avoid long-term dependency.',
    'Gastrointestinal': 'Treatments for digestive issues and gastrointestinal disorders. Take as prescribed with appropriate dietary considerations.',
    'Uncategorized': ''
  };

  const categoriesList = useMemo(() => {
    if (!medicine) return ['Uncategorized'];
    return Array.isArray(medicine.categories) && medicine.categories.length
      ? medicine.categories
      : [medicine.category].filter(Boolean);
  }, [medicine]);

  const primaryCategory = categoriesList[0] || 'Uncategorized';

  const categoryDescription = useMemo(() => {
    if (!medicine) return '';
    return CATEGORY_DESCRIPTIONS[primaryCategory] || CATEGORY_DESCRIPTIONS.Uncategorized;
  }, [medicine, primaryCategory]);

  const variants = useMemo(() => {
    const normalizeVariant = (v = {}) => ({
      ...v,
      strength: v.strength || '',
      form: v.form || '',
      packSize: v.packSize || '',
      packagingType: v.packagingType || '',
      price: v.price ?? null,
      sku: v.sku || v.SKU || '',
      stock: v.stock ?? (v.inStock ? 1 : null),
    });

    if (Array.isArray(medicine?.variants) && medicine.variants.length) {
      return medicine.variants.map(normalizeVariant);
    }
    if (!medicine) return [];
    const legacyVariant = normalizeVariant({
      strength: medicine.strength || '',
      form: medicine.form || '',
      packSize: medicine.packSize || '',
      packagingType: medicine.packagingType || '',
      price: medicine.price ?? undefined,
      stock: medicine.inStock ? 1 : 0,
      sku: medicine.sku || '',
    });
    const hasLegacy = Object.values(legacyVariant).some((value) => value !== '' && value !== undefined && value !== null);
    return hasLegacy ? [legacyVariant] : [];
  }, [medicine]);

  const strengthOptions = useMemo(
    () => Array.from(new Set((variants || []).map((v) => (v?.strength || '').trim()).filter(Boolean))),
    [variants]
  );

  const packSizeOptions = useMemo(
    () => Array.from(new Set((filteredVariants || []).map((v) => (v?.packSize || '').trim()).filter(Boolean))),
    [filteredVariants]
  );

  useEffect(() => {
    if (!variants.length) {
      setSelectedStrength('');
      setFilteredVariants([]);
      setSelectedVariant(null);
      return;
    }

    setSelectedStrength((prev) => {
      if (prev && strengthOptions.includes(prev)) return prev;
      return strengthOptions[0] || variants[0].strength || '';
    });
  }, [variants, strengthOptions]);

  useEffect(() => {
    if (!variants.length) {
      setFilteredVariants([]);
      setSelectedVariant(null);
      return;
    }

    const filtered = selectedStrength
      ? variants.filter((v) => v.strength === selectedStrength)
      : variants;
    setFilteredVariants(filtered);
    setSelectedVariant(filtered[0] || null);
  }, [selectedStrength, variants]);

  const handlePackSizeChange = (packSize) => {
    if (!filteredVariants.length) return;
    const variant = filteredVariants.find((v) => v.packSize === packSize);
    setSelectedVariant(variant || filteredVariants[0] || null);
  };

  const images = useMemo(() => {
    const arr = [];
    if (medicine?.image) arr.push(medicine.image);
    if (Array.isArray(medicine?.images)) arr.push(...medicine.images.filter(Boolean));
    return Array.from(new Set(arr)).filter(Boolean);
  }, [medicine]);

  const mainImage = images[imgIndex] || '';

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`http://localhost:5002/api/medicines/${slug}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load medicine');
        const med = await res.json();
        if (!active) return;
        setMedicine(med);
        setImgIndex(0);

        const relRes = await fetch(`http://localhost:5002/api/medicines?category=${encodeURIComponent(med?.category || '')}`, { cache: 'no-store' });
        if (relRes.ok) {
          const rel = await relRes.json();
          if (active) setRelated(Array.isArray(rel) ? rel.filter(r => (r.slug || r._id) !== (med.slug || med._id)) : []);
        }
      } catch (err) {
        console.error('Failed to load medicine', err);
        if (active) setError('Unable to load medicine details right now.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const el = sliderRef.current;
    const update = () => {
      if (!el) return;
      const atStart = el.scrollLeft <= 0;
      const atEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth;
      setShowPrev(!atStart);
      setShowNext(!atEnd);
    };
    update();
    if (!el) return undefined;
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [related]);

  const scrollBy = (dir) => {
    const el = sliderRef.current;
    if (!el) return;
    const delta = dir === 'next' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const prevImage = () => {
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setImgIndex((i) => (i + 1) % images.length);
  };

  const openInquiry = () => setShowInquiry(true);
  const closeInquiry = () => setShowInquiry(false);

  const resolvedPrice = selectedVariant?.price ?? null;
  const priceLabel = resolvedPrice !== null && resolvedPrice !== undefined ? formatPrice(resolvedPrice, currency) : 'Price on request';
  const variantStockValue = Number.isFinite(Number(selectedVariant?.stock)) ? Number(selectedVariant?.stock) : null;
  const available = variantStockValue !== null ? variantStockValue > 0 : Boolean(medicine?.inStock);
  const showVariantSelectors = variants.length > 1 && (strengthOptions.length || packSizeOptions.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Loading medicine details...
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-700 mb-4">{error || 'Medicine not found.'}</p>
        <Link to="/shop" className="text-emerald-600 font-semibold hover:underline">Back to shop</Link>
      </div>
    );
  }

  if (!variants.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <p className="text-gray-700 mb-4">No variants available for this medicine.</p>
        <Link to="/shop" className="text-emerald-600 font-semibold hover:underline">Back to shop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-8 lg:p-10 space-y-10">
          <Link to="/shop" className="inline-flex items-center text-sm text-emerald-700 hover:text-emerald-900">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            Back to Medicines
          </Link>

          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="lg:w-[420px]" ref={imageRef}>
              <div className={`rounded-2xl bg-white p-5 relative shadow-md border border-gray-100 ${animationClasses.fadeLeft(imageVisible)}`}>
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={medicine?.name || ''}
                    className="w-full h-auto object-contain rounded-xl bg-gray-50"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-400 text-center py-12">No image</div>
                )}

                {images.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
                    <button
                      type="button"
                      onClick={prevImage}
                      aria-label="Previous image"
                      className="h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex items-center justify-center hover:bg-white"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Next image"
                      className="h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex items-center justify-center hover:bg-white"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-3 overflow-x-auto -mx-1 px-1">
                  <div className="flex gap-3">
                    {images.map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        onClick={() => setImgIndex(i)}
                        className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden transition-all duration-150 shadow-sm ${
                          i === imgIndex
                            ? 'ring-2 ring-emerald-500 border border-emerald-200'
                            : 'border border-gray-100 hover:border-emerald-200'
                        }`}
                        aria-label={`Show image ${i + 1}`}
                      >
                        <img src={src} alt={`thumb ${i + 1}`} className="h-full w-full object-cover bg-white" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={contentRef} className={`flex-1 space-y-5 ${animationClasses.fadeRight(contentVisible)}`}>
              <div className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1 self-start">{primaryCategory}</div>

              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold text-gray-900 leading-tight">{medicine?.name}</h1>
                <div className="rounded-xl bg-gray-50 p-5">
                  <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Overview</div>
                  <p className="text-gray-800 leading-7">{medicine?.description}</p>
                </div>
                <div className="text-2xl font-semibold text-emerald-700" key={`price-${currency}`}>
                  {priceLabel}
                </div>
                <div className="text-sm text-gray-600">Stock: {selectedVariant?.stock ?? 'N/A'}</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 pt-6 text-sm">
                {medicine?.manufacturer && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Manufacturer</div>
                    <div className="text-sm font-semibold text-gray-900">{medicine?.manufacturer}</div>
                  </div>
                )}
                {(selectedVariant?.form || medicine?.form) && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Form</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedVariant?.form || medicine?.form}</div>
                  </div>
                )}
                {(selectedVariant?.strength || medicine?.strength) && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Strength</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedVariant?.strength || medicine?.strength}</div>
                  </div>
                )}
                {(selectedVariant?.packSize || medicine?.packSize) && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Pack Size</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedVariant?.packSize || medicine?.packSize}</div>
                  </div>
                )}
                {(medicine?.composition || (Array.isArray(medicine?.details) ? (medicine?.details.find?.((r) => r.label === 'Composition')?.value || '') : '')) && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Composition</div>
                    <div className="text-sm font-semibold text-gray-900">{medicine?.composition || (Array.isArray(medicine?.details) ? (medicine?.details.find?.((r) => r.label === 'Composition')?.value || '') : '')}</div>
                  </div>
                )}
                {(selectedVariant?.packagingType || medicine?.packagingType) && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Packaging Type</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedVariant?.packagingType || medicine?.packagingType}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Availability</div>
                  <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                    {available ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
              </div>

              {showVariantSelectors && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Choose Variant</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {strengthOptions.length > 0 && (
                      <label className="text-xs font-semibold text-gray-700 space-y-1">
                        <span>Strength</span>
                        <select
                          value={selectedStrength}
                          onChange={(e) => setSelectedStrength(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        >
                          {strengthOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {packSizeOptions.length > 0 && (
                      <label className="text-xs font-semibold text-gray-700 space-y-1">
                        <span>Pack Size</span>
                        <select
                          value={selectedVariant?.packSize || ''}
                          onChange={(e) => handlePackSizeChange(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        >
                          {packSizeOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 flex-wrap">
                <div className="inline-flex items-center overflow-hidden rounded-xl bg-gray-100 shadow-inner">
                  <button
                    aria-label="Decrease quantity"
                    className={`h-11 w-10 text-gray-700 hover:bg-gray-200/60 ${qty === 1 ? 'text-gray-300 cursor-not-allowed' : ''}`}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty === 1}
                  >
                    −
                  </button>
                  <div className="h-11 min-w-11 px-3 inline-flex items-center justify-center text-gray-900 font-medium select-none">
                    {qty}
                  </div>
                  <button
                    aria-label="Increase quantity"
                    className="h-11 w-10 text-gray-700 hover:bg-gray-200/60"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openInquiry}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-emerald-600 text-white text-base font-medium shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>

        <div ref={tabsRef} className={`mt-2 ${animationClasses.fadeUp(tabsVisible)}`}>
          <div className="inline-flex rounded-lg bg-gray-100 p-1 gap-2">
            {['Dosage', 'Usage', 'Details'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white shadow text-emerald-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-6 text-gray-700">
            {tab === 'Dosage' && (
              <div className="rounded-xl bg-gray-50 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded bg-emerald-500"></div>
                  <div className="text-lg font-semibold text-gray-900">Recommended Dosage</div>
                </div>
                <div className="text-sm leading-7 text-gray-800 whitespace-pre-line">
                  {medicine?.dosage || 'Information will be available soon.'}
                </div>
              </div>
            )}
            {tab === 'Usage' && (
              <div className="rounded-xl bg-gray-50 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded bg-sky-500"></div>
                  <div className="text-lg font-semibold text-gray-900">Usage Guidelines</div>
                </div>
                <div className="text-sm leading-7 text-gray-800 whitespace-pre-line">
                  {medicine?.usage || 'Information will be available soon.'}
                </div>
              </div>
            )}
            {tab === 'Details' && (
              (() => {
                const hasValue = (v) => {
                  if (typeof v === 'string') return v.trim().length > 0;
                  return v !== undefined && v !== null;
                };

                const strengthValue = selectedVariant?.strength || medicine?.strength;
                const formValue = selectedVariant?.form || medicine?.form;
                const packSizeValue = selectedVariant?.packSize || medicine?.packSize;
                const packagingValue = selectedVariant?.packagingType || medicine?.packagingType;

                const sections = [
                  {
                    title: 'Basic Info',
                    accent: 'bg-emerald-500',
                    rows: [
                      { label: 'Brand Name', value: medicine?.name },
                      { label: 'Composition', value: medicine?.composition },
                      { label: 'Strength', value: strengthValue },
                      { label: 'Form', value: formValue },
                      { label: 'Category / Treatment', value: medicine?.category },
                    ],
                  },
                  {
                    title: 'Manufacturing',
                    accent: 'bg-sky-500',
                    rows: [
                      { label: 'Manufacturer', value: medicine?.manufacturer },
                      { label: 'Pack Size', value: packSizeValue },
                      { label: 'Packaging Type', value: packagingValue },
                      { label: 'Shelf Life', value: medicine?.shelfLife },
                    ],
                  },
                  {
                    title: 'Medical Info',
                    accent: 'bg-purple-500',
                    rows: [
                      { label: 'Usage', value: medicine?.usage },
                      { label: 'Dosage', value: medicine?.dosage },
                      { label: 'Storage', value: medicine?.storage },
                      { label: 'Precautions', value: medicine?.precautions },
                      {
                        label: 'Prescription Required',
                        value: medicine?.requiresPrescription !== undefined && medicine?.requiresPrescription !== null
                          ? (medicine?.requiresPrescription ? 'Yes' : 'No')
                          : '',
                      },
                    ],
                  },
                ];

                const rows = [];
                sections.forEach((section) => {
                  const items = section.rows.filter((r) => hasValue(r.value));
                  if (items.length === 0) return;
                  rows.push({ label: section.title, value: '', isSection: true });
                  rows.push(...items);
                });

                return rows.length > 0 ? (
                  <div className="space-y-8">
                    {sections.map((section, sectionIndex) => {
                      const items = section.rows.filter((r) => hasValue(r.value));
                      if (!items.length) return null;

                      return (
                        <div key={`${section.title}-${sectionIndex}`} className="rounded-xl bg-gray-50 p-6 space-y-2 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-1 h-5 rounded ${section.accent}`}></div>
                            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {items.map((row, idx) => (
                              <div
                                key={`${row.label}-${idx}`}
                                className="grid grid-cols-1 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] gap-3 py-3"
                              >
                                <div className="text-sm text-gray-500">{row.label}</div>
                                <div className="text-sm font-medium text-gray-900">{row.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="leading-7 whitespace-pre-line">No additional details provided.</p>
                );
              })()
            )}
          </div>
        </div>

        {related.filter((m) => {
          const mcats = Array.isArray(m.categories) && m.categories.length ? m.categories : [m.category];
          return mcats?.includes(primaryCategory);
        }).length > 0 && (
          <section ref={relatedRef} className={`mt-20 ${animationClasses.fadeUp(relatedVisible)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">You may also like in {primaryCategory}</h3>
              <div className="hidden sm:flex gap-2">
                <button
                  onClick={() => scrollBy('prev')}
                  disabled={!showPrev}
                  className={`h-9 w-9 rounded-lg border flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors ${!showPrev ? 'opacity-40 cursor-not-allowed' : ''}`}
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
                <button
                  onClick={() => scrollBy('next')}
                  disabled={!showNext}
                  className={`h-9 w-9 rounded-lg border flex items-center justify-center text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors ${!showNext ? 'opacity-40 cursor-not-allowed' : ''}`}
                  aria-label="Next"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => scrollBy('prev')}
                aria-label="Previous"
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex sm:hidden items-center justify-center ${!showPrev ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                onClick={() => scrollBy('next')}
                aria-label="Next"
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex sm:hidden items-center justify-center ${!showNext ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
              </button>

              <div
                ref={sliderRef}
                className="overflow-x-auto scrollbar-hide -mx-1 px-1 flex gap-4 snap-x snap-mandatory pb-2"
              >
                {related
                  .filter((m) => {
                    const mcats = Array.isArray(m.categories) && m.categories.length ? m.categories : [m.category];
                    return mcats?.includes(primaryCategory);
                  })
                  .map((m, index) => (
                    <div key={`${m.slug || m._id}-${index}`} className="snap-start shrink-0 w-60">
                      <MedicineCard product={m} />
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {showInquiry && (
        <InquiryModal
          isOpen={showInquiry}
          onClose={closeInquiry}
          medicine={medicine}
          currency={currency}
        />
      )}
    </div>
  );
}