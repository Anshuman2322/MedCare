import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import './footerWordmarkButton.css';

const OFFSCREEN = -999;
// Fraction of the remaining distance closed per animation frame - this is
// what makes the spotlight trail the cursor. Confirmed empirically (in both
// Chromium and Firefox) that `transition: mask-image` does not actually
// interpolate the embedded `at var(--mx) var(--my)` position - getComputedStyle
// snaps straight to the target value on the very next frame - so the CSS
// transition was dropped and the trailing motion is driven from here instead.
const SPOTLIGHT_EASE = 0.35;

const Footer = () => {
  const [footerRef, footerVisible] = useScrollAnimation(0.1);
  const [copyrightRef, copyrightVisible] = useScrollAnimation(0.1, 200);
  const wordmarkRef = useRef(null);
  const spotlightState = useRef({ x: OFFSCREEN, y: OFFSCREEN, targetX: OFFSCREEN, targetY: OFFSCREEN, raf: null });

  const stepSpotlight = () => {
    const el = wordmarkRef.current;
    const state = spotlightState.current;
    if (!el) {
      state.raf = null;
      return;
    }
    state.x += (state.targetX - state.x) * SPOTLIGHT_EASE;
    state.y += (state.targetY - state.y) * SPOTLIGHT_EASE;
    el.style.setProperty('--mx', `${state.x}px`);
    el.style.setProperty('--my', `${state.y}px`);

    if (Math.hypot(state.targetX - state.x, state.targetY - state.y) > 0.5) {
      state.raf = requestAnimationFrame(stepSpotlight);
    } else {
      state.raf = null;
    }
  };

  const handleWordmarkMouseMove = (event) => {
    const el = wordmarkRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const state = spotlightState.current;
    state.targetX = event.clientX - rect.left;
    state.targetY = event.clientY - rect.top;
    if (!state.raf) {
      state.raf = requestAnimationFrame(stepSpotlight);
    }
  };

  const handleWordmarkMouseLeave = () => {
    const state = spotlightState.current;
    if (state.raf) {
      cancelAnimationFrame(state.raf);
    }
    state.x = state.targetX = OFFSCREEN;
    state.y = state.targetY = OFFSCREEN;
    state.raf = null;
    const el = wordmarkRef.current;
    if (el) {
      el.style.setProperty('--mx', `${OFFSCREEN}px`);
      el.style.setProperty('--my', `${OFFSCREEN}px`);
    }
  };

  useEffect(() => {
    return () => {
      if (spotlightState.current.raf) cancelAnimationFrame(spotlightState.current.raf);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Footer links */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-5 sm:py-6">
          <div
            ref={footerRef}
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 ${animationClasses.fadeUp(footerVisible)}`}
          >
            <div className="sm:col-span-2 lg:col-span-1">
              <img src="/logo.png" alt="CureNeed logo" className="h-[92px] sm:h-[112px] w-auto mb-2" />
              <p className="text-gray-600 text-sm leading-5 max-w-xs">
                Your trusted online pharmacy delivering quality healthcare products across the USA.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-gray-900">Quick Links</h4>
              <ul className="mt-1.5 space-y-3 text-base">
                <li><Link className="text-gray-600 hover:text-emerald-600 transition-colors" to="/shop">Shop</Link></li>
                <li><Link className="text-gray-600 hover:text-emerald-600 transition-colors" to="/about">About Us</Link></li>
                <li><Link className="text-gray-600 hover:text-emerald-600 transition-colors" to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-gray-900">Policies</h4>
              <ul className="mt-1.5 space-y-3 text-base">
                <li><Link className="text-gray-600 hover:text-emerald-600 transition-colors" to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link className="text-gray-600 hover:text-emerald-600 transition-colors" to="/terms-of-service">Terms of Service</Link></li>
                <li><Link className="text-gray-600 hover:text-emerald-600 transition-colors" to="/shipping-policy">Shipping Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-gray-900">Contact</h4>
              <ul className="mt-1.5 space-y-3 text-base text-gray-600">
                <li>Email: <a className="hover:text-emerald-600 transition-colors break-all" href="mailto:support@cureneed.com">support@cureneed.com</a></li>
                <li>Phone: <a className="hover:text-emerald-600 transition-colors" href="tel:1-800-MED-CARE">1-800-MED-CARE</a></li>
                <li>Hours: Mon-Fri 9AM-6PM EST</li>
              </ul>
            </div>
          </div>
          <div
            ref={copyrightRef}
            className={`mt-6 border-t border-gray-100 pt-3 text-center text-[11px] text-gray-400 ${animationClasses.fadeUp(copyrightVisible)}`}
          >
            © 2026 CureNeed. All rights reserved.
          </div>
        </div>

        {/* Closing wordmark - full-bleed (outside the max-w-7xl column above)
            so the corner blob can sit flush against the true footer edge.
            Static: no scroll animation. */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            paddingTop: '70px',
            paddingBottom: '26px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'left',
            background: 'transparent',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '-120px',
              top: '-140px',
              width: '480px',
              height: '480px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #A7F3D0 0%, #D1FAE5 45%, rgba(255,255,255,0) 72%)',
              filter: 'blur(2px)',
              zIndex: 0,
            }}
          />

          <p
            style={{
              fontSize: '11px',
              color: '#8A8A8A',
              letterSpacing: '0.08em',
              marginBottom: '12px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            TRUST IN EVERY DOSE
          </p>

          <button
            ref={wordmarkRef}
            type="button"
            aria-label="Scroll to top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onMouseMove={handleWordmarkMouseMove}
            onMouseLeave={handleWordmarkMouseLeave}
            className="footer-wordmark-btn"
            style={{
              display: 'inline-block',
              border: 'none',
              background: 'transparent',
              padding: 0,
              margin: 0,
              fontFamily: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 'clamp(56px, 11vw, 220px)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span aria-hidden="true" style={{ color: '#111111' }}>cureneed</span>
            <span aria-hidden="true" className="footer-wordmark-overlay">cureneed</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
