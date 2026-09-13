import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

export default function NotFound() {
  return (
    <div className="bg-white min-h-[70vh] flex items-center">
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist or may have moved." />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-3">404</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Page not found
        </h1>
        <p className="text-gray-600 text-base leading-relaxed mb-8">
          The page you're looking for doesn't exist, may have moved, or the link may be out of date.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
          >
            Browse Medicines
          </Link>
        </div>
      </div>
    </div>
  );
}
