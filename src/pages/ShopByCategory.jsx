import React, { useMemo, useState } from 'react';
import medicinesData from '../data/medicines.json';
import MedicineCard from '../components/MedicineCard';
import Navbar from '../components/Navbar';
import { useScrollAnimation, animationClasses, AnimatedCard } from '../utils/animations.jsx';
import './ShopByCategory.css';

export default function ShopByCategory() {
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [maxPrice, setMaxPrice] = useState(50);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Featured');
  const [showFilters, setShowFilters] = useState(false);

  // Animation refs
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [filtersRef, filtersVisible] = useScrollAnimation(0.1, 200);
  const [productsRef] = useScrollAnimation(0.1, 400);

  // Derive filter values dynamically from data
  const categories = useMemo(() => {
    return Array.from(new Set(medicinesData.map(m => m.category))).sort();
  }, []);
  const manufacturers = useMemo(() => {
    return Array.from(new Set(medicinesData.map(m => m.manufacturer).filter(Boolean))).sort();
  }, []);
  const forms = useMemo(() => {
    return Array.from(new Set(medicinesData.map(m => m.form).filter(Boolean))).sort();
  }, []);

  const filtered = useMemo(() => {
    let list = medicinesData.slice();
    if (selectedCategory) list = list.filter(m => m.category === selectedCategory);
    if (selectedManufacturer) list = list.filter(m => m.manufacturer === selectedManufacturer);
    if (selectedForm) list = list.filter(m => m.form === selectedForm);
    list = list.filter(m => Number(m.price) <= Number(maxPrice));
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => (m.name + ' ' + (m.description || '')).toLowerCase().includes(s));
    }
    if (sort === 'Price: Low to High') list.sort((a, b) => a.price - b.price);
    if (sort === 'Price: High to Low') list.sort((a, b) => b.price - a.price);
    if (sort === 'Name: A-Z') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [selectedCategory, selectedManufacturer, selectedForm, maxPrice, search, sort]);

  // If NO filters/search applied, we want to show ALL products (already true) but animate them.
  // const isPristine = !selectedCategory && !selectedManufacturer && !selectedForm && !search && sort === 'Featured' && Number(maxPrice) === 50;

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedManufacturer('');
    setSelectedForm('');
    setMaxPrice(50);
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
            Showing {filtered.length} products
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
                  <label className="filter-row" key={cat}>
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
                <input className="price-range" type="range" min="0" max="50" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
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
                <AnimatedCard key={med.id} index={index} delay={0} stagger={false}>
                  <MedicineCard product={med} />
                </AnimatedCard>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                  No products match your filters.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}