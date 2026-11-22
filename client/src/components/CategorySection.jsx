import React, { useMemo } from 'react';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import useCatalogue from '../hooks/useCatalogue';
import CategoryCarousel from './category/CategoryCarousel.jsx';
import { CAROUSEL_CATEGORIES, categoriesWithProducts } from './category/categoryData.js';

// A curated browse list in a fixed order, trimmed to the categories that
// have products on the public site, so no card leads to an empty page.
const CategorySection = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const { status, medicines } = useCatalogue();
  const categories = useMemo(
    () => categoriesWithProducts(CAROUSEL_CATEGORIES, medicines, status === 'ready'),
    [medicines, status]
  );

  return (
    <section className="w-full bg-[#F8FAFC]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 sm:py-20">
        <div
          ref={headerRef}
          className={`text-center mb-12 sm:mb-14 ${animationClasses.fadeUp(headerVisible)}`}
        >
          <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight">Shop by Category</h2>
          <p className="mt-3 text-base font-medium text-[#64748B]">
            Browse our catalogue by therapy area.
          </p>
        </div>

        {categories.length > 0 && <CategoryCarousel categories={categories} />}
      </div>
    </section>
  );
};

export default CategorySection;
