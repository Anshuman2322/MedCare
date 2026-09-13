import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../store/useStore.jsx';
import { formatPrice } from '../utils/currency';
import { resolveMedicineImage } from '../utils/medicineDisplay.js';
import { getCategoryBadgeStyle } from '../utils/categoryColors.js';
import ImagePlaceholder from './common/ImagePlaceholder.jsx';
import './medicineCard.css';

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}

function packLabel(variant) {
  if (!variant) return '';
  const size = (variant.packSize || '').trim();
  const type = (variant.packagingType || '').trim();
  if (size && type) return `${type} · ${size}`;
  return size || type;
}

export default function MedicineCard({ product, layout = 'grid' }) {
  const [loaded, setLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const imageSrc = resolveMedicineImage(product, 480);
  const category = Array.isArray(product.categories) && product.categories.length ? product.categories[0] : product.category;
  const categoryStyle = getCategoryBadgeStyle(category);
  const variant = product?.variants?.[0];
  const pack = packLabel(variant);

  const goToDetails = () => {
    const slugOrId = product?.slug || product?._id;
    if (slugOrId) navigate(`/medicine/${slugOrId}`);
  };

  const handleAddToCart = (event) => {
    event.stopPropagation();
    // No cart system exists yet on the site - this is a UI placeholder that
    // gives feedback without persisting anything.
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div className={`card card--${layout} ${loaded ? 'is-loaded' : 'is-loading'}`}>
      <div className="card-image">
        {product.requiresPrescription && <span className="card-rx-badge">Rx Required</span>}
        {!loaded && !imageError && <div className="img-skeleton" aria-hidden />}
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt={product.name}
            width="480"
            height="480"
            loading="lazy"
            onError={() => {
              setLoaded(true);
              setImageError(true);
            }}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <ImagePlaceholder className="h-full w-full" />
        )}
      </div>
      <div className="card-body">
        {category && (
          <span
            className="card-category-badge"
            style={{ '--badge-bg': categoryStyle.bg, '--badge-text': categoryStyle.text, '--badge-border': categoryStyle.border }}
          >
            {category}
          </span>
        )}
        <div className="card-title">{product.name}</div>
        {pack && <div className="card-pack">{pack}</div>}
        <div className="card-price" key={`price-${currency}`}>
          {formatPrice(product?.variants?.[0]?.price ?? product.price ?? 0, currency)}
        </div>
        <div className="card-actions">
          <button className="card-btn" type="button" onClick={goToDetails}>
            View Details
          </button>
          <button
            className={`card-btn card-btn-cart ${justAdded ? 'is-added' : ''}`}
            type="button"
            aria-label={`Add ${product.name} to cart`}
            onClick={handleAddToCart}
          >
            <CartIcon />
            <span>{justAdded ? 'Added' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
