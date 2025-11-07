import React from 'react';
import { Link } from 'react-router-dom';
import imgPain from '../assets/product-pain-relief.jpg';
import imgVitamins from '../assets/product-vitamins.jpg';
import imgAntibiotics from '../assets/product-antibiotics.jpg';
import imgSkincare from '../assets/product-skincare.jpg';
import { useScrollAnimation, animationClasses, AnimatedCard } from '../utils/animations.jsx';

const products = [
  {
    id: 'pain-relief-extra',
    category: 'Pain Relief',
    title: 'Pain Relief Extra Strength',
    price: 12.99,
    image: imgPain,
  },
  {
    id: 'daily-multivitamin',
    category: 'Vitamins',
    title: 'Daily Multivitamin Complex',
    price: 24.99,
    image: imgVitamins,
  },
  {
    id: 'antibiotics-pack',
    category: 'Antibiotics',
    title: 'Antibiotic Treatment Pack',
    price: 18.5,
    image: imgAntibiotics,
  },
  {
    id: 'advanced-skincare',
    category: 'Skincare',
    title: 'Advanced Skincare Cream',
    price: 32.0,
    image: imgSkincare,
  },
];

const formatPrice = (n) => `$${n.toFixed(2)}`;

const FeaturedCard = ({ product, index }) => {
  return (
    <AnimatedCard 
      index={index}
      className="group h-full flex flex-col rounded-2xl border border-emerald-100 bg-white ring-1 ring-emerald-100/60 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:ring-emerald-300/70"
    >
      <div className="relative w-full h-56 md:h-60 lg:h-64">
        <img src={product.image} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="p-4 md:p-5 flex-1 flex flex-col">
        <p className="text-xs md:text-sm text-gray-500">{product.category}</p>
        <h3 className="mt-1 text-base md:text-lg font-semibold text-gray-800">{product.title}</h3>
        <p className="mt-2 text-emerald-600 font-semibold">{formatPrice(product.price)}</p>
        <div className="mt-auto pt-4">
          <Link to={`/products/${product.id}`} className="w-full inline-flex items-center justify-center h-11 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-medium bg-white transition-colors hover:bg-emerald-50 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
            View Details
          </Link>
        </div>
      </div>
    </AnimatedCard>
  );
};

const FeaturedMedicines = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [buttonRef, buttonVisible] = useScrollAnimation(0.1, 200);

  return (
    <section className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12 sm:py-16">
        <div 
          ref={headerRef}
          className={`flex items-start justify-between mb-8 md:mb-10 ${animationClasses.fadeUp(headerVisible)}`}
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Featured Medicines</h2>
            <p className="mt-2 text-gray-600">Popular and trusted products</p>
          </div>
          <div className="hidden sm:block">
            <button className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition-colors">View All</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((p, index) => (
            <FeaturedCard key={p.id} product={p} index={index} />
          ))}
        </div>

        <div 
          ref={buttonRef}
          className={`sm:hidden mt-8 flex justify-center ${animationClasses.fadeUp(buttonVisible)}`}
        >
          <button className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-emerald-400 transition-colors">View All</button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMedicines;
