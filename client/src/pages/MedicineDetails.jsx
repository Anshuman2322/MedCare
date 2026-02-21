import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MedicineCard from '../components/MedicineCard';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';

export default function MedicineDetails() {
  console.log('MedicineDetails MOUNTED');
  const { slug } = useParams();
  console.log('MedicineDetails slug:', slug);
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const { currency } = useCurrency();

  const CATEGORY_DESCRIPTIONS = {
    'Antibiotics': 'Prescription medications used to treat bacterial infections. Always complete the full course as directed by your healthcare provider.',
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
    'Uncategorized': 'General healthcare product.'
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
    const key = primaryCategory;
    const direct = CATEGORY_DESCRIPTIONS[key];
    if (direct) return direct;
    const normalized = key?.replace(/-/g, ' ');
    return CATEGORY_DESCRIPTIONS[normalized] || CATEGORY_DESCRIPTIONS['Uncategorized'];
  }, [medicine]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('Dosage');

  // Animation refs
  const [categoryRef, categoryVisible] = useScrollAnimation(0.1);
  const [breadcrumbRef, breadcrumbVisible] = useScrollAnimation(0.1, 100);
  const [imageRef, imageVisible] = useScrollAnimation(0.1, 200);
  const [contentRef, contentVisible] = useScrollAnimation(0.1, 300);
  const [tabsRef, tabsVisible] = useScrollAnimation(0.1, 400);
  const [relatedRef, relatedVisible] = useScrollAnimation(0.1, 500);
  const sliderRef = useRef(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    let ignore = false;
    console.log('MedicineDetails fetch useEffect triggered, slug:', slug);

    async function load() {
      try {
        setLoading(true);
        console.log('MedicineDetails fetching from:', `http://localhost:5000/api/medicines/${slug}`);

        const res = await fetch(`http://localhost:5000/api/medicines/${slug}`);
        console.log('MedicineDetails fetch response status:', res.status);
        const data = await res.json();
        console.log('MedicineDetails fetch data:', data);

        if (ignore) return;

        const med = data?.medicine || data;
        console.log('MedicineDetails setting medicine:', med);
        setMedicine(med || null);
      } catch (e) {
        console.error("DETAIL FETCH ERROR", e);
        if (!ignore) setMedicine(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (slug) load();

    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    if (!medicine?.category) {
      setRelated([]);
      return () => {
        active = false;
      };
    }
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/medicines?category=${encodeURIComponent(medicine.category)}`);
        if (!res.ok) throw new Error('Failed to load');
        const meds = await res.json();
        if (!active) return;
        const filtered = meds.filter((m) => (m.slug || m._id) !== (medicine.slug || medicine._id));
        setRelated(filtered);
      } catch (err) {
        console.error('Failed to load related medicines', err);
        if (active) setRelated([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [medicine?.category, medicine?.slug, medicine?._id]);

  const images = useMemo(() => {
    if (!medicine) return [];
    if (Array.isArray(medicine.images)) return medicine.images;
    if (medicine.image) return [medicine.image];
    return [];
  }, [medicine]);

  const prevImage = () => images.length > 0 && setImgIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => images.length > 0 && setImgIndex((i) => (i + 1) % images.length);

  // Setup slider visibility controls
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const update = () => {
      setShowPrev(el.scrollLeft > 10);
      setShowNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [related.length]);

  const scrollBy = (dir) => {
    const el = sliderRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir === 'next' ? amount : -amount, behavior: 'smooth' });
  };

  // Safety: ensure top on product change (even if navigation preserves scroll)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [medicine?.slug]);
  const mainImage = images?.[imgIndex] || images?.[0] || "";

  console.log('MedicineDetails render state:', { loading, medicine: !!medicine, slug });

  if (loading) {
    console.log('MedicineDetails returning Loading...');
    return <div className="p-20 text-center">Loading medicine details...</div>;
  }

  if (!medicine) {
    console.log('MedicineDetails returning Medicine not found');
    return <div className="p-20 text-center">Medicine not found</div>;
  }

  console.log('MedicineDetails rendering full UI');
  return (
    <div className="bg-white">
      {/* Category intro just below the Navbar */}
      <section
        ref={categoryRef}
        className={`bg-sky-50/40 border-b border-gray-100 ${animationClasses.fadeUp(categoryVisible)}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{categoriesList.join(', ')}</h2>
          <p className="mt-1 text-sm sm:text-base text-gray-600 max-w-3xl">{categoryDescription}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10">
        {/* Breadcrumb */}
        <nav
          ref={breadcrumbRef}
          className={`text-sm text-gray-500 mb-6 ${animationClasses.fadeUp(breadcrumbVisible)}`}
        >
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:underline">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{medicine?.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image + gallery */}
          <div
            ref={imageRef}
            className={`flex items-start border border-gray-200 rounded-2xl p-4 bg-white inline-block ${animationClasses.fadeLeft(imageVisible)}`}
          >
            <div className="relative w-full flex flex-col items-start">
              <div className="relative w-full flex items-center justify-center rounded-xl overflow-hidden bg-gray-50">
                {mainImage ? (
                  <img
                    src={mainImage || ""}
                    alt={medicine?.name || ""}
                    className="max-h-[420px] w-auto object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex items-center justify-center hover:bg-white"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 backdrop-blur border border-gray-200 shadow-sm flex items-center justify-center hover:bg-white"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 overflow-x-auto -mx-1 px-1">
                  <div className="flex gap-3">
                    {images.map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        onClick={() => setImgIndex(i)}
                        className={`h-16 w-16 shrink-0 rounded-lg border overflow-hidden ${i === imgIndex ? 'ring-2 ring-emerald-500 border-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}
                        aria-label={`Show image ${i + 1}`}
                      >
                        <img src={src} alt={`thumb ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className={animationClasses.fadeRight(contentVisible)}
          >
            {/* Header with secondary buttons */}
            <div className="flex justify-between items-start mb-6">
              <div className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">{primaryCategory}</div>

              {/* Secondary Action Buttons - Top Right */}
              <div className="flex gap-3">
                {/* Request Callback */}
                <button className="inline-flex items-center justify-center h-9 gap-1.5 px-4 rounded-lg border border-sky-500 text-sky-600 text-xs font-medium hover:bg-sky-50 hover:border-sky-600 hover:shadow-sm active:bg-sky-100 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Callback
                </button>

                {/* Get Best Quote */}
                <button className="inline-flex items-center justify-center h-9 gap-1.5 px-4 rounded-lg border border-fuchsia-300 text-fuchsia-300 text-xs font-medium hover:bg-l-fuchsia-50 hover:border-fuchsia-400 hover:shadow-sm active:bg-gray-100 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Quote
                </button>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{medicine?.name}</h1>
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-sm uppercase tracking-wide text-emerald-700 mb-1">Overview</div>
              <p className="mt-2 text-gray-700 max-w-2xl text-justify leading-7">{medicine?.description}</p>
            </div>

            <div className="mt-8 text-emerald-600 text-3xl font-extrabold" key={`price-${currency}`}>{formatPrice(medicine?.price, currency)}</div>

            {/* Specs grid */}
            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <div className="text-gray-500">Manufacturer</div>
                <div className="text-gray-800 font-medium">{medicine?.manufacturer}</div>
              </div>
              <div>
                <div className="text-gray-500">Form</div>
                <div className="text-gray-800 font-medium">{medicine?.form}</div>
              </div>
              <div>
                <div className="text-gray-500">In Stock</div>
                <div className="text-gray-800 font-medium">{medicine?.inStock ? 'Available' : 'Out of Stock'}</div>
              </div>
              <div>
                <div className="text-gray-500">Composition</div>
                <div className="text-gray-800 font-medium">{medicine?.composition || (Array.isArray(medicine?.details) ? (medicine?.details.find?.(r => r.label === 'Composition')?.value || '') : '')}</div>
              </div>
            </div>

            {/* Stock + quantity */}
            <div className="mt-10 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center text-emerald-600">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                {medicine?.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-3">
                {/* Quantity stepper */}
                <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-gray-200">
                  <button
                    aria-label="Decrease quantity"
                    className={`h-11 w-10 text-gray-700 hover:bg-gray-50 ${qty === 1 ? 'text-gray-300 cursor-not-allowed' : ''}`}
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
                    className="h-11 w-10 text-gray-700 hover:bg-gray-50"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Main CTA Button - Yes I am Interested */}
              <button className="w-full inline-flex items-center justify-center h-14 gap-3 px-6 rounded-xl border-2 border-emerald-500 bg-white text-emerald-600 text-lg font-semibold hover:bg-emerald-50 active:bg-emerald-100 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="whitespace-nowrap">Yes! I am Interested</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          ref={tabsRef}
          className={`mt-16 ${animationClasses.fadeUp(tabsVisible)}`}
        >
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {['Dosage', 'Usage', 'Details'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 text-sm font-medium ${tab === t ? 'bg-white text-gray-900 shadow-inner' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-gray-700">
            {tab === 'Dosage' && (
              <div>
                <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Recommended Dosage</div>
                <p className="leading-7 whitespace-pre-line">{medicine?.dosage || 'Information will be available soon.'}</p>
              </div>
            )}
            {tab === 'Usage' && (
              <div>
                <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Usage Guidelines</div>
                <p className="leading-7 whitespace-pre-line">{medicine?.usage || 'Information will be available soon.'}</p>
              </div>
            )}
            {tab === 'Details' && (
              (() => {
                const base = Array.isArray(medicine?.details) ? [...medicine.details] : [];
                const labels = new Set(base.map((r) => r?.label));
                const ensureRow = (label, value) => {
                  if (!labels.has(label)) base.unshift({ label, value });
                };
                ensureRow('Brand Name', medicine?.name || '');
                ensureRow('Manufacturer', medicine?.manufacturer || '');
                ensureRow('Form', medicine?.form || '');
                // Show Treatment as primary category
                ensureRow('Treatment', primaryCategory || '');

                return base.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {base.map((row, idx) => (
                          <tr key={`${row.label}-${idx}`} className="odd:bg-emerald-50 even:bg-white">
                            <th className="text-gray-600 font-medium text-left py-3 pr-6 w-48 align-top">{row.label}</th>
                            <td className="text-gray-800 py-3">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="leading-7 whitespace-pre-line">No additional details provided.</p>
                );
              })()
            )}
          </div>
        </div>

        {/* Related products horizontal slider */}
        {related.filter((m) => {
          const mcats = Array.isArray(m.categories) && m.categories.length ? m.categories : [m.category];
          return mcats?.includes(primaryCategory);
        }).length > 0 && (
            <section
              ref={relatedRef}
              className={`mt-20 ${animationClasses.fadeUp(relatedVisible)}`}
            >
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
                {/* Mobile overlay buttons */}
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
    </div>
  );
}