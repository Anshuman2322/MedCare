import React from 'react';
import { Link } from 'react-router-dom';
import './medicineCard.css';

export default function MedicineCard({ product }) {
  return (
    <div className="card">
      <div className="card-image">
        <img src={product.image || product.imageUrl} alt={product.name} />
      </div>
      <div className="card-body">
        <div className="card-category">{product.category}</div>
        <div className="card-title">{product.name}</div>
        <div className="card-price">${product.price.toFixed(2)}</div>
        <Link className="card-btn" to={`/products/${product.id}`}>View Details</Link>
      </div>
    </div>
  );
}
