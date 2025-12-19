import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';
import './medicineCard.css';

export default function MedicineCard({ product }) {
  const [loaded, setLoaded] = useState(false);
  const { currency } = useCurrency();
  
  return (
    <div className={`card ${loaded ? 'is-loaded' : 'is-loading'}`}>
      <div className="card-image">
        {!loaded && <div className="img-skeleton" aria-hidden />}
        <img 
          src={product.image || product.imageUrl} 
          alt={product.name} 
          loading="lazy" 
          onLoad={() => setLoaded(true)}
        />
      </div>
      <div className="card-body">
        <div className="card-category">{Array.isArray(product.categories) && product.categories.length ? product.categories[0] : product.category}</div>
        <div className="card-title">{product.name}</div>
        <div className="card-price" key={`price-${currency}`}>{formatPrice(product.price, currency)}</div>
        <Link className="card-btn" to={`/products/${product.id}`}>View Details</Link>
      </div>
    </div>
  );
}
