import './brandMarquee.css';

const BRANDS = [
  { name: 'Vertex Health', icon: 'shield', color: '#00a86b' },
  { name: 'NovaCare', icon: 'cross', color: '#2563eb' },
  { name: 'PureLeaf Naturals', icon: 'leaf', color: '#16a34a' },
  { name: 'Solace Labs', icon: 'droplet', color: '#0ea5e9' },
  { name: 'Meridian Rx', icon: 'capsule', color: '#7c3aed' },
  { name: 'Zenith Biotech', icon: 'hexagon', color: '#db2777' },
  { name: 'TrueHeart Care', icon: 'heart', color: '#e11d48' },
  { name: 'Northfield Pharma', icon: 'wave', color: '#ea580c' },
  { name: 'Auravita', icon: 'star', color: '#ca8a04' },
  { name: 'Beacon Wellness', icon: 'diamond', color: '#0891b2' },
];

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
    case 'capsule':
      return <svg {...common}><rect x="3" y="9" width="18" height="6" rx="3" /><line x1="12" y1="9" x2="12" y2="15" /></svg>;
    case 'hexagon':
      return <svg {...common}><path d="M12 3l7 4v10l-7 4-7-4V7z" /><circle cx="12" cy="12" r="1.8" /></svg>;
    case 'heart':
      return <svg {...common}><path d="M12 20s-7-4.35-9.5-9A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6c-2.5 4.65-9.5 9-9.5 9z" /><path d="M6 12h2.5l1.5-3 2 6 1.5-3H18" /></svg>;
    case 'wave':
      return <svg {...common}><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" /></svg>;
    case 'star':
      return <svg {...common}><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L12 16.9 6.4 20l1.4-6.2L3 9.5l6.4-.6z" /></svg>;
    case 'diamond':
      return <svg {...common}><path d="M6 9l6-6 6 6-6 12z" /><path d="M6 9h12" /></svg>;
    default:
      return null;
  }
}

function BrandLogo({ name, icon, color }) {
  return <span className="brand-logo" style={{ '--brand-color': color }}><BrandIcon icon={icon} /><span>{name}</span></span>;
}

export default function BrandMarquee() {
  const track = [...BRANDS, ...BRANDS];
  return (
    <section className="brand-marquee-section" aria-label="Trusted healthcare brands">
      <div className="brand-marquee-head">
        <span className="brand-marquee-eyebrow">Trusted by 150+ leading healthcare brands worldwide</span>
      </div>
      <div className="brand-marquee">
        <div className="brand-marquee-track" aria-hidden="true">
          {track.map((brand, index) => <BrandLogo key={`${brand.name}-${index}`} {...brand} />)}
        </div>
      </div>
    </section>
  );
}
