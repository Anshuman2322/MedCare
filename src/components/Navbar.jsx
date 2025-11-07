import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/75 border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="shrink-0 flex items-center">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-2">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2L3 7v11a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V7l-7-5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">MedCare</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search medicines..."
                className="block w-full pl-10 pr-3 h-10 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/shop"
                className="text-gray-600 hover:text-emerald-600  decoration-2 decoration-emerald-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50/60 cursor-pointer"
              >
                Shop by Category
              </Link>
              <Link
                to="/about"
                className="text-gray-600 hover:text-emerald-600  decoration-2 decoration-emerald-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50/60 cursor-pointer"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-gray-600 hover:text-emerald-600  decoration-2 decoration-emerald-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50/60 cursor-pointer"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Currency and Cart */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900">
              <span>USD</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5h13M7 13h13"
                />
              </svg>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-gray-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
            <div className="pb-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search medicines..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <Link
              to="/shop"
              className="text-gray-600 hover:text-emerald-600 hover:underline underline-offset-4 decoration-2 decoration-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
            >
              Shop by Category
            </Link>
            <Link
              to="/about"
              className="text-gray-600 hover:text-emerald-600 hover:underline underline-offset-4 decoration-2 decoration-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
            >
              About Us
            </Link>
            <a
              href="#"
              className="text-gray-600 hover:text-emerald-600 hover:underline underline-offset-4 decoration-2 decoration-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;