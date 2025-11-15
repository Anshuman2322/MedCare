import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import data from '../data/medicines.json';
import MedicineCard from '../components/MedicineCard';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';

export default function MedicineDetails() {
  const { id } = useParams();
  const product = useMemo(() => data.find((m) => m.id === id), [id]);
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
  const categoryDescription = product ? CATEGORY_DESCRIPTIONS[product.category] || CATEGORY_DESCRIPTIONS['Uncategorized'] : '';
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

  const images = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    return product.image ? [product.image] : [];
  }, [product]);

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
  }, [product]);

  const scrollBy = (dir) => {
    const el = sliderRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir === 'next' ? amount : -amount, behavior: 'smooth' });
  };

  // Safety: ensure top on product change (even if navigation preserves scroll)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [product?.id]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-sm text-gray-500 mb-4">
          <Link className="hover:underline" to="/">Home</Link>
          <span className="mx-2">/</span>
          <Link className="hover:underline" to="/shop">Products</Link>
        </div>
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-gray-600">The medicine you are looking for does not exist.</p>
      </div>
    );
  }
  const mainImage = images[imgIndex] || product.image || product.imageUrl;

  return (
    <div className="bg-white">
      {/* Category intro just below the Navbar */}
      {product && (
        <section 
          ref={categoryRef}
          className={`bg-sky-50/40 border-b border-gray-100 ${animationClasses.fadeUp(categoryVisible)}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{product.category}</h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600 max-w-3xl">{categoryDescription}</p>
          </div>
        </section>
      )}

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
          <span className="text-gray-700">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image + gallery */}
          <div 
            ref={imageRef}
            className={`border border-gray-200 rounded-2xl p-4 bg-white ${animationClasses.fadeLeft(imageVisible)}`}
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
              {mainImage ? (
                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
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
                      key={src}
                      onClick={() => setImgIndex(i)}
                      className={`h-16 w-16 shrink-0 rounded-lg border overflow-hidden ${i === imgIndex ? 'ring-2 ring-emerald-500 border-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}
                      aria-label={`Show image ${i + 1}`}
                    >
                      <img src={src} alt={`thumb ${i+1}`} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div 
            ref={contentRef}
            className={animationClasses.fadeRight(contentVisible)}
          >
            {/* Header with secondary buttons */}
            <div className="flex justify-between items-start mb-6">
              <div className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">{product.category}</div>
              
              {/* Secondary Action Buttons - Top Right */}
              <div className="flex gap-3">
                {/* Request Callback */}
                <button className="inline-flex items-center justify-center h-9 gap-1.5 px-4 rounded-lg border border-sky-500 text-sky-600 text-xs font-medium hover:bg-sky-50 hover:border-sky-600 hover:shadow-sm active:bg-sky-100 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  Callback
                </button>

                {/* Get Best Quote */}
                <button className="inline-flex items-center justify-center h-9 gap-1.5 px-4 rounded-lg border border-fuchsia-300 text-fuchsia-300 text-xs font-medium hover:bg-l-fuchsia-50 hover:border-fuchsia-400 hover:shadow-sm active:bg-gray-100 transition-all duration-200 transform hover:scale-105">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  Quote
                </button>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{product.name}</h1>
            <p className="mt-6 text-gray-600 max-w-2xl">{product.description}</p>

            <div className="mt-8 text-emerald-600 text-3xl font-extrabold" key={`price-${currency}`}>{formatPrice(product.price, currency)}</div>

            {/* Specs grid */}
            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <div className="text-gray-500">Manufacturer</div>
                <div className="text-gray-800 font-medium">{product.manufacturer}</div>
              </div>
              <div>
                <div className="text-gray-500">Form</div>
                <div className="text-gray-800 font-medium">{product.form}</div>
              </div>
              <div>
                <div className="text-gray-500">In Stock</div>
                <div className="text-gray-800 font-medium">{product.inStock ? 'Available' : 'Out of Stock'}</div>
              </div>
              <div>
                <div className="text-gray-500">Composition</div>
                <div className="text-gray-800 font-medium">{product.composition}</div>
              </div>
            </div>

            {/* Stock + quantity */}
            <div className="mt-10 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center text-emerald-600">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
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
                  className="w-5 h-5 flex-shrink-0" 
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
            {tab === 'Dosage' && <p><span className="font-semibold">Recommended Dosage</span><br />{product.dosage}</p>}
            {tab === 'Usage' && <p>{product.usage}</p>}
            {tab === 'Details' && <p>{product.details}</p>}
          </div>
        </div>

        {/* Related products horizontal slider */}
        {data.filter((m) => m.category === product.category && m.id !== product.id).length > 0 && (
          <section
            ref={relatedRef}
            className={`mt-20 ${animationClasses.fadeUp(relatedVisible)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">You may also like in {product.category}</h3>
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
                {data
                  .filter((m) => m.category === product.category && m.id !== product.id)
                  .map((m) => (
                    <div key={m.id} className="snap-start shrink-0 w-60">
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
