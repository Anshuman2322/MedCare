import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import data from '../data/medicines.json';
import categories from '../data/categories.json';
import { getProductImage } from '../utils/images';
import MedicineCard from '../components/MedicineCard';
import { useScrollAnimation, animationClasses, AnimatedCard } from '../utils/animations.jsx';

const formatPrice = (n) => `$${Number(n).toFixed(2)}`;

export default function MedicineDetails() {
  const { id } = useParams();
  const product = useMemo(() => data.find((m) => m.id === id), [id]);
  const catMeta = useMemo(() => categories.find((c) => c.name === product?.category), [product]);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('Dosage');

  // Animation refs
  const [categoryRef, categoryVisible] = useScrollAnimation(0.1);
  const [breadcrumbRef, breadcrumbVisible] = useScrollAnimation(0.1, 100);
  const [imageRef, imageVisible] = useScrollAnimation(0.1, 200);
  const [contentRef, contentVisible] = useScrollAnimation(0.1, 300);
  const [tabsRef, tabsVisible] = useScrollAnimation(0.1, 400);
  const [relatedRef, relatedVisible] = useScrollAnimation(0.1, 500);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-sm text-gray-500 mb-4"><Link className="hover:underline" to="/">Home</Link> / Products</div>
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-gray-600">The medicine you are looking for does not exist.</p>
      </div>
    );
  }

  const img = getProductImage(product.imageKey);

  return (
    <div className="bg-white">
      {/* Category intro just below the Navbar */}
      {catMeta && (
        <section 
          ref={categoryRef}
          className={`bg-sky-50/40 border-b border-gray-100 ${animationClasses.fadeUp(categoryVisible)}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{catMeta.name}</h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600 max-w-3xl">{catMeta.description}</p>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6">
        {/* Breadcrumb */}
        <nav 
          ref={breadcrumbRef}
          className={`text-sm text-gray-500 mb-6 ${animationClasses.fadeUp(breadcrumbVisible)}`}
        >
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Products</span>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div 
            ref={imageRef}
            className={`border border-gray-200 rounded-2xl p-4 bg-white ${animationClasses.fadeLeft(imageVisible)}`}
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-50">
              <img src={img} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Content */}
          <div 
            ref={contentRef}
            className={animationClasses.fadeRight(contentVisible)}
          >
            <div className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">{product.category}</div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">{product.name}</h1>
            <p className="mt-3 text-gray-600 max-w-2xl">{product.description}</p>

            <div className="mt-5 text-emerald-600 text-3xl font-extrabold">{formatPrice(product.price)}</div>

            {/* Specs grid */}
            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <div className="text-gray-500">Brand</div>
                <div className="text-gray-800 font-medium">{product.brand}</div>
              </div>
              <div>
                <div className="text-gray-500">Form</div>
                <div className="text-gray-800 font-medium">{product.form}</div>
              </div>
              <div>
                <div className="text-gray-500">Packaging</div>
                <div className="text-gray-800 font-medium">{product.packaging}</div>
              </div>
              <div>
                <div className="text-gray-500">Composition</div>
                <div className="text-gray-800 font-medium">{product.composition}</div>
              </div>
            </div>

            {/* Stock + quantity */}
            <div className="mt-6 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center text-emerald-600">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
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

              {/* Add to Cart */}
              <button className="inline-flex items-center justify-center h-11 min-w-[150px] gap-2 px-5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 active:bg-emerald-700 transition-colors whitespace-nowrap">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5h13M7 13h13"/></svg>
                Add to Cart
              </button>

              {/* Buy Now */}
              <button className="h-11 px-5 rounded-lg bg-sky-100 text-sky-900 font-semibold hover:bg-sky-200 transition-colors whitespace-nowrap">Buy Now</button>

              {/* Wishlist */}
              <button className="h-11 w-11 rounded-lg border border-gray-200 text-gray-600 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>
              </button>

              {/* Share */}
              <button className="h-11 w-11 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7"/><path d="M16 6l-4-4-4 4"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div 
          ref={tabsRef}
          className={`mt-10 ${animationClasses.fadeUp(tabsVisible)}`}
        >
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {['Dosage', 'Usage', 'Details'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 text-sm font-medium ${tab === t ? 'bg-white text-gray-900 shadow-inner' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-gray-700">
            {tab === 'Dosage' && <p><span className="font-semibold">Recommended Dosage</span><br />{product.dosage}</p>}
            {tab === 'Usage' && <p>{product.usage}</p>}
            {tab === 'Details' && <p>{product.details}</p>}
          </div>
        </div>

        {/* Related products */}
        {data.filter((m) => m.category === product.category && m.id !== product.id).length > 0 && (
          <section 
            ref={relatedRef}
            className={`mt-12 ${animationClasses.fadeUp(relatedVisible)}`}
          >
            <h3 className="text-xl font-bold text-gray-900">You may also like in {product.category}</h3>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data
                .filter((m) => m.category === product.category && m.id !== product.id)
                .slice(0, 3)
                .map((m, index) => (
                  <AnimatedCard key={m.id} index={index} delay={200}>
                    <MedicineCard product={{ ...m, image: getProductImage(m.imageKey) }} />
                  </AnimatedCard>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
