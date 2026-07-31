import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCurrency } from '../../store/useStore.jsx';
import { formatPrice } from '../../utils/currency';
import { parseMedicinePrice, resolveMedicineImage } from '../../utils/medicineDisplay.js';
import { isWishlisted, toggleWishlist } from '../../utils/wishlist.js';

const HeartIcon = ({ filled }) => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill={filled ? '#EF4444' : 'none'}
    stroke={filled ? '#EF4444' : '#64748B'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill={filled ? '#F59E0B' : '#E5E7EB'} aria-hidden="true">
    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85z" />
  </svg>
);

// Real, data-driven badge only - never fabricated marketing claims like
// "Best Seller" or "FDA Approved" with nothing behind them.
function getBadge(product) {
  if (product.requiresPrescription) {
    return { label: 'Rx Only', className: 'bg-red-50 text-red-700 border-red-200' };
  }
  const createdAt = product.createdAt ? new Date(product.createdAt) : null;
  const isNew = createdAt && Date.now() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000;
  if (isNew) {
    return { label: 'New Arrival', className: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (product.compareAtPrice && product.compareAtPrice > parseMedicinePrice(product)) {
    const pct = Math.round((1 - parseMedicinePrice(product) / product.compareAtPrice) * 100);
    return { label: `${pct}% OFF`, className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return null;
}

// Premium featured-product card. The image/title/price zone is one Link
// to the product page (primary navigation target); the wishlist toggle
// and Send Inquiry button are deliberately separate sibling controls
// rather than nested inside that Link - a <button> inside an <a> is
// invalid HTML and breaks keyboard/screen-reader navigation, so "entire
// card clickable" is implemented as "everything that isn't its own
// distinct action is one big link," which is how Amazon/Nike do it too.
export default function ProductCard({ product, onQuickInquiry }) {
  const { currency } = useCurrency();
  const slug = product.slug || product._id;
  const [wishlisted, setWishlisted] = useState(() => isWishlisted(slug));
  const [bounce, setBounce] = useState(false);

  const badge = getBadge(product);
  const price = parseMedicinePrice(product);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > price;
  const rating = typeof product.rating === 'number' ? product.rating : null;
  const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : null;
  const category = Array.isArray(product.categories) && product.categories.length
    ? product.categories[0]
    : product.category;

  const handleWishlistClick = (event) => {
    event.preventDefault();
    const next = toggleWishlist(slug);
    setWishlisted(next);
    setBounce(true);
    setTimeout(() => setBounce(false), 400);
  };

  return (
    <motion.div
      className="group relative flex h-full flex-col rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out hover:border-[#16A34A] hover:shadow-[0_20px_40px_-14px_rgba(16,163,74,0.25)]"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Link to={`/medicine/${slug}`} className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 rounded-2xl">
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-[#F8FAFC]">
          {badge && (
            <span className={`absolute left-2.5 top-2.5 z-10 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>
              {badge.label}
            </span>
          )}
          <img
            src={resolveMedicineImage(product)}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.08]"
          />
        </div>

        <div className="text-xs font-medium text-[#64748B]">{category}</div>
        <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] text-[18px] font-semibold leading-snug text-[#0F172A]">
          {product.name}
        </h3>

        {rating !== null && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon key={n} filled={n <= Math.round(rating)} />
              ))}
            </div>
            <span className="text-xs font-medium text-[#64748B]">
              {rating.toFixed(1)}{reviewCount !== null ? ` (${reviewCount} Reviews)` : ''}
            </span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2" key={`price-${currency}`}>
          <span className="text-xl font-bold text-[#16A34A]">{formatPrice(price, currency)}</span>
          {hasDiscount && (
            <span className="text-sm font-medium text-[#94A3B8] line-through">
              {formatPrice(product.compareAtPrice, currency)}
            </span>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={handleWishlistClick}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className={`absolute right-7 top-7 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-[#E5E7EB] transition-transform duration-200 hover:ring-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] ${bounce ? 'scale-125' : 'scale-100'}`}
      >
        <HeartIcon filled={wishlisted} />
      </button>

      <div className="mt-4 flex items-center gap-2">
        <Link
          to={`/medicine/${slug}`}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#16A34A] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
        >
          View Details
        </Link>
        <button
          type="button"
          onClick={() => onQuickInquiry?.(product)}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#16A34A] text-sm font-semibold text-[#16A34A] transition-colors duration-200 hover:bg-[#F0FDF4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
        >
          Send Inquiry
        </button>
      </div>
    </motion.div>
  );
}
