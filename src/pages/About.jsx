import React, { useState, useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import aboutTeam from '../assets/about-team.jpg';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';

const HeaderHero = () => {
  const [ref, isVisible] = useScrollAnimation(0.1);

  return (
    <section className="bg-sky-50 border-b border-gray-100">
      <div 
        ref={ref}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-20 sm:py-24 text-center ${animationClasses.fadeUp(isVisible)}`}
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">About MedCare</h1>
        <p className="mt-4 max-w-3xl mx-auto text-gray-600 text-base sm:text-lg leading-7">
          Delivering trusted healthcare products to families across America
          <br />
          since 2010
        </p>
      </div>
    </section>
  );
};

const MissionSection = () => {
  const [imageRef, imageVisible] = useScrollAnimation(0.1);
  const [textRef, textVisible] = useScrollAnimation(0.1, 200);
  const [cardsRef, cardsVisible] = useScrollAnimation(0.1, 400);

  return (
    <section className="py-18">
      <div className="pl-34 max-w-9xl mx-auto pl-4 sm:px-6 lg:px-10 xl:px-19">
        <div className="pl-70 grid md:grid-cols-2 gap-10 items-center justify-center">
          {/* Image left */}
          <div 
            ref={imageRef}
            className={`order-1 md:order-none flex justify-center md:justify-start ${animationClasses.fadeLeft(imageVisible)}`}
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200 w-full  max-w-[800px] sm:max-w-[620px] md:max-w-[640px] lg:max-w-[680px] xl:max-w-[720px]">
              <div className="relative aspect-video">
                <img
                  src={aboutTeam}
                  alt="MedCare professional team"
                  className=""
                />
              </div>
            </div>
          </div>
          {/* Text and feature cards */}
          <div className="max-w-2xl">
            <div 
              ref={textRef}
              className={`transition-all duration-1000 ease-out ${
                textVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100 mb-6">
                OUR MISSION
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                Making Healthcare <span className="text-emerald-600">Accessible</span> to Everyone
              </h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                At MedCare, we believe everyone deserves access to quality healthcare products.
                Our mission is to make essential medicines and health products easily accessible
                through our online platform, delivering directly to your doorstep.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                We work tirelessly to ensure every product meets the highest safety and quality
                standards, partnering only with certified manufacturers and distributors.
              </p>
            </div>
            {/* Feature cards */}
            <div 
              ref={cardsRef}
              className={`flex flex-wrap gap-4 sm:flex-nowrap transition-all duration-1000 ease-out ${
                cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex items-center gap-4 flex-1 min-w-0 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <div className="text-sm font-medium text-gray-900">Quality Assured</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex items-center gap-4 flex-1 min-w-0 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <div className="text-sm font-medium text-gray-900">Fast Delivery</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex items-center gap-4 flex-1 min-w-0 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <div className="text-sm font-medium text-gray-900">24/7 Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ValuesSection = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [card1Ref, card1Visible] = useScrollAnimation(0.1, 100);
  const [card2Ref, card2Visible] = useScrollAnimation(0.1, 200);
  const [card3Ref, card3Visible] = useScrollAnimation(0.1, 300);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div 
          ref={headerRef}
          className={`text-center mb-12 transition-all duration-1000 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">These principles guide everything we do</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 sm:flex-nowrap">
          <div 
            ref={card1Ref}
            className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-left flex-1 max-w-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <circle cx="12" cy="12" r="8"/>
                <circle cx="12" cy="12" r="13"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality</h3>
            <p className="text-gray-600 text-sm leading-relaxed">We never compromise on the quality of products. Every item is verified and stored under proper conditions to maintain efficacy.</p>
          </div>
          <div 
            ref={card2Ref}
            className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-left flex-1 max-w-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Trust</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Building lasting relationships with our customers through transparency, reliability, and consistent delivery of genuine products.</p>
          </div>
          <div 
            ref={card3Ref}
            className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-left flex-1 max-w-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="h-12 w-12 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20"/>
                <path d="M2 12h20"/>
                <path d="M7.5 7.5l9 9"/>
                <path d="M7.5 16.5l9-9"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Accessibility</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Making healthcare products accessible to everyone, regardless of location, through fast and secure delivery services.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const TrustSection = () => {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [card1Ref, card1Visible] = useScrollAnimation(0.1, 100);
  const [card2Ref, card2Visible] = useScrollAnimation(0.1, 200);
  const [card3Ref, card3Visible] = useScrollAnimation(0.1, 300);
  const [card4Ref, card4Visible] = useScrollAnimation(0.1, 400);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Trust MedCare</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">We maintain the highest standards in healthcare product delivery</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 sm:flex-nowrap">
          <div 
            ref={card1Ref}
            className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center flex-1 max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">FDA Approved</h3>
            <p className="text-gray-600 text-sm leading-relaxed">All products certified by FDA and meet US healthcare standards</p>
          </div>
          <div 
            ref={card2Ref}
            className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center flex-1 max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">WHO Compliant</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Following World Health Organization quality guidelines</p>
          </div>
          <div 
            ref={card3Ref}
            className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center flex-1 max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4 13 5.567 13 7.5 14.343 11 16 11z"/><path d="M2 20v-1a7 7 0 0114 0v1"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Expert Team</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Licensed pharmacists and healthcare professionals on staff</p>
          </div>
          <div 
            ref={card4Ref}
            className={`bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center flex-1 max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer First</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Dedicated support team available to help with any questions</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const [ref, isVisible] = useScrollAnimation(0.1);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div 
          ref={ref}
          className={`rounded-2xl border border-gray-100 bg-sky-50/60 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          <div>
            <h3 className="text-2xl font-bold text-gray-900">We're here to help</h3>
            <p className="mt-2 text-gray-600">Questions about products or orders? Our team is ready to assist.</p>
          </div>
          <div className="flex gap-3">
            <a href="#" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 transition-colors">Contact Support</a>
            <a href="/shop" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-colors">Shop Now</a>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <section className="bg-sky-50/60 overflow-hidden">
      <div 
        ref={ref}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 lg:gap-20">
          <Stat value="500K+" label="Happy Customers" />
          <Stat value="2000+" label="Products Available" />
          <Stat value="50+" label="Partner Brands" />
          <Stat value="24/7" label="Customer Support" />
        </div>
      </div>
    </section>
  );
};

const Stat = ({ value, label }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  // Check if this is a time value (contains "/") - don't animate these
  const isTimeValue = value.includes('/');
  
  // Extract numeric value and suffix
  const numericValue = parseInt(value.replace(/\D/g, '')) || 0;
  const suffix = value.replace(/\d/g, '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && numericValue > 0 && !isTimeValue) {
      let startTime = null;
      const duration = 2500; // 2.5 seconds for smoother animation

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(easeOutQuart * numericValue);
        
        setAnimatedValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isVisible, numericValue, isTimeValue]);

  // For time values, show the full value immediately when visible
  // For numeric values, show animation or 0 based on visibility
  const displayValue = isTimeValue 
    ? (isVisible ? value : value) 
    : (isVisible ? `${animatedValue}${suffix}` : `0${suffix}`);

  return (
    <div ref={ref} className="text-center min-w-[140px]">
      <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-emerald-600 mb-2">
        {displayValue}
      </div>
      <div className="text-gray-600 text-sm sm:text-base font-medium">{label}</div>
    </div>
  );
};

const ValueCard = ({ icon, title, desc }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-6 hover:shadow-md transition-shadow">
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 text-gray-600 text-sm leading-6">{desc}</p>
  </div>
);

export default function About() {
  return (
    <div className="bg-white">
      {/* Header hero - clean and simple */}
      <HeaderHero />

      {/* Mission section - updated per latest design (image left, cards under text) */}
      <MissionSection />

      {/* Values - themed cards */}
      <ValuesSection />

      {/* Why trust section */}
      <TrustSection />

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="rounded-2xl border border-gray-100 bg-sky-50/60 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">We’re here to help</h3>
              <p className="mt-2 text-gray-600">Questions about products or orders? Our team is ready to assist.</p>
            </div>
            <div className="flex gap-3">
              <a href="#" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 transition-colors">Contact Support</a>
              <a href="/shop" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-colors">Shop Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <StatsSection />

      <Footer />
    </div>
  );
}
