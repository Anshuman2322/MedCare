import React, { useMemo, useState } from 'react';
import medicinesData from '../data/medicines.json';
import MedicineCard from '../components/MedicineCard';
import Navbar from '../components/Navbar';
import './ShopByCategory.css';

const unique = (arr, key) => Array.from(new Set(arr.map(i => i[key]))).filter(Boolean);

export default function ShopByCategory() {
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [maxPrice, setMaxPrice] = useState(100);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Featured');

  // Use fixed lists to match the screenshot order and exact labels
  const categories = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Skincare'];
  const brands = ['HealthCare Plus', 'MediPro', 'VitaBoost', 'CureWell'];
  const forms = ['Tablet', 'Capsule', 'Liquid', 'Cream'];

  const filtered = useMemo(() => {
    let list = medicinesData.slice();
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
      <Navbar search={search} setSearch={setSearch} />

      <div className="container">
        {/* page header moved above the content so it appears under the logo/nav */}
        <div className="page-header">
          <div className="left">
            <h1>Shop Medicines</h1>
            <p className="muted">Browse our complete range of healthcare products</p>
          </div>

          <div className="controls">
            <div className="muted">Showing {filtered.length} products</div>
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
          <aside className="filters-card">
            <h3>Filters</h3>
            <div className="filter-section">
              <div className="filter-title">Category</div>
              {categories.map(cat => (
                <label className="filter-row" key={cat}>
                  <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} />
                  <span>{cat}</span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <div className="filter-title">Brand</div>
              {brands.map(b => (
                <label className="filter-row" key={b}>
                  <input type="radio" name="brand" checked={selectedBrand === b} onChange={() => setSelectedBrand(b)} />
                  <span>{b}</span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <div className="filter-title">Form</div>
              {forms.map(f => (
                <label className="filter-row" key={f}>
                  <input type="radio" name="form" checked={selectedForm === f} onChange={() => setSelectedForm(f)} />
                  <span>{f}</span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <div className="filter-title">Price Range</div>
              <input className="price-range" type="range" min="0" max="100" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              <div className="price-legend"><span>$0</span><span>${maxPrice}</span></div>
            </div>

            <button className="clear-btn" onClick={clearFilters}>Clear Filters</button>
          </aside>

          <main className="products">

            <div className="grid">
              {filtered.map(med => (
                <MedicineCard key={med.id} product={med} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
