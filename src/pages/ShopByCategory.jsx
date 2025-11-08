import React, { useMemo, useState } from 'react';
import medicinesData from '../data/medicines.json';
import { productImages } from '../utils/images';
import MedicineCard from '../components/MedicineCard';
import Navbar from '../components/Navbar';
import { useScrollAnimation, animationClasses, AnimatedCard } from '../utils/animations.jsx';
import './ShopByCategory.css';

export default function ShopByCategory() {
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [maxPrice, setMaxPrice] = useState(100);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Featured');
  const [showFilters, setShowFilters] = useState(false);

  // Animation refs
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [filtersRef, filtersVisible] = useScrollAnimation(0.1, 200);
  const [productsRef, productsVisible] = useScrollAnimation(0.1, 400);

  // Use fixed lists to match the screenshot order and exact labels
  const categories = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Skincare'];
  const brands = ['HealthCare Plus', 'MediPro', 'VitaBoost', 'CureWell'];
  const forms = ['Tablet', 'Capsule', 'Liquid', 'Cream'];

  const filtered = useMemo(() => {
    let list = medicinesData.slice();
    // attach resolved image URL from imageKey for consistent rendering
    list = list.map(m => ({ ...m, image: productImages[m.imageKey] || m.image }));
    if (selectedCategory) list = list.filter(m => m.category === selectedCategory);
    if (selectedBrand) list = list.filter(m => m.brand === selectedBrand);
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
  }, [selectedCategory, selectedBrand, selectedForm, maxPrice, search, sort]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedForm('');
    setMaxPrice(100);
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
              <div className="muted">Showing {filtered.length} products</div>
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
            <div className="sort-wrapper">
              <label className="sort-label">Sort by:</label>
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Name: A-Z</option>
              </select>
            </div>
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
                <div className="filter-title">Brand</div>
                {brands.map(b => (
                  <label className="filter-row" key={b}>
                    <input type="radio" name="brand" checked={selectedBrand === b} onChange={() => {
                      setSelectedBrand(b);
                      if (window.innerWidth <= 768) setTimeout(() => setShowFilters(false), 300);
                    }} />
                    <span>{b}</span>
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
                <input className="price-range" type="range" min="0" max="100" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
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
            className={`products ${animationClasses.fadeRight(productsVisible)}`}
          >
            {(!selectedCategory && !selectedBrand && !selectedForm && Number(maxPrice) === 100 && !search && sort === 'Featured') ? (
              <div className="space-y-10">
                {categories.map((cat, catIndex) => {
                  const items = medicinesData
                    .filter((m) => m.category === cat)
                    .map((m) => ({ ...m, image: productImages[m.imageKey] || m.image }))
                    .slice(0, 3);
                  return (
                    <section key={cat}>
                      <div className="grid">
                        {items.map((med, index) => (
                          <AnimatedCard key={med.id} index={index + (catIndex * 3)} delay={200}>
                            <MedicineCard product={med} />
                          </AnimatedCard>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="grid">
                {filtered.map((med, index) => (
                  <AnimatedCard key={med.id} index={index} delay={200}>
                    <MedicineCard product={med} />
                  </AnimatedCard>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}