import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Fixed 250x320 card used as a carousel slide. Fully clickable, equal
// height regardless of description length (mt-auto pins the CTA), with a
// real CSS :hover (border tint, shadow) layered under a Framer Motion
// lift so keyboard/focus and touch users get the same affordance as a
// mouse hover.
export default function CategoryCard({ name, description, Illustration, href, tabIndex }) {
  return (
    <motion.div
      className="group h-[320px] w-[250px]"
      whileHover={{ y: -8 }}
      whileFocus={{ y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        to={href}
        tabIndex={tabIndex}
        aria-label={`Browse ${name} category`}
        className="flex h-full w-full flex-col rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out group-hover:border-[#16A34A] group-hover:shadow-[0_20px_40px_-14px_rgba(16,163,74,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
      >
        <div className="mb-5 h-20 w-20 shrink-0 transition-transform duration-300 ease-out group-hover:scale-105">
          <Illustration />
        </div>

        <h3 className="text-lg font-bold leading-tight text-[#0F172A]">{name}</h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#64748B] line-clamp-2">{description}</p>

        <div className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold text-[#16A34A]">
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
    </motion.div>
  );
}
