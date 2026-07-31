import React from 'react';
import { Link } from 'react-router-dom';

// Premium, fully-clickable category card. Equal-height by design (h-full
// on the root + mt-auto pinning the CTA) so a 4/2/1 responsive grid keeps
// every row visually aligned regardless of description length.
export default function CategoryCard({ name, description, Illustration, href }) {
  return (
    <Link
      to={href}
      aria-label={`Browse ${name} category`}
      className="group relative flex h-full flex-col rounded-[24px] border border-[#E5E7EB] bg-white p-7 text-left transition-all duration-300 ease-out hover:-translate-y-2 hover:border-[#BBF7D0] hover:shadow-[0_20px_40px_-12px_rgba(16,163,74,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
    >
      <div className="mb-6 h-16 w-16 shrink-0 transition-transform duration-300 ease-out group-hover:scale-110">
        <Illustration />
      </div>

      <h3 className="text-xl font-bold leading-tight text-[#0F172A]">{name}</h3>
      <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#64748B]">{description}</p>

      <div className="mt-auto flex items-center gap-1.5 pt-6 text-[15px] font-semibold text-[#16A34A]">
        Browse Category
        <svg
          className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
