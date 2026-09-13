import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMedicines } from '../api/medicines';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import { useCurrency } from '../store/useStore.jsx';
import ProductCarousel from './product/ProductCarousel.jsx';
import InquiryModal from './InquiryModal.jsx';

const FeaturedMedicines = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [products, setProducts] = useState([]);
  const [inquiryMedicine, setInquiryMedicine] = useState(null);
  const { currency } = useCurrency();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const meds = await fetchMedicines();
        if (!active) return;
        const featured = meds
          .filter((m) => m && (m.image || (Array.isArray(m.images) && m.images.length)))
          .slice(0, 12);
        setProducts(featured);
      } catch (err) {
        console.error('Failed to load featured medicines', err);
        setProducts([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="w-full bg-gradient-to-b from-white to-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12 sm:py-16">
        <div
          ref={headerRef}
          className={`flex items-start justify-between mb-8 md:mb-10 ${animationClasses.fadeUp(headerVisible)}`}
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Featured Medicines</h2>
            <p className="mt-2 text-gray-600">Popular and trusted products</p>
          </div>
          <div className="hidden sm:block">
            <Link to="/shop" className="inline-flex items-center h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition-colors">View More</Link>
          </div>
        </div>

        {products.length > 0 ? (
          <ProductCarousel products={products} onQuickInquiry={setInquiryMedicine} />
        ) : (
          <div className="text-gray-500 text-center py-12">Featured medicines will appear here once available.</div>
        )}

        <div className="sm:hidden mt-8 flex justify-center">
          <Link to="/shop" className="inline-flex items-center h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition-colors">View More</Link>
        </div>
      </div>

      {inquiryMedicine && (
        <InquiryModal
          isOpen={Boolean(inquiryMedicine)}
          onClose={() => setInquiryMedicine(null)}
          medicine={inquiryMedicine}
          currency={currency}
        />
      )}
    </section>
  );
};

export default FeaturedMedicines;
