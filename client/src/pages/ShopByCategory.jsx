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

// Rows per batch, and the grid's column count at each width (matches the
// .shop-grid breakpoints in ShopByCategory.css).
const ROWS_PER_BATCH = 4;
const MOBILE_BATCH = 6;
const LIST_BATCH = 8;
const gridColumns = (width) => (width <= 640 ? 1 : width <= 768 ? 2 : 3);
const viewportWidth = () => (typeof window === 'undefined' ? 1024 : window.innerWidth);

function usePageSize(viewMode) {
  const [width, setWidth] = useState(viewportWidth);
  useEffect(() => {
    const onResize = () => setWidth(viewportWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  if (viewMode === 'list') return LIST_BATCH;
  const columns = gridColumns(width);
  return columns === 1 ? MOBILE_BATCH : columns * ROWS_PER_BATCH;
}

export default function ShopByCategory() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  // The search text lives in the URL (?search=), so the page's own search box,
  // the navbar search ("view all results") and shared links always agree,
  // including a new search made while already on this page.
  const search = searchParams.get('search') || '';
  const setSearch = (value) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set('search', value);
        else next.delete('search');
        return next;
      },
      { replace: true }
    );
  };
  const [sort, setSort] = useState('Featured');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  // Products are shown in batches of whole rows ("Show more" adds a batch).
  const pageSize = usePageSize(viewMode);
  const [pages, setPages] = useState(1);

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
  const [filtersRef] = useScrollAnimation(0.1, 200);
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

  // New filters, search or sort start again from the first batch.
  useEffect(() => {
    setPages(1);
  }, [selectedCategory, selectedManufacturer, selectedForm, minPrice, maxPrice, search, sort]);

  const visibleCount = pages * pageSize;
  const visibleProducts = filtered.slice(0, visibleCount);
  const remaining = Math.max(0, filtered.length - visibleCount);

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
          className={`page-header cn-hero shop-hero ${animationClasses.fadeUp(headerVisible)}`}
        >
          <span className="cn-hero-grid" aria-hidden="true" />
          <div className="left">
            <span className="cn-eyebrow shop-eyebrow">Branded generics from Indian manufacturers</span>
            <h1>Shop <span className="cn-accent">Medicines</span></h1>
            <p className="muted">Browse our complete range of healthcare products</p>
            <form className="shop-search" role="search" onSubmit={(event) => event.preventDefault()}>
              <svg className="shop-search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                aria-label="Search medicines on this page"
                placeholder="Search by medicine, brand or ingredient"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </form>
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
          <div className="product-count" role="status" aria-live="polite" style={{
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {isLoading
              ? 'Loading products...'
              : remaining > 0
                ? `Showing ${visibleProducts.length} of ${filtered.length} products`
                : `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
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
            className={`filters-card ${showFilters ? 'filters-card-mobile-open' : ''}`}
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
            <div className={`shop-grid ${viewMode === 'list' ? 'shop-grid--list' : ''}`}>
              {visibleProducts.map((med, index) => (
                <AnimatedCard key={med.slug || med._id} index={index} delay={0} stagger={false}>
                  <MedicineCard product={med} layout={viewMode} />
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

            {remaining > 0 && (
              <div className="show-more">
                <button type="button" className="show-more-btn" onClick={() => setPages((p) => p + 1)}>
                  Show more products
                  <span className="show-more-count">{remaining} more</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}