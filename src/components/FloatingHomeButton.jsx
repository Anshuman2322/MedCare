import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const FloatingHomeButton = () => {
  const location = useLocation();
  
  // Don't show on the home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <Link
      to="/"
      className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-300 md:hidden"
      title="Back to Home"
    >
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
};

export default FloatingHomeButton;