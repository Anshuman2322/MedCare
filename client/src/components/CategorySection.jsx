import React from 'react';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import CategoryCarousel from './category/CategoryCarousel.jsx';
import { CAROUSEL_CATEGORIES } from './category/categoryData.js';

// A curated, always-full browse list (not derived from current inventory)
// so the section reads like a premium pharmacy's full category directory
// rather than shrinking to whatever 2-3 categories happen to have stock
// today. Categories with no matching products yet still link through to
// the shop page's expected empty state, same as any other filter.
const CategorySection = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);

  return (
    <section className="w-full bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 sm:py-20">
        <div
          ref={headerRef}
          className={`text-center mb-12 sm:mb-14 ${animationClasses.fadeUp(headerVisible)}`}
        >
          <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight">Shop by Category</h2>
          <p className="mt-3 text-base font-medium text-[#64748B]">
            Find trusted healthcare products organized by your needs.
          </p>
        </div>

        <CategoryCarousel categories={CAROUSEL_CATEGORIES} />
      </div>
    </section>
  );
};

export default CategorySection;
