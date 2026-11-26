import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/SEO.jsx';
import OrderSteps from '../components/OrderSteps.jsx';
import TopFaqs from '../components/faq/TopFaqs.jsx';
import useCatalogue from '../hooks/useCatalogue';
import useOverallRating from '../hooks/useOverallRating';
import { catalogueStats } from '../utils/catalogue';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import { BUSINESS } from '../config/business';
import aboutTeam from '../assets/about-team.jpg';

// Everything this page says about the business is either on public record
// (GST, IEC, the IndiaMART profile and its reviews), supplied by the owner
// (buyer countries), true of how the site works (free quotes, 24/7 chat), or
// counted live from the catalogue. No certifications, licences or founding
// dates that cannot be shown.
const { indiamart, countries } = BUSINESS;

const HeaderHero = () => {
  const [ref, isVisible] = useScrollAnimation(0.1);
  const overall = useOverallRating();

  return (
    <section className="cn-hero bg-sky-50 border-b border-gray-100">
      <span className="cn-hero-grid" aria-hidden="true" />
      <div 
        ref={ref}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-20 sm:py-24 text-center ${animationClasses.fadeUp(isVisible)}`}
      >
        <span className="cn-eyebrow">IndiaMART TrustSEAL verified</span>
        <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold text-gray-900">About <span className="cn-accent">CureNeed</span></h1>
        <p className="mt-4 max-w-3xl mx-auto text-gray-600 text-base sm:text-lg leading-7">
          Supplying branded generic medicines to buyers across the USA, UK, Canada,
          <br className="hidden sm:block" />
          {' '}Australia, India and beyond, with a clear quote for every request.
        </p>
        <div className="mt-6 min-h-[38px]">
          {overall.status !== 'loading' && (
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200 hover:ring-emerald-300"
            >
              <span className="tracking-[2px] text-amber-500" aria-hidden="true">{'★★★★★'}</span>
              Rated {overall.average.toFixed(1)}/5 by our buyers
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

const missionFeatures = [
  {
    label: 'Free Quote Requests',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </svg>
    ),
  },
  {
    label: 'Clear Product Details',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    ),
  },
  {
    label: 'GST & IEC Registered',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.8-3 9.2-7 10-4-0.8-7-5.2-7-10V6l7-3z" />
        <path d="M9.5 12.5l1.7 1.7 3.8-4.1" />
      </svg>
    ),
  },
  {
    label: '24/7 Chat Support',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
      </svg>
    ),
  },
];

const FeatureCard = ({ icon, label, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.5, delay: 0.15 + index * 0.1, ease: 'easeOut' }}
    whileHover={{ y: -4 }}
    className="cn-glow-soft flex h-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_14px_32px_rgba(16,185,129,0.16)] cursor-pointer"
  >
    <motion.div
      whileHover={{ scale: 1.12 }}
      transition={{ duration: 0.25 }}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
    >
      {icon}
    </motion.div>
    <span className="text-[16px] font-medium text-gray-900">{label}</span>
  </motion.div>
);

const MissionSection = () => {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F2FBF6_50%,#FFFFFF_100%)] py-16 sm:py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[45%_55%] lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[620px]"
          >
            <div className="absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.16),transparent_65%)] blur-2xl" />
            <div className="aspect-[4/3] overflow-hidden rounded-[24px] shadow-[0_30px_60px_rgba(15,23,42,0.18)] ring-1 ring-gray-100">
              <img
                src={aboutTeam}
                alt="Healthcare professionals in a pharmacy"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Text and feature cards */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-6 inline-flex items-center rounded-full bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100"
            >
              OUR MISSION
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
              className="mb-7 text-[40px] font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-[48px] lg:text-[56px]"
            >
              Making Healthcare <span className="text-emerald-600">Accessible</span> to Everyone
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.16, ease: 'easeOut' }}
              className="mb-5 text-[18px] leading-[1.8] text-gray-600"
            >
              At CureNeed, we believe finding the right medicine should be simple: clear product
              details, a fair quote, and a real person to answer your questions. That is how we
              serve buyers in {countries.length}+ countries today.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.24, ease: 'easeOut' }}
              className="mb-10 text-[18px] leading-[1.8] text-gray-600"
            >
              Every listing names the active ingredient, strength and pack size. Send a free
              request and our team replies with availability and price before anything is decided.
            </motion.p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {missionFeatures.map((feature, index) => (
                <FeatureCard key={feature.label} icon={feature.icon} label={feature.label} index={index} />
              ))}
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core <span className="cn-accent">Values</span><span className="cn-title-rule" aria-hidden="true" /></h2>
          <p className="text-gray-600 max-w-2xl mx-auto">These principles guide everything we do</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <div 
            ref={card1Ref}
            className={`cn-glow-soft bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 text-center sm:text-left hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-4 sm:mb-6 mx-auto sm:mx-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <circle cx="12" cy="12" r="8"/>
                <circle cx="12" cy="12" r="13"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality</h3>
            <p className="text-gray-600 text-sm leading-relaxed">We list branded medicines from established manufacturers and show the ingredient, strength and pack for each one, so you know exactly what you are asking about.</p>
          </div>
          <div 
            ref={card2Ref}
            className={`cn-glow-soft bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 text-center sm:text-left hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-4 sm:mb-6 mx-auto sm:mx-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Trust</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Clear quotes and straight answers about what we can and cannot supply. Our registration details are public and listed on this page.</p>
          </div>
          <div 
            ref={card3Ref}
            className={`cn-glow-soft bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 text-center sm:text-left hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-4 sm:mb-6 mx-auto sm:mx-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20"/>
                <path d="M2 12h20"/>
                <path d="M7.5 7.5l9 9"/>
                <path d="M7.5 16.5l9-9"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Accessibility</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Ask about any product from wherever you are. If it is not in the catalogue yet, send a request and our team will check whether we can source it.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const BusinessDetailsSection = () => {
  const [sectionRef, sectionVisible] = useScrollAnimation(0.1);

  // GST and IEC are shown masked (last 4 characters only) at the owner's
  // request. Only the masked form is kept in the code, so the full numbers
  // never reach the browser. They are shared with buyers on request.
  const details = [
    { label: 'GST Number', value: '•••••••••••N1ZD', masked: true, highlight: true },
    { label: 'Import Export Code (IEC)', value: '••••••766N', masked: true },
    { label: 'Legal Status of Firm', value: 'Proprietorship' },
    { label: 'Nature of Business', value: 'Service Provider and Others' },
    { label: 'GST Registration Date', value: '20-12-2024' },
    { label: 'Annual Turnover', value: '0 - 40 L' },
    { label: 'Total Number of Employees', value: 'Upto 10 People' },
  ];

  return (
    <section className="py-12 sm:py-16 bg-sky-50/60">
      <div 
        ref={sectionRef}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 transition-all duration-700 ${
          sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="text-center mb-6">
          <h2 className="font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">Business Details</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Our registration details. Full GST and IEC numbers are shared with buyers on request.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {details.map((d) => (
            <div
              key={d.label}
              className={`cn-glow-soft bg-white rounded-xl border p-4 shadow-sm ${
                d.highlight ? 'border-emerald-300 ring-2 ring-emerald-400 bg-emerald-50/40 sm:col-span-2' : 'border-gray-200'
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {d.label}
                {d.highlight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 ring-1 ring-emerald-200">
                    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified by IndiaMART
                  </span>
                )}
              </div>
              <div
                className={`flex items-center gap-2 ${
                  d.masked ? 'font-mono font-semibold tracking-wider' : 'font-medium'
                } ${d.highlight ? 'text-emerald-700' : 'text-gray-900'}`}
              >
                {d.masked && (
                  <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                  </svg>
                )}
                <span>
                  {d.masked && <span className="sr-only">Ending in </span>}
                  <span aria-hidden={d.masked || undefined}>{d.value}</span>
                  {d.masked && <span className="sr-only">{d.value.replace(/•/g, '')}</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// A plain status line under each IndiaMART badge (not a link).
const BadgeStatus = ({ children }) => (
  <div className="mt-3 inline-flex items-center text-emerald-600 font-semibold text-sm">
    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    {children}
  </div>
);

const TrustSection = () => {
  const overall = useOverallRating();
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [card1Ref, card1Visible] = useScrollAnimation(0.1, 100);
  const [card2Ref, card2Visible] = useScrollAnimation(0.1, 200);
  const [card3Ref, card3Visible] = useScrollAnimation(0.1, 300);
  const [card4Ref, card4Visible] = useScrollAnimation(0.1, 400);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Premium IndiaMART Certification Section - Moved to Top */}
        <div className="relative bg-linear-to-br from-emerald-50 via-emerald-100 to-emerald-200 rounded-3xl p-8 sm:p-12 border-2 border-emerald-300 shadow-2xl mb-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/30 rounded-3xl backdrop-blur-sm"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-linear-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-sm font-semibold mb-4 shadow-lg">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                IndiaMART Supplier
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Our IndiaMART Badges
              </h3>
              <p className="text-gray-700 text-lg max-w-2xl mx-auto">
                Shown on our supplier profile on IndiaMART, India's largest B2B marketplace
              </p>
            </div>

            <div className="w-full flex justify-center">
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center sm:items-stretch max-w-lg mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg border border-white/50 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-64">
                  <div className="mb-4">
                    <img
                      src="/indiamart_one.png"
                      alt="IndiaMART TrustSEAL badge"
                      className="h-12 sm:h-16 w-auto mx-auto object-contain hover:scale-110 transition-transform duration-300"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">TrustSEAL</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    IndiaMART verified our {indiamart.trustSeal.verified.join(', ')}. Certificate no. {indiamart.trustSeal.id}.
                  </p>
                  <BadgeStatus>TrustSEAL verified</BadgeStatus>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg border border-white/50 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-64">
                  <div className="mb-4">
                    <img
                      src="/indiamart_two.png"
                      alt="IndiaMART Verified Exporter badge"
                      className="h-12 sm:h-16 w-auto mx-auto object-contain hover:scale-110 transition-transform duration-300"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Verified Exporter</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">IndiaMART shows this badge for suppliers registered to export from India.</p>
                  <BadgeStatus>Export verified</BadgeStatus>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  GST verified
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
                  IEC holder
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-700 rounded-full mr-2"></div>
                  Verified exporter
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ease-out ${
            headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Trust <span className="cn-accent">CureNeed</span><span className="cn-title-rule" aria-hidden="true" /></h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Facts you can check for yourself</p>
        </div>
        {/* Standard Trust Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-items-center gap-6 mb-16">
          <div 
            ref={card1Ref}
            className={`cn-glow-soft bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center w-full max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="cn-icon-glow mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">TrustSEAL Verified</h3>
            <p className="text-gray-600 text-sm leading-relaxed">IndiaMART checked our GST registration, bank account and business address before awarding its TrustSEAL.</p>
          </div>
          <div 
            ref={card2Ref}
            className={`cn-glow-soft bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center w-full max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="cn-icon-glow mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18a14 14 0 010-18z"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Registered Exporter</h3>
            <p className="text-gray-600 text-sm leading-relaxed">We hold an Import Export Code (IEC), the registration India requires to export goods.</p>
          </div>
          <div 
            ref={card3Ref}
            className={`cn-glow-soft bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center w-full max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card3Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="cn-icon-glow mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L12 16.9 6.4 20l1.4-6.2L3 9.5l6.4-.6z"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rated {overall.average.toFixed(1)} / 5</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Average across all our review platforms.{' '}
              <Link to="/reviews" className="font-semibold text-emerald-700 hover:underline">
                Read every review
              </Link>
            </p>
          </div>
          <div 
            ref={card4Ref}
            className={`cn-glow-soft bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center w-full max-w-xs hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
              card4Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="cn-icon-glow mx-auto h-16 w-16 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7"/><path d="M18.5 14.5a6.5 6.5 0 013 5.5"/></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Buyers in {countries.length}+ Countries</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Including the USA, UK, Canada, Australia, New Zealand and India.</p>
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
            <a href="/contact" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 cn-btn-glow">Contact Support</a>
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
  const { status, medicines } = useCatalogue();
  const counts = useMemo(() => (status === 'ready' ? catalogueStats(medicines) : null), [status, medicines]);
  const overall = useOverallRating();

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

  // The product count is live from the catalogue and is left out if it cannot load.
  const showProducts = status !== 'error' && !(counts && !counts.products);

  return (
    <section className="bg-sky-50/60 overflow-hidden">
      <div 
        ref={ref}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-16 transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 lg:gap-20">
          {showProducts && <Stat value={counts?.products ?? null} suffix="+" label="Products Listed" />}
          <Stat value={countries.length} suffix="+" label="Countries Served" />
          <Stat value={overall.status === 'loading' ? null : overall.average} decimals={1} suffix="/5" label="Overall Rating" />
          <Stat text="24/7" label="Online Chat Support" />
        </div>
      </div>
    </section>
  );
};

// value: a number, or null while it loads (shown as a dash, never a guess).
// text: shown as-is instead of a counted number.
const Stat = ({ value, decimals = 0, suffix = '', text, label }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const numericValue = Number(value) || 0;
  const scale = 10 ** decimals;

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
    if (isVisible && numericValue > 0) {
      let startTime = null;
      const duration = 2500; // 2.5 seconds for smoother animation

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(easeOutQuart * numericValue * scale) / scale;
        
        setAnimatedValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isVisible, numericValue, scale]);

  const shown = (isVisible ? animatedValue : 0).toFixed(decimals);
  const displayValue = text || (value === null ? '–' : `${shown}${suffix}`);

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
  <div className="cn-glow-card rounded-xl border border-gray-100 bg-white p-6">
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
      <SEO
        title="About Us"
        description="CureNeed is a GST-registered Indian business sourcing branded generic medicines from established manufacturers. Send a free request and get a clear quote."
        path="/about"
      />
      {/* Header hero - clean and simple */}
      <HeaderHero />

      {/* Mission section - updated per latest design (image left, cards under text) */}
      <MissionSection />

      {/* Values - themed cards */}
      <ValuesSection />

      {/* Business details */}
      <BusinessDetailsSection />

      {/* Why trust section */}
      <TrustSection />

      {/* How ordering works + where we supply */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <OrderSteps />
          <div className="rounded-2xl border border-gray-100 bg-sky-50/60 p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Buyers we supply</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              We regularly supply buyers in these countries. For any other destination, send an inquiry and our team will confirm whether we can deliver there.
            </p>
            <ul className="flex flex-wrap justify-center gap-2">
              {countries.map((country) => (
                <li key={country} className="rounded-full bg-white border border-emerald-100 px-3 py-1 text-sm text-gray-700">{country}</li>
              ))}
            </ul>
          </div>
          <TopFaqs heading="Questions buyers ask us" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="rounded-2xl border border-gray-100 bg-sky-50/60 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">We’re here to help</h3>
              <p className="mt-2 text-gray-600">Questions about products or orders? Our team is ready to assist.</p>
            </div>
            <div className="flex gap-3">
              <a href="/contact" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 cn-btn-glow">Contact Support</a>
              <a href="/shop" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-colors">Shop Now</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <StatsSection />

      {/* Footer is rendered globally in App.jsx */}
    </div>
  );
}
