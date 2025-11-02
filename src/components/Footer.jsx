import React from 'react';

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center text-center">
    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <p className="mt-2 text-gray-600 text-sm max-w-xs">{desc}</p>
  </div>
);

const Footer = () => {
  return (
    <div className="w-full">
      {/* Top features strip */}
      <section className="bg-sky-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <FeatureItem
              title="FDA Approved"
              desc="All products are certified and safe"
              icon={
                <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              }
            />
            <FeatureItem
              title="Fast Delivery"
              desc="Quick shipping across USA"
              icon={
                <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
                </svg>
              }
            />
            <FeatureItem
              title="Expert Support"
              desc="Professional healthcare guidance"
              icon={
                <svg className="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Footer links */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">About MedCare</h4>
              <p className="mt-3 text-gray-600 text-sm leading-6">
                Your trusted online pharmacy delivering quality healthcare products across the USA.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Quick Links</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a className="text-gray-600 hover:text-emerald-600" href="#">Shop</a></li>
                <li><a className="text-gray-600 hover:text-emerald-600" href="#">About Us</a></li>
                <li><a className="text-gray-600 hover:text-emerald-600" href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Policies</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a className="text-gray-600 hover:text-emerald-600" href="#">Privacy Policy</a></li>
                <li><a className="text-gray-600 hover:text-emerald-600" href="#">Terms of Service</a></li>
                <li><a className="text-gray-600 hover:text-emerald-600" href="#">Shipping Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Contact</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>Email: <a className="hover:text-emerald-600" href="mailto:support@medcare.com">support@medcare.com</a></li>
                <li>Phone: 1-800-MED-CARE</li>
                <li>Hours: Mon-Fri 9AM-6PM EST</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
            © 2025 MedCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
