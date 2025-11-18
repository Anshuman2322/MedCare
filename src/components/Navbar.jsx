import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCurrency } from '../store/useStore.jsx';
import { getAvailableCurrencies } from '../utils/currency';
import data from '../data/medicines.json';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const currencyRef = useRef(null);
  const searchRef = useRef(null);
  const availableCurrencies = getAvailableCurrencies();
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setIsCurrencyOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search functionality
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.trim().length > 0) {
      const filtered = data.filter(medicine => 
        medicine.name.toLowerCase().includes(value.toLowerCase()) ||
        medicine.category.toLowerCase().includes(value.toLowerCase()) ||
        (medicine.manufacturer && medicine.manufacturer.toLowerCase().includes(value.toLowerCase()))
      ).slice(0, 5); // Limit to 5 results
      setSearchResults(filtered);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  const handleSearchSelect = (medicineId) => {
    navigate(`/products/${medicineId}`);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setIsCurrencyOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md supports-backdrop-filter:bg-white/60 border-b border-gray-100 shadow-sm transition-colors">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="shrink-0 flex items-center hover:opacity-90 transition-opacity duration-200">
              <img
                src="/logo.png"
                alt="CureEra – Trust in Every Dose"
                className="h-30 sm:h-35 w-auto"
              />
              <span className="sr-only">CureEra</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative" ref={searchRef}>
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
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 h-10 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              
              {/* Search Results Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
                  {searchResults.map((medicine) => (
                    <button
                      key={medicine.id}
                      onClick={() => handleSearchSelect(medicine.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={medicine.image || medicine.imageUrl} 
                          alt={medicine.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{medicine.name}</div>
                          <div className="text-xs text-gray-500">{medicine.category}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-emerald-600 decoration-2 decoration-emerald-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50/60 cursor-pointer"
              >
                Home
              </Link>
              <Link
                to="/shop"
                className="text-gray-600 hover:text-emerald-600 decoration-2 decoration-emerald-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50/60 cursor-pointer"
              >
                Shop by Category
              </Link>
              <Link
                to="/about"
                className="text-gray-600 hover:text-emerald-600 decoration-2 decoration-emerald-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50/60 cursor-pointer"
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-gray-600 hover:text-emerald-600 decoration-2 decoration-emerald-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50/60 cursor-pointer"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Currency, Home Button and Cart - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="relative" ref={currencyRef}>
              <button 
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors hover:bg-gray-50"
              >
                <span>{currency}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`}
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
              
              {/* Currency Dropdown */}
              {isCurrencyOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {availableCurrencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        currency === curr.code ? 'bg-emerald-50 text-emerald-600' : 'text-gray-700'
                      }`}
                    >
                      <span>{curr.code} - {curr.name}</span>
                      <span className="text-gray-500">{curr.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Cart and Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10a1 1 0 100 2 1 1 0 000-2zm10 0a1 1 0 100 2 1 1 0 000-2z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                3
              </span>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                
                {/* Mobile Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    {searchResults.map((medicine) => (
                      <button
                        key={medicine.id}
                        onClick={() => {
                          handleSearchSelect(medicine.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <img 
                            src={medicine.image || medicine.imageUrl} 
                            alt={medicine.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{medicine.name}</div>
                            <div className="text-xs text-gray-500">{medicine.category}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Link
              to="/"
              className="text-gray-600 hover:text-emerald-600 hover:underline underline-offset-4 decoration-2 decoration-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-gray-600 hover:text-emerald-600 hover:underline underline-offset-4 decoration-2 decoration-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Shop by Category
            </Link>
            <Link
              to="/about"
              className="text-gray-600 hover:text-emerald-600 hover:underline underline-offset-4 decoration-2 decoration-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-gray-600 hover:text-emerald-600 hover:underline underline-offset-4 decoration-2 decoration-emerald-500 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            
            {/* Mobile Currency Selector */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Currency</p>
                <div className="grid grid-cols-2 gap-2">
                  {availableCurrencies.slice(0, 6).map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                        currency === curr.code 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium">{curr.code}</span>
                      <span className="text-xs">{curr.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;