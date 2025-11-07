import React from 'react';
import { useScrollAnimation, animationClasses, AnimatedCard } from '../utils/animations.jsx';

const categories = [
  {
    name: 'Pain Relief',
    count: 45,
    icon: (
      <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
      </svg>
    ),
  },
  {
    name: 'Antibiotics',
    count: 32,
    icon: (
      <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    name: 'Vitamins',
    count: 68,
    icon: (
      <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    name: 'Skincare',
    count: 54,
    icon: (
      <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    name: 'Supplements',
    count: 41,
    icon: (
      <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2z" />
        <path d="M7 20H5a2 2 0 01-2-2v-2h6v2a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: 'General Health',
    count: 89,
    icon: (
      <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="7" height="10" rx="3" />
        <rect x="14" y="7" width="7" height="10" rx="3" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
];

const CategoryCard = ({ name, count, icon, index }) => (
  <AnimatedCard 
    index={index} 
    className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-transparent transition-all duration-200 will-change-transform transform-gpu hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg hover:ring-emerald-300/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
  >
    <a href="#" className="block">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 transition-colors duration-200 group-hover:bg-emerald-100">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 transition-colors duration-200 group-hover:text-emerald-700">{name}</h3>
        <p className="mt-1 text-sm text-gray-500">{count} products</p>
      </div>
    </a>
  </AnimatedCard>
);

const CategorySection = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);

  return (
    <section className="w-full bg-sky-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12 sm:py-16">
        <div 
          ref={headerRef}
          className={`text-center mb-10 sm:mb-12 ${animationClasses.fadeUp(headerVisible)}`}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Shop by Category</h2>
          <p className="mt-2 text-gray-600">Find the healthcare products you need</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((c, index) => (
            <CategoryCard key={c.name} {...c} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
