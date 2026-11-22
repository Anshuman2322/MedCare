import React, { useState } from 'react';
import { toggleFavorite, useIsFavorite } from '../../store/favoritesStore.js';
import { showToast } from '../../store/toastStore.js';

const sizes = {
  sm: { button: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { button: 'h-9 w-9', icon: 'h-5 w-5' },
  lg: { button: 'h-11 w-11', icon: 'h-6 w-6' },
};

export default function FavoriteButton({ product, size = 'md', className = '' }) {
  const slug = product?.slug || product?._id || product?.id;
  const favorite = useIsFavorite(slug);
  const [bounce, setBounce] = useState(false);
  const dimensions = sizes[size] || sizes.md;

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nowFavorite = toggleFavorite(slug);
    setBounce(true);
    window.setTimeout(() => setBounce(false), 400);
    showToast({
      text: nowFavorite ? 'Saved to favorites' : 'Removed from favorites',
      actionLabel: nowFavorite ? 'View' : '',
      actionTo: nowFavorite ? '/favorites' : '',
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorite}
      aria-label={
        favorite ? `Remove ${product?.name || 'medicine'} from favorites` : `Save ${product?.name || 'medicine'} to favorites`
      }
      className={`flex ${dimensions.button} items-center justify-center rounded-full bg-white/95 shadow-[0_8px_18px_rgba(15,23,42,0.12)] ring-1 ring-gray-200 transition-transform duration-200 hover:bg-white hover:ring-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        bounce ? 'scale-125' : 'scale-100'
      } ${className}`}
    >
      <svg
        className={dimensions.icon}
        viewBox="0 0 24 24"
        fill={favorite ? '#EF4444' : 'none'}
        stroke={favorite ? '#EF4444' : '#64748B'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  );
}
