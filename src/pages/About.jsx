import React from 'react';
import Footer from '../components/Footer';
import aboutTeam from '../assets/about-team.jpg';

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600">{value}</div>
    <div className="mt-1 text-gray-600">{label}</div>
  </div>
);

export default function About() {
  return (
    <div className="bg-white">
      {/* Header hero - clean and simple */}
      <section className="bg-sky-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-20 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">About MedCare</h1>
          <p className="mt-4 max-w-3xl mx-auto text-gray-600 text-base sm:text-lg leading-7">
            Delivering trusted healthcare products to families across America
            <br />
            since 2010
          </p>
        </div>
      </section>

      {/* Mission section - stacked text then image (matches screenshot) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="grid grid-cols-1 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">Our Mission</h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                At MedCare, we believe everyone deserves access to quality healthcare products.
                Our mission is to make essential medicines and health products easily accessible
                through our online platform, delivering directly to your doorstep.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                We work tirelessly to ensure every product meets the highest safety and quality
                standards, partnering only with certified manufacturers and distributors.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <div className="relative aspect-video w-full h-full">
                <img
                  src={aboutTeam}
                  alt="MedCare professional team"
                  className="absolute inset-0 w-full h-[1200px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why trust section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">Why Trust MedCare</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 ring-1 ring-emerald-100 shadow-sm flex items-center justify-center mb-4">
                <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FDA Approved</h3>
              <p className="text-gray-600 text-sm leading-relaxed">All products certified by FDA and meet US healthcare standards</p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 ring-1 ring-emerald-100 shadow-sm flex items-center justify-center mb-4">
                <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">WHO Compliant</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Following World Health Organization quality guidelines</p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 ring-1 ring-emerald-100 shadow-sm flex items-center justify-center mb-4">
                <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4 13 5.567 13 7.5 14.343 11 16 11z"/><path d="M2 20v-1a7 7 0 0114 0v1"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Team</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Licensed pharmacists and healthcare professionals on staff</p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 ring-1 ring-emerald-100 shadow-sm flex items-center justify-center mb-4">
                <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer First</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Dedicated support team available to help with any questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-sky-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="500K+" label="Happy Customers" />
            <Stat value="2000+" label="Products Available" />
            <Stat value="50+" label="Partner Brands" />
            <Stat value="24/7" label="Customer Support" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
