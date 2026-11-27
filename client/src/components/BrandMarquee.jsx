import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useCatalogue from '../hooks/useCatalogue';
import { brandsFromCatalogue } from '../utils/catalogue';
import './brandMarquee.css';

// Below this the strip looks empty and cannot loop seamlessly, so it stays hidden.
const MIN_BRANDS = 6;

function BrandIcon({ icon }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  switch (icon) {
    case 'shield':
      return <svg {...common}><path d="M12 3l7 3v5c0 4.8-3 9.2-7 10-4-.8-7-5.2-7-10V6l7-3z" /><path d="M9.3 12.4l1.7 1.7 3.8-4.1" /></svg>;
    case 'cross':
      return <svg {...common}><rect x="10" y="4" width="4" height="16" rx="1.2" /><rect x="4" y="10" width="16" height="4" rx="1.2" /></svg>;
    case 'leaf':
      return <svg {...common}><path d="M4 20c8 0 14-6 14-14C10 6 4 12 4 20z" /><path d="M4.8 19.2c3-5 7-9 12-12" /></svg>;
    case 'droplet':
      return <svg {...common}><path d="M12 3s7 7.4 7 12a7 7 0 11-14 0c0-4.6 7-12 7-12z" /></svg>;
    case 'eye':
      return <svg {...common}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></svg>;
    case 'hexagon':
      return <svg {...common}><path d="M12 3l7 4v10l-7 4-7-4V7z" /><circle cx="12" cy="12" r="1.8" /></svg>;
    case 'heart':
      return <svg {...common}><path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6c-2.5 4.65-9.5 9-9.5 9z" /><path d="M6 12h2.5l1.5-3 2 6 1.5-3H18" /></svg>;
    case 'wave':
      return <svg {...common}><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" /></svg>;
    case 'capsule':
    default:
      return <svg {...common}><rect x="3" y="9" width="18" height="6" rx="3" /><line x1="12" y1="9" x2="12" y2="15" /></svg>;
  }
}

function BrandItem({ brand, copy }) {
  return (
    <li className="brand-marquee-item">
      <Link
        to={`/shop?search=${encodeURIComponent(brand.name)}`}
        className="brand-logo"
        style={{ '--brand-color': brand.color }}
        tabIndex={copy ? -1 : undefined}
        title={`See ${brand.name} products`}
      >
        <BrandIcon icon={brand.icon} />
        <span>{brand.name}</span>
      </Link>
    </li>
  );
}

export default function BrandMarquee() {
  const { status, medicines } = useCatalogue();
  const brands = useMemo(() => (status === 'loading' ? null : brandsFromCatalogue(medicines)), [status, medicines]);

  if (brands && brands.length < MIN_BRANDS) return null;

  // Constant scroll speed however many brands the catalogue has.
  const duration = `${Math.max(30, (brands?.length || 0) * 3.2)}s`;
  return (
    <section className="brand-marquee-section" aria-labelledby="brand-marquee-title">
      <div className="brand-marquee-head">
        <h2 id="brand-marquee-title" className="brand-marquee-eyebrow">
          {brands ? `${brands.length}+ brands in our catalogue` : 'Brands in our catalogue'}
        </h2>
      </div>
      <div className="brand-marquee" style={{ '--marquee-duration': duration }}>
        {!brands && (
          <div className="brand-marquee-skeleton" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => <span key={i} />)}
          </div>
        )}
        {brands && (
          <div className="brand-marquee-track">
            <ul className="brand-marquee-list">
              {brands.map((brand) => <BrandItem key={brand.name} brand={brand} />)}
            </ul>
            {/* Second copy only makes the loop seamless; screen readers and keyboards skip it. */}
            <ul className="brand-marquee-list brand-marquee-copy" aria-hidden="true">
              {brands.map((brand) => <BrandItem key={brand.name} brand={brand} copy />)}
            </ul>
          </div>
        )}
      </div>
      <p className="brand-marquee-note">
        Brand names belong to their respective owners and are shown only to identify products listed on CureNeed.
      </p>
    </section>
  );
}
