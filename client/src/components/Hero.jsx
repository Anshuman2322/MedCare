import React, { useState } from 'react';
import heroPoster from '../assets/hero-pharmacy.jpg';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const heroStats = [
  { value: 100000, suffix: '+', label: 'Happy Customers' },
  { value: 5000, suffix: '+', label: 'Medicines' },
  { value: 49, suffix: '★', label: 'Average Rating' },
  { value: 24, suffix: '/7', label: 'Customer Support' },
];

const floatingCards = [
  { title: 'Fast Delivery', subtitle: 'Across the U.S.', tone: 'from-emerald-50 to-white', x: 'left-6 top-16' },
  { title: 'Doctor Recommended', subtitle: 'Trusted by families', tone: 'from-white to-slate-50', x: 'right-6 top-12' },
  { title: 'Licensed Pharmacy', subtitle: 'Professional handling', tone: 'from-sky-50 to-white', x: 'left-12 bottom-24' },
];

function TrustIcon({ type }) {
  const common = 'h-4 w-4 shrink-0';
  if (type === 'shield') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.8-3 9.2-7 10-4-0.8-7-5.2-7-10V6l7-3z" />
        <path d="M9.5 12.5l1.7 1.7 3.8-4.1" />
      </svg>
    );
  }
  if (type === 'lock') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 118 0v3" />
      </svg>
    );
  }
  if (type === 'truck') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="8" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12h16" />
      <path d="M12 4v16" />
    </svg>
  );
}

function StatCounter({ value, suffix, label, inView, reducedMotion }) {
  const [count, setCount] = useState(reducedMotion ? value : 0);

  React.useEffect(() => {
    if (!inView) return undefined;
    if (reducedMotion) {
      setCount(value);
      return undefined;
    }

    const duration = 900;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let frame = 0;

    const tick = () => {
      frame += 1;
      current = Math.min(value, Math.round(increment * frame));
      setCount(current);
      if (frame < steps) {
        window.setTimeout(tick, duration / steps);
      }
    };

    tick();
    return undefined;
  }, [inView, reducedMotion, value]);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="text-[24px] font-bold tracking-tight text-[#0F172A]">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-0.5 text-xs font-medium text-[#64748B]">{label}</div>
    </div>
  );
}

const Hero = () => {
  const prefersReducedMotion = useReducedMotion();
  const statsRef = React.useRef(null);
  const statsInView = useInView(statsRef, { amount: 0.35, once: true });

  return (
    <section className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F4FBF7_52%,#FFFFFF_100%)]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid min-h-[680px] grid-cols-1 items-center gap-16 py-14 sm:py-18 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:py-20 xl:min-h-[720px]">
          <div className="relative z-10 max-w-2xl lg:pr-6">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
              className="mt-8 text-[42px] font-bold leading-[1.03] tracking-[-0.04em] text-[#0F172A] sm:text-[56px] lg:text-[64px]"
            >
              Trusted medicines.
              <span className="block text-[#16A34A]">Fast delivery. Better health.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.16 }}
              className="mt-8 max-w-xl text-[18px] leading-8 text-[#64748B]"
            >
              Genuine medicines, affordable pricing, and dependable delivery for families across America.
              Find what you need quickly and order with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.24 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                to="/shop"
                className="inline-flex h-14 items-center justify-center rounded-full bg-[#16A34A] px-7 text-[16px] font-semibold text-white shadow-[0_12px_26px_-12px_rgba(22,163,74,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#15803D] hover:shadow-[0_18px_32px_-14px_rgba(22,163,74,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
              >
                Browse Medicines
              </Link>
              <Link
                to="/shop"
                className="inline-flex h-14 items-center justify-center rounded-full border border-[#C9D5E2] bg-white px-7 text-[16px] font-semibold text-[#0F172A] transition-all duration-200 hover:border-[#16A34A] hover:bg-[#F0FDF4] hover:text-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
              >
                Shop by Category
              </Link>
            </motion.div>

            <div ref={statsRef} className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {heroStats.map((stat) => (
                <StatCounter
                  key={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  inView={statsInView}
                  reducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[520px] items-center justify-center lg:min-h-[620px]">
            <div className="absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_50%_32%,rgba(34,197,94,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(240,253,244,0.8)_56%,rgba(255,255,255,0.94))]" />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.12 }}
              className="relative z-10 h-[520px] w-full max-w-[600px] overflow-hidden rounded-[40px] border border-white/70 bg-white/55 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur-sm lg:h-[620px]"
            >
              <motion.div
                className="absolute inset-0"
                animate={prefersReducedMotion ? undefined : { scale: [1, 1.05, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src={heroPoster}
                  alt="Premium pharmacy environment"
                  className="h-full w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/28" />

              <div className="absolute inset-0 p-5 sm:p-6">
                {floatingCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 14 }}
                    animate={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -8, 0] }}
                    transition={prefersReducedMotion
                      ? { duration: 0.5, delay: 0.14 + index * 0.08, ease: 'easeOut' }
                      : { duration: 6, delay: 0.14 + index * 0.08, repeat: Infinity, ease: 'easeInOut' }
                    }
                    className={`absolute ${card.x} w-[176px] rounded-[24px] border border-white/80 bg-gradient-to-br ${card.tone} p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-md sm:w-[212px]`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                        <TrustIcon type={index % 3 === 0 ? 'truck' : index % 3 === 1 ? 'shield' : 'lock'} />
                      </span>
                      {card.title}
                    </div>
                    <div className="mt-2 text-xs font-medium leading-5 text-[#64748B]">{card.subtitle}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 1440 120" className="h-20 w-full text-white sm:h-24" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0,48 C180,92 360,92 540,60 C720,28 900,28 1080,56 C1260,84 1350,104 1440,76 L1440,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;