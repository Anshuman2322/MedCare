import React from 'react';

// Shown in place of a product image when the medicine has no image at all,
// or its src 404s / fails to load (deleted Cloudinary asset, bad data,
// etc.) - keeps the card looking intentional instead of a broken-image
// icon with raw alt text bleeding through.
export default function ImagePlaceholder({ className = '' }) {
  return (
    <div className={`flex items-center justify-center bg-[linear-gradient(180deg,#F8FAFC_0%,#EEFDF5_100%)] text-[#94A3B8] ${className}`}>
      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M21 15l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
