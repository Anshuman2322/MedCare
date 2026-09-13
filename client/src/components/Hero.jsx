import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import './heroSection.css';

const slides = [
  { image: '/hero/hero-trusted-medicines.webp', eyebrow: 'Trusted medicines', title: 'Confidence in every order' },
  { image: '/hero/hero-quality-assurance.webp', eyebrow: 'Quality assurance', title: 'Standards you can see' },
  { image: '/hero/hero-verified-suppliers.webp', eyebrow: 'Verified suppliers', title: 'Sourced with certainty' },
  { image: '/hero/hero-product-catalog.webp', eyebrow: 'Product catalog', title: 'One marketplace, more choice' },
  { image: '/hero/hero-fast-delivery.webp', eyebrow: 'Fast delivery', title: 'Reliable by design' },
  { image: '/hero/hero-global-network.webp', eyebrow: 'Global network', title: 'Healthcare without borders' },
];
const stats = [{ value: 5000, suffix: '+', label: 'Medicines' }, { value: 150, suffix: '+', label: 'Brands' }, { value: 50, suffix: '+', label: 'Countries' }, { value: 24, suffix: '/7', label: 'Support' }];
const ease = [0.22, 1, 0.36, 1];
const Motion = motion;
const wrap = (n) => (n + slides.length) % slides.length;
const distanceFrom = (index, active) => { let n = index - active; if (n > slides.length / 2) n -= slides.length; if (n < -slides.length / 2) n += slides.length; return n; };

function CountUp({ value, suffix, active, reducedMotion }) {
  const [count, setCount] = useState(reducedMotion ? value : 0);
  useEffect(() => {
    if (!active) return undefined;
    if (reducedMotion) { setCount(value); return undefined; }
    const data = { n: 0 };
    const tween = gsap.to(data, { n: value, duration: 1.25, ease: 'power3.out', onUpdate: () => setCount(Math.round(data.n)) });
    return () => tween.kill();
  }, [active, reducedMotion, value]);
  return <>{count.toLocaleString()}{suffix}</>;
}

function Stats({ reducedMotion }) {
  const ref = useRef(null); const visible = useInView(ref, { once: true, amount: .4 });
  return <div ref={ref} className="coverflow-stats">{stats.map((stat, index) => <Motion.div key={stat.label} className="coverflow-stat" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5, delay: index * .07, ease }}><strong><CountUp {...stat} active={visible} reducedMotion={reducedMotion} /></strong><span>{stat.label}</span></Motion.div>)}</div>;
}

function Coverflow({ reducedMotion }) {
  const [active, setActive] = useState(0); const [interacting, setInteracting] = useState(false);
  const viewport = useRef(null); const startX = useRef(null); const dragId = useRef(null); const dragging = useRef(false); const frame = useRef(null); const inView = useInView(viewport, { once: true, amount: .15 });
  const step = useCallback((direction) => setActive((current) => wrap(current + direction)), []);
  useEffect(() => { if (reducedMotion || interacting || !inView) return undefined; const timer = window.setInterval(() => step(1), 5000); return () => window.clearInterval(timer); }, [inView, interacting, reducedMotion, step]);
  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);
  const setParallax = (event) => { if (reducedMotion || !viewport.current) return; const box = viewport.current.getBoundingClientRect(); const x = ((event.clientX - box.left) / box.width - .5) * 2; const y = ((event.clientY - box.top) / box.height - .5) * 2; if (frame.current) cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(() => { viewport.current?.style.setProperty('--tilt-x', `${-y * 3}deg`); viewport.current?.style.setProperty('--tilt-y', `${x * 6}deg`); }); };
  const resetParallax = () => { viewport.current?.style.setProperty('--tilt-x', '0deg'); viewport.current?.style.setProperty('--tilt-y', '0deg'); };
  const onWheel = (event) => { if (Math.abs(event.deltaY) < 5) return; event.preventDefault(); setInteracting(true); step(event.deltaY > 0 ? 1 : -1); window.setTimeout(() => setInteracting(false), 550); };
  const onDown = (event) => { startX.current = event.clientX; dragId.current = event.pointerId; dragging.current = false; setInteracting(true); };
  const onMove = (event) => { if (startX.current === null || event.pointerId !== dragId.current) return; if (!dragging.current && Math.abs(event.clientX - startX.current) > 8) { dragging.current = true; event.currentTarget.setPointerCapture?.(event.pointerId); } };
  const onUp = (event) => { if (dragging.current) { const travel = event.clientX - startX.current; if (Math.abs(travel) > 35) step(travel < 0 ? 1 : -1); event.currentTarget.releasePointerCapture?.(event.pointerId); } dragging.current = false; startX.current = null; window.setTimeout(() => setInteracting(false), 350); };
  return <Motion.div ref={viewport} className="coverflow-viewport" aria-roledescription="carousel" aria-label="CureNeed marketplace highlights" initial={reducedMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 95, damping: 19, delay: .2 }} onMouseMove={setParallax} onMouseLeave={resetParallax} onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
    <div className="coverflow-float"><div className="coverflow-stage">{slides.map((slide, index) => { const distance = distanceFrom(index, active); const absoluteDistance = Math.abs(distance); const isActive = distance === 0; const visible = absoluteDistance <= 2; const x = absoluteDistance === 1 ? 220 : absoluteDistance === 2 ? 420 : 0; const rotate = absoluteDistance === 1 ? 35 : absoluteDistance === 2 ? 55 : 0; const depth = absoluteDistance === 1 ? -160 : absoluteDistance === 2 ? -320 : 0; const scale = absoluteDistance === 1 ? .82 : absoluteDistance === 2 ? .65 : 1; const opacity = absoluteDistance === 1 ? .75 : absoluteDistance === 2 ? .35 : 1; return <article key={slide.image} className={`coverflow-card${isActive ? ' is-active' : ''}${absoluteDistance === 2 ? ' is-far' : ''}`} aria-hidden={!isActive} onClick={() => !isActive && setActive(index)} style={{ '--flow-x': `${Math.sign(distance) * x}px`, '--flow-rotate': `${Math.sign(distance) * rotate}deg`, '--flow-z': `${depth}px`, '--flow-scale': scale, '--flow-opacity': visible ? opacity : 0, '--flow-order': String(10 - absoluteDistance) }}><div className="coverflow-card-media"><img src={slide.image} alt={isActive ? slide.title : ''} loading={index === 0 ? 'eager' : 'lazy'} draggable="false" /><div className="coverflow-card-glass" /></div><div className="coverflow-card-caption"><span>{slide.eyebrow}</span><strong>{slide.title}</strong></div><div className="coverflow-reflection" /></article>; })}</div></div><div className="coverflow-pedestal" aria-hidden="true" />
    <div className="coverflow-controls" aria-label="Carousel controls"><button type="button" onClick={() => step(-1)} aria-label="Previous highlight">{'\u2190'}</button><div className="coverflow-pagination" aria-label={`Slide ${active + 1} of ${slides.length}`}>{slides.map((slide, index) => <button type="button" key={slide.image} className={index === active ? 'is-current' : ''} onClick={() => setActive(index)} aria-label={`Show ${slide.eyebrow}`} />)}</div><button type="button" onClick={() => step(1)} aria-label="Next highlight">{'\u2192'}</button></div>
  </Motion.div>;
}

export default function Hero() {
  const reducedMotion = useReducedMotion(); const enter = (delay) => reducedMotion ? {} : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: .72, delay, ease } };
  return <section className="premium-hero" aria-labelledby="hero-title"><div className="hero-ambient" aria-hidden="true"><i className="hero-glow" /><i className="hero-blur hero-blur-one" /><i className="hero-blur hero-blur-two" /><span className="hero-particle particle-one" /><span className="hero-particle particle-two" /><span className="hero-particle particle-three" /></div><div className="hero-shell"><div className="hero-copy"><Motion.div {...enter(0)} className="hero-trust-pill"><span>{'\u2713'}</span> Verified Healthcare Marketplace</Motion.div><Motion.h1 id="hero-title" {...enter(.08)}><span>Trusted medicines.</span><span className="hero-highlight">Delivered with clarity.</span></Motion.h1><Motion.p {...enter(.16)}>Discover verified pharmaceutical products, trusted suppliers and transparent healthcare procurement{'\u2014'}all in one modern marketplace.</Motion.p><Motion.div {...enter(.24)} className="hero-actions"><Link to="/shop" className="hero-primary">Explore Medicines <span>{'\u2192'}</span></Link><Link to="/contact" className="hero-secondary"><i>{'\u2197'}</i> Talk to an Expert</Link></Motion.div><Motion.div {...enter(.31)} className="hero-review"><div className="review-avatars" aria-hidden="true"><b>AM</b><b>DR</b><b>SK</b><b>JT</b></div><div><span>{'\u2605\u2605\u2605\u2605\u2605'}</span><p>Trusted by healthcare professionals worldwide</p></div></Motion.div><Motion.div {...enter(.4)}><Stats reducedMotion={reducedMotion} /></Motion.div></div><Coverflow reducedMotion={reducedMotion} /></div></section>;
}
