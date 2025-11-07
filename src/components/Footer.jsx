import React from 'react';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';

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
  const [footerRef, footerVisible] = useScrollAnimation(0.1);
  const [copyrightRef, copyrightVisible] = useScrollAnimation(0.1, 200);

  return (
    <div className="w-full">
      {/* Footer links */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-10">
          <div 
            ref={footerRef}
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 ${animationClasses.fadeUp(footerVisible)}`}
          >
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
          <div 
            ref={copyrightRef}
            className={`mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-500 ${animationClasses.fadeUp(copyrightVisible)}`}
          >
            © 2025 MedCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
