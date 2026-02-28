import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';
import './medicineCard.css';

export default function MedicineCard({ product }) {
  const [loaded, setLoaded] = useState(false);
  const { currency } = useCurrency();
  const navigate = useNavigate();
  
  return (
    <div className={`card ${loaded ? 'is-loaded' : 'is-loading'}`}>
      <div className="card-image">
        {!loaded && <div className="img-skeleton" aria-hidden />}
        <img 
          src={product.image} 
          alt={product.name} 
          loading="lazy" 
          onLoad={() => setLoaded(true)}
        />
      </div>
      <div className="card-body">
        <div className="card-category">{Array.isArray(product.categories) && product.categories.length ? product.categories[0] : product.category}</div>
        <div className="card-title">{product.name}</div>
        <div className="card-price" key={`price-${currency}`}>
          {formatPrice(product?.variants?.[0]?.price ?? product.price ?? 0, currency)}
        </div>
        <button
          className="card-btn"
          type="button"
          onClick={() => {
            console.log('Navigating to slug:', product?.slug, product?._id);
            const slugOrId = product?.slug || product?._id;
            if (slugOrId) {
              navigate(`/medicine/${slugOrId}`);
            }
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}
