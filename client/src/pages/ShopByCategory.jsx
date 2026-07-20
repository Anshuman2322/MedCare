import React, { useEffect, useMemo, useState } from 'react';
import MedicineCard from '../components/MedicineCard';
import { useScrollAnimation, animationClasses, AnimatedCard } from '../utils/animations.jsx';
import { parseMedicinePrice } from '../utils/medicineDisplay.js';
import './ShopByCategory.css';

export default function ShopByCategory() {
  const [medicines, setMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  // Determine max price dynamically so newly added higher-priced items aren't hidden by default
  const maxPriceInData = useMemo(() => {
    const values = medicines.map((m) => parseMedicinePrice(m));
    const max = values.length ? Math.max(...values) : 50;
    return Math.max(50, Math.ceil(max));
  }, [medicines]);
  const [maxPrice, setMaxPrice] = useState(() => maxPriceInData);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Featured');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://localhost:5002/api/medicines', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load');
        const meds = await res.json();
        if (!active) return;
        console.log('Fetched medicines:', meds);
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
  const LEGACY_CATEGORY_MAP = useMemo(() => new Map([
    ['Anti Cancer', 'Anti-Cancer'],
    ['Anti Malarial', 'Anti-Malarial'],
    ['Anti Viral', 'Anti-Viral'],
    ['Chronic / Cardiac', 'Chronic-Cardiac'],
    ['Erectile Dysfunction', 'ED'],
    ['Hormones & Steroids', 'Hormones-Steroids'],
    ['Pain Relief', 'Pain-Killers'],
    ['Skin / Allergy / Asthma', 'Skin-Allergy-Asthma'],
    ['Supplements & Hair', 'Supplements-Vitamins-Hair'],
  ]), []);
  const toLabel = (c) => {
    const s = typeof c === 'string' ? c : (c?.label ?? c?.name ?? '');
    return String(s).trim();
  };
  const normalizeString = (s) => String(s || '').trim().toLowerCase();
  const normalizeCategory = (label) => LEGACY_CATEGORY_MAP.get(label) || label;
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
    list = list.filter((m) => parseMedicinePrice(m) <= Number(maxPrice));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => (m.name + ' ' + (m.description || '')).toLowerCase().includes(s));
    }
    if (sort === 'Price: Low to High') list.sort((a, b) => parseMedicinePrice(a) - parseMedicinePrice(b));
    if (sort === 'Price: High to Low') list.sort((a, b) => parseMedicinePrice(b) - parseMedicinePrice(a));
    if (sort === 'Name: A-Z') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [medicines, selectedCategory, selectedManufacturer, selectedForm, maxPrice, search, sort]);

  // If NO filters/search applied, we want to show ALL products (already true) but animate them.
  // const isPristine = !selectedCategory && !selectedManufacturer && !selectedForm && !search && sort === 'Featured' && Number(maxPrice) === 50;

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedManufacturer('');
    setSelectedForm('');
    setMaxPrice(maxPriceInData);
    setSearch('');
    setSort('Featured');
  };

  return (
    <div className="shop-page root-bg">
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
            <span style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Sort by:
            </span>
            <select 
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
                <div className="filter-title">Price Range</div>
                <input className="price-range" type="range" min="0" max={maxPriceInData} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
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
            <div className="grid">
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