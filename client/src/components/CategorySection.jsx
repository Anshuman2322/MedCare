import React, { useEffect, useState } from 'react';
import { fetchMedicines } from '../api/medicines';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import CategoryCard from './category/CategoryCard.jsx';
import { getCategoryMeta } from './category/categoryData.js';

const CategorySection = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const meds = await fetchMedicines();
        if (!active) return;
        const counts = new Map();
        meds.forEach((m) => {
          const key = m?.category || 'Other';
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        const arr = Array.from(counts.entries()).map(([name, count]) => ({
          name,
          count,
          ...getCategoryMeta(name),
        }));
        setCategories(arr.sort((a, b) => b.count - a.count).slice(0, 8));
      } catch (err) {
        console.error('Failed to load categories', err);
        setCategories([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="w-full bg-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 sm:py-20">
        <div
          ref={headerRef}
          className={`text-center mb-12 sm:mb-14 ${animationClasses.fadeUp(headerVisible)}`}
        >
          <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight">Shop by Category</h2>
          <p className="mt-3 text-base font-medium text-[#64748B]">
            Find trusted healthcare products organized by your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((c) => (
            <CategoryCard
              key={c.name}
              name={c.name}
              description={c.description}
              Illustration={c.illustration}
              href={`/shop?category=${encodeURIComponent(c.name)}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
