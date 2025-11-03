import React from 'react';
import './navbar.css';

export default function Navbar({ search, setSearch }) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand">
          <img src="/vite.svg" alt="logo" className="brand-logo" />
          <span className="brand-title">MedCare</span>
        </div>

        <div className="nav-search">
          <div className="search-wrap">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines..." />
          </div>
        </div>

        <nav className="nav-links">
          <a href="#">Shop by Category</a>
          <a href="#">About Us</a>
          <a href="#">Contact</a>
          <div className="nav-controls">
            <select>
              <option>USD $</option>
              <option>INR ₹</option>
            </select>
            <button className="cart">🛒</button>
          </div>
        </nav>
      </div>
    </header>
  );
}
