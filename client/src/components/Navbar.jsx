import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCurrency } from '../store/useStore.jsx';
import { getAvailableCurrencies } from '../utils/currency';
import { fetchMedicines } from '../api/medicines';
import { useCartCount } from '../store/cartStore.js';
import { useFavorites } from '../store/favoritesStore.js';

function CartOutlineIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function HeartOutlineIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

// The badge counts distinct medicines, not units — "2" for two products is
// clearer than "30" for their combined quantities.
function HeaderIconLink({ to, label, count, icon }) {
  return (
    <NavLink
      to={to}
      aria-label={count ? `${label}, ${count} ${count === 1 ? 'item' : 'items'}` : `${label}, empty`}
      className={({ isActive }) =>
        `relative inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-emerald-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isActive ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'
        }`
      }
    >
      {icon}
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  );
}

// Defined outside Navbar so it isn't recreated (and remounted) on every
// render - that would reset the underline's CSS transition each time.
//
// Layout-shift fix: the visible label and an invisible always-bold copy are
// stacked in the same CSS grid cell (both children pinned to grid-area:1/1).
// Grid sizes the cell to the widest occupant, so the link's width is always
// governed by the permanently-bold ghost layer - toggling the real layer
// between 400 and 600 never changes the link's rendered width.
function NavItem({ to, end, children, onClick, variant = 'desktop' }) {
  const isDesktop = variant === 'desktop';
  const shellClasses = isDesktop
    ? 'relative grid whitespace-nowrap px-3 py-2 rounded-md text-sm transition-colors duration-150 cursor-pointer hover:bg-emerald-50/60'
    : 'relative grid px-3 py-2 rounded-md text-base transition-colors duration-150';

  return (
    <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => `${shellClasses} ${isActive ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}>
      {({ isActive }) => (
        <>
          <span className="[grid-area:1/1]" style={{ fontWeight: isActive ? 600 : 400 }}>
            {children}
          </span>
          <span className="[grid-area:1/1] invisible" style={{ fontWeight: 600 }} aria-hidden="true">
            {children}
          </span>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-[2px] origin-left bg-emerald-600 transition-transform duration-200 ease-out ${
              isActive ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

// Section tabs shown under the header on phones and small tablets.
const TABS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/shop', label: 'Shop', icon: 'shop', end: true },
  { to: '/about', label: 'About', icon: 'about', end: true },
  { to: '/faq', label: 'FAQ', icon: 'faq', end: true },
  { to: '/contact', label: 'Contact', icon: 'contact', end: true },
];

function TabIcon({ name }) {
  const common = { className: 'h-5 w-5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  switch (name) {
    case 'home':
      return <svg {...common}><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5" /></svg>;
    case 'shop':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case 'about':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.5h.01" /></svg>;
    case 'faq':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 015 .9c0 1.8-2.5 2.3-2.5 3.9" /><path d="M12 17h.01" /></svg>;
    case 'contact':
    default:
      return <svg {...common}><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" /><path d="M8 9h8" /><path d="M8 13h5" /></svg>;
  }
}

// One medicine in the search suggestions (header and small-screen search).
function SearchResult({ medicine, onSelect }) {
  const category = Array.isArray(medicine.categories) && medicine.categories.length ? medicine.categories.join(', ') : medicine.category;
  return (
    <button
      type="button"
      onClick={() => onSelect(medicine.slug || medicine._id)}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <img src={medicine.image || medicine.imageUrl} alt={medicine.name} className="w-10 h-10 object-cover rounded-lg" />
        <div className="min-w-0">
          <div className="font-medium text-gray-900 text-sm">{medicine.name}</div>
          <div className="text-xs text-gray-500">{category}</div>
        </div>
      </div>
    </button>
  );
}

const Navbar = () => {
  // Small screens: the search row under the header (opened with the search icon).
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const location = useLocation();
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const cartCount = useCartCount();
  const favoriteCount = useFavorites().length;
  const currencyRef = useRef(null);
  const searchRef = useRef(null);
  const [medicines, setMedicines] = useState([]);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const meds = await fetchMedicines();
        if (!active) return;
        setMedicines(meds || []);
        setSearchUnavailable(false);
      } catch (err) {
        console.error('Failed to load medicines for search', err);
        if (!active) return;
        setMedicines([]);
        setSearchUnavailable(true);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // Search functionality
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.trim().length > 0) {
      const filtered = medicines.filter(medicine => {
        const cats = Array.isArray(medicine.categories) && medicine.categories.length ? medicine.categories.join(' ') : String(medicine.category || '');
        const haystack = `${medicine.name} ${cats} ${medicine.manufacturer || ''}`.toLowerCase();
        return medicine.name && haystack.includes(value.toLowerCase());
      }).slice(0, 5);
      setSearchResults(filtered);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  const handleSearchSelect = (medicineSlug) => {
    navigate(`/medicine/${medicineSlug}`);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    navigate(`/shop?search=${encodeURIComponent(term)}`);
    setSearchResults([]);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    setIsCurrencyOpen(false);
  };

  const onShop = location.pathname === '/shop';
  const showMobileSearch = isMobileSearchOpen && !onShop;

  const searchIcon = (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <nav aria-label="Main" className="sticky top-0 z-50 bg-white/80 backdrop-blur-md supports-backdrop-filter:bg-white/70 border-b border-gray-100 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center min-w-0">
            <Link to="/" className="shrink-0 flex items-center hover:opacity-90 transition-opacity duration-200">
              <img
                src="/logo.png"
                alt="CureNeed – Trust in Every Dose"
                width="192"
                height="128"
                className="h-30 sm:h-35 w-auto"
              />
              <span className="sr-only">CureNeed</span>
            </Link>
          </div>

          {/* Search Bar (laptops and larger) */}
          <div className="hidden lg:block flex-1 max-w-sm xl:max-w-lg mx-4 xl:mx-8">
            <form className="relative" ref={searchRef} onSubmit={handleSearchSubmit} role="search">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">{searchIcon}</div>
              <input
                type="search"
                aria-label="Search medicines"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 h-10 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
                  {searchResults.map((medicine) => (
                    <SearchResult key={medicine.slug || medicine._id} medicine={medicine} onSelect={handleSearchSelect} />
                  ))}
                </div>
              )}
              {isSearchOpen && searchResults.length === 0 && searchUnavailable && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 px-4 py-3 text-sm text-gray-500">
                  Search is temporarily unavailable. Please try again shortly.
                </div>
              )}
            </form>
          </div>

          {/* Navigation links: shown in full from 900px (laptops, tablets in landscape, phones in "desktop site" mode) */}
          <div className="hidden min-[900px]:block">
            <div className="ml-1 xl:ml-6 flex items-baseline space-x-0.5 xl:space-x-3">
              <NavItem to="/" end>Home</NavItem>
              <NavItem to="/shop" end>Shop by Category</NavItem>
              <NavItem to="/about" end>About Us</NavItem>
              <NavItem to="/faq" end>FAQ</NavItem>
              <NavItem to="/contact" end>Contact</NavItem>
            </div>
          </div>

          {/* Search (small screens), favourites, request list and currency: always visible */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {!onShop && (
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen((open) => !open)}
                aria-label={showMobileSearch ? 'Close search' : 'Search medicines'}
                aria-expanded={showMobileSearch}
                aria-controls="mobile-search"
                className={`lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  showMobileSearch ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-emerald-50/60 hover:text-emerald-600'
                }`}
              >
                {searchIcon}
              </button>
            )}
            <HeaderIconLink to="/favorites" label="Favorites" count={favoriteCount} icon={<HeartOutlineIcon />} />
            <HeaderIconLink to="/cart" label="Request list" count={cartCount} icon={<CartOutlineIcon />} />
            <div className="relative" ref={currencyRef}>
              <button
                type="button"
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                aria-label={`Currency: ${currency}. Change currency`}
                aria-expanded={isCurrencyOpen}
                className="flex h-10 items-center gap-1 rounded-lg px-2 sm:px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-emerald-50/60 hover:text-emerald-700 border border-gray-200 min-[900px]:border-transparent"
              >
                <span>{currency}</span>
                <svg className={`w-4 h-4 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCurrencyOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {availableCurrencies.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
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
        </div>
      </div>

      {/* Search row on small screens (the Shop page has its own search box) */}
      {showMobileSearch && (
        <div id="mobile-search" className="lg:hidden border-t border-gray-100 bg-white px-3 py-2.5 sm:px-6">
          <form className="relative" onSubmit={handleSearchSubmit} role="search">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">{searchIcon}</div>
            <input
              type="search"
              aria-label="Search medicines"
              placeholder="Search medicines, brands or ingredients..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="block w-full pl-10 pr-3 h-11 rounded-xl border border-gray-200 bg-gray-50 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-[60vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                {searchResults.map((medicine) => (
                  <SearchResult key={medicine.slug || medicine._id} medicine={medicine} onSelect={handleSearchSelect} />
                ))}
              </div>
            )}
            {searchResults.length === 0 && searchUnavailable && searchTerm.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 px-4 py-3 text-sm text-gray-500">
                Search is temporarily unavailable. Please try again shortly.
              </div>
            )}
          </form>
        </div>
      )}

      {/* Section tabs on phones and small tablets: always visible, icon + name */}
      <div className="min-[900px]:hidden border-t border-gray-100">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              onClick={() => setIsMobileSearchOpen(false)}
              className={({ isActive }) =>
                `relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors focus:outline-none focus-visible:bg-emerald-50 ${
                  isActive ? 'text-emerald-700' : 'text-gray-500 hover:text-emerald-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
                    <TabIcon name={tab.icon} />
                  </span>
                  <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 h-[3px] w-8 rounded-t-full bg-emerald-600 transition-transform duration-200 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;