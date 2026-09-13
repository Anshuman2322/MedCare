import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MedicineCard from '../components/MedicineCard';
import SEO from '../components/SEO.jsx';
import { useScrollAnimation, animationClasses, AnimatedCard } from '../utils/animations.jsx';
import { parseMedicinePrice } from '../utils/medicineDisplay.js';
import { fetchMedicines } from '../api/medicines';
import './ShopByCategory.css';

// Raw category names as stored on a medicine (m.category) don't always
// match the checkbox labels shown in the filter sidebar below - module
// level so it can normalize the initial ?category= URL param too.
const LEGACY_CATEGORY_MAP = new Map([
  ['Anti Cancer', 'Anti-Cancer'],
  ['Anti Malarial', 'Anti-Malarial'],
  ['Anti Viral', 'Anti-Viral'],
  ['Chronic / Cardiac', 'Chronic-Cardiac'],
  ['Erectile Dysfunction', 'ED'],
  ['Hormones & Steroids', 'Hormones-Steroids'],
  ['Pain Relief', 'Pain-Killers'],
  ['Skin / Allergy / Asthma', 'Skin-Allergy-Asthma'],
  ['Supplements & Hair', 'Supplements-Vitamins-Hair'],
]);
const normalizeCategoryLabel = (label) => LEGACY_CATEGORY_MAP.get(label) || label;

export default function ShopByCategory() {
  const [searchParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Filter states - preselect from ?category= so "Browse Category" links
  // from the Shop by Category cards land pre-filtered. The URL carries the
  // raw category name (e.g. "Pain Relief"), so it needs the same
  // normalization the filter checkboxes use (e.g. "Pain-Killers").
  const [selectedCategory, setSelectedCategory] = useState(
    () => normalizeCategoryLabel(searchParams.get('category') || '')
  );
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  // Determine max price dynamically so newly added higher-priced items aren't hidden by default
  const maxPriceInData = useMemo(() => {
    const values = medicines.map((m) => parseMedicinePrice(m));
    const max = values.length ? Math.max(...values) : 50;
    return Math.max(50, Math.ceil(max));
  }, [medicines]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(() => maxPriceInData);
  // Preselect from ?search= too, so the navbar search box's "view all
  // results" submission lands here pre-filtered, same as ?category= above.
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [sort, setSort] = useState('Featured');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const PAGE_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const meds = await fetchMedicines();
        if (!active) return;
        setMedicines(Array.isArray(meds) ? meds : []);
        setError('');
      } catch (err) {
        console.error('Failed to load medicines', err);
        if (active) setError('Unable to load medicines right now.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMaxPrice(maxPriceInData);
  }, [maxPriceInData]);

  // Animation refs
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [filtersRef, filtersVisible] = useScrollAnimation(0.1, 200);
  const [productsRef] = useScrollAnimation(0.1, 400);

  // Derive filter values dynamically from data
  const toLabel = (c) => {
    const s = typeof c === 'string' ? c : (c?.label ?? c?.name ?? '');
    return String(s).trim();
  };
  const normalizeString = (s) => String(s || '').trim().toLowerCase();
  const normalizeCategory = normalizeCategoryLabel;
  const categories = useMemo(() => {
    const set = new Set();
    // From medicines present in data
    for (const m of medicines) {
      const cats = Array.isArray(m.categories) && m.categories.length ? m.categories : [m.category];
      cats
        .map(toLabel)
        .filter(Boolean)
        .map(normalizeCategory)
        .forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, [medicines]);
  const manufacturers = useMemo(() => {
    return Array.from(new Set(medicines.map(m => m.manufacturer).filter(Boolean))).sort();
  }, [medicines]);
  const forms = useMemo(() => {
    return Array.from(new Set(medicines.map(m => m.form).filter(Boolean))).sort();
  }, [medicines]);

  // Product counts per filter option, so the sidebar can show "Antibiotics (12)"
  // etc. without a separate API call - derived from the same in-memory list
  // (minus deletedAt) that backs the filters themselves.
  const activeMedicines = useMemo(() => medicines.filter(m => !m.deletedAt), [medicines]);
  const categoryCounts = useMemo(() => {
    const map = new Map();
    for (const m of activeMedicines) {
      const cats = Array.isArray(m.categories) && m.categories.length ? m.categories : [m.category];
      cats.map(toLabel).filter(Boolean).map(normalizeCategory).forEach(c => {
        map.set(c, (map.get(c) || 0) + 1);
      });
    }
    return map;
  }, [activeMedicines]);
  const manufacturerCounts = useMemo(() => {
    const map = new Map();
    for (const m of activeMedicines) {
      if (m.manufacturer) map.set(m.manufacturer, (map.get(m.manufacturer) || 0) + 1);
    }
    return map;
  }, [activeMedicines]);
  const formCounts = useMemo(() => {
    const map = new Map();
    for (const m of activeMedicines) {
      if (m.form) map.set(m.form, (map.get(m.form) || 0) + 1);
    }
    return map;
  }, [activeMedicines]);

  const filtered = useMemo(() => {
    let list = medicines.filter(m => !m.deletedAt).slice();
    const selectedCategoryNorm = normalizeString(selectedCategory);
    if (selectedCategory) list = list.filter(m => {
      const cats = Array.isArray(m.categories) && m.categories.length ? m.categories : [m.category];
      const normalizedCats = cats
        .filter(Boolean)
        .map(normalizeCategory)
        .map(normalizeString);
      return normalizedCats.includes(selectedCategoryNorm);
    });
    if (selectedManufacturer) list = list.filter(m => m.manufacturer === selectedManufacturer);
    if (selectedForm) list = list.filter(m => m.form === selectedForm);
    list = list.filter((m) => {
      const price = parseMedicinePrice(m);
      return price >= Number(minPrice) && price <= Number(maxPrice);
    });
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => (m.name + ' ' + (m.description || '')).toLowerCase().includes(s));
    }
    if (sort === 'Price: Low to High') list.sort((a, b) => parseMedicinePrice(a) - parseMedicinePrice(b));
    if (sort === 'Price: High to Low') list.sort((a, b) => parseMedicinePrice(b) - parseMedicinePrice(a));
    if (sort === 'Name: A-Z') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [medicines, selectedCategory, selectedManufacturer, selectedForm, minPrice, maxPrice, search, sort]);

  // Active filter chips shown above the grid, each individually removable.
  const activeFilters = useMemo(() => {
    const chips = [];
    if (search) chips.push({ key: 'search', label: `"${search}"`, clear: () => setSearch('') });
    if (selectedCategory) chips.push({ key: 'category', label: selectedCategory, clear: () => setSelectedCategory('') });
    if (selectedManufacturer) chips.push({ key: 'manufacturer', label: selectedManufacturer, clear: () => setSelectedManufacturer('') });
    if (selectedForm) chips.push({ key: 'form', label: selectedForm, clear: () => setSelectedForm('') });
    if (Number(minPrice) > 0 || Number(maxPrice) < maxPriceInData) {
      chips.push({ key: 'price', label: `$${minPrice} - $${maxPrice}`, clear: () => { setMinPrice(0); setMaxPrice(maxPriceInData); } });
    }
    return chips;
  }, [search, selectedCategory, selectedManufacturer, selectedForm, minPrice, maxPrice, maxPriceInData]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedManufacturer, selectedForm, minPrice, maxPrice, search, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);

  // If NO filters/search applied, we want to show ALL products (already true) but animate them.
  // const isPristine = !selectedCategory && !selectedManufacturer && !selectedForm && !search && sort === 'Featured' && Number(maxPrice) === 50;

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedManufacturer('');
    setSelectedForm('');
    setMinPrice(0);
    setMaxPrice(maxPriceInData);
    setSearch('');
    setSort('Featured');
  };

  return (
    <div className="shop-page root-bg">
      <SEO
        title="Shop Medicines"
        description="Browse our complete range of healthcare products by category, manufacturer, and form — submit an inquiry on any medicine to get started."
        path="/shop"
      />
      <div className="container">
        {/* page header moved above the content so it appears under the logo/nav */}
        <div 
          ref={headerRef}
          className={`page-header ${animationClasses.fadeUp(headerVisible)}`}
        >
          <div className="left">
            <h1>Shop Medicines</h1>
            <p className="muted">Browse our complete range of healthcare products</p>
          </div>

          <div className="controls">
            <div className="controls-left">
              <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"/>
                </svg>
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Product Count and Sort Section */}
        <div className="product-summary-section" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <div className="product-count" style={{
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Showing {filtered.length} products {isLoading ? '(loading...)' : ''}
          </div>
          
          <div className="sort-section" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <label htmlFor="shop-sort-select" style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Sort by:
            </label>
            <select
              id="shop-sort-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                fontSize: '14px',
                color: '#374151',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name: A-Z</option>
            </select>
            <div className="view-toggle" role="group" aria-label="Switch product view">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                aria-pressed={viewMode === 'grid'}
                aria-label="Grid view"
                onClick={() => setViewMode('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                aria-pressed={viewMode === 'list'}
                aria-label="List view"
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecdd3', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div className="content">
          <aside 
            ref={filtersRef}
            className={`filters-card ${showFilters ? 'filters-card-mobile-open' : ''} ${animationClasses.fadeLeft(filtersVisible)}`}
            onClick={(e) => {
              // Close when clicking backdrop on mobile
              if (e.target === e.currentTarget && window.innerWidth <= 768) {
                setShowFilters(false);
              }
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Filters</h3>
                <button
                  className="close-filters-btn"
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setShowFilters(false)}
                  style={{ 
                    display: 'none',
                    background: 'none', 
                    border: 'none', 
                    fontSize: '24px', 
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div className="filter-section">
                <div className="filter-title">Category</div>
                {categories.map(cat => (
                  <label className="filter-row" key={String(cat)}>
                    <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => {
                      setSelectedCategory(cat);
                      if (window.innerWidth <= 768) setTimeout(() => setShowFilters(false), 300);
                    }} />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <div className="filter-title">Manufacturer</div>
                {manufacturers.map(m => (
                  <label className="filter-row" key={m}>
                    <input type="radio" name="manufacturer" checked={selectedManufacturer === m} onChange={() => {
                      setSelectedManufacturer(m);
                      if (window.innerWidth <= 768) setTimeout(() => setShowFilters(false), 300);
                    }} />
                    <span>{m}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <div className="filter-title">Form</div>
                {forms.map(f => (
                  <label className="filter-row" key={f}>
                    <input type="radio" name="form" checked={selectedForm === f} onChange={() => {
                      setSelectedForm(f);
                      if (window.innerWidth <= 768) setTimeout(() => setShowFilters(false), 300);
                    }} />
                    <span>{f}</span>
                  </label>
                ))}
              </div>

              <div className="filter-section">
                <label className="filter-title" htmlFor="price-range">Price Range</label>
                <input id="price-range" className="price-range" type="range" min="0" max={maxPriceInData} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
                <div className="price-legend"><span>$0</span><span>${maxPrice}</span></div>
              </div>

              <button className="clear-btn" onClick={() => {
                clearFilters();
                if (window.innerWidth <= 768) setTimeout(() => setShowFilters(false), 300);
              }}>Clear Filters</button>
            </div>
          </aside>

          <main 
            ref={productsRef}
            className={`products`}
          >
            <div className="shop-grid">
              {filtered.map((med, index) => (
                <AnimatedCard key={med.slug || med._id} index={index} delay={0} stagger={false}>
                  <MedicineCard product={med} />
                </AnimatedCard>
              ))}
              {filtered.length === 0 && !isLoading && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                  No products match your filters.
                </div>
              )}
              {isLoading && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                  Loading products...
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}