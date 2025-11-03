import React from 'react';
import './medicineCard.css';

export default function MedicineCard({ product }) {
  return (
    <div className="card">
      <div className="card-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="card-body">
        <div className="card-category">{product.category}</div>
        <div className="card-title">{product.name}</div>
        <div className="card-price">${product.price.toFixed(2)}</div>
        <button className="card-btn">View Details</button>
      </div>
    </div>
  );
}
