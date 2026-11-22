import React, { useState } from "react";
import SEO from '../components/SEO.jsx';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import { CONTACT } from '../config/contact.js';
import HelpOptions from '../components/HelpOptions.jsx';
import OrderSteps from '../components/OrderSteps.jsx';
import TopFaqs from '../components/faq/TopFaqs.jsx';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function Contact() {
  const [, setFormHover] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data?.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setForm({ name: '', email: '', message: '' });
      setStatus('success');
    } catch {
      setErrorMessage('Unable to reach the server. Please try again later.');
      setStatus('error');
    }
  }

  // Animation refs
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [formRef, formVisible] = useScrollAnimation(0.1, 200);
  const [contactInfoRef, contactInfoVisible] = useScrollAnimation(0.1, 300);



  return (
    <div className="bg-white min-h-screen">
      <SEO
        title="Contact Us"
        description="Have questions about a medicine or your inquiry? Reach the CureNeed team by email, phone, or the form below."
        path="/contact"
      />
      {/* Top Section */}
      <div className="w-full bg-sky-50/60 pb-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          <div 
            ref={headerRef}
            className={`text-center ${animationClasses.fadeUp(headerVisible)}`}
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Contact Us</h1>
            <p className="text-gray-600 text-base sm:text-lg mb-8 sm:mb-10 font-normal">
              Questions about a medicine, a quote or your delivery? Send us a message, chat with us, or call.
            </p>
          </div>
        </div>
      </div>
      {/* Main Content: centered single-column layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-8 lg:gap-12">
          {/* Form in card - centered */}
          <div 
            ref={formRef}
            className={`w-full max-w-2xl ${animationClasses.fadeUp(formVisible)}`}
          >
            <div
              onMouseEnter={() => setFormHover(true)}
              onMouseLeave={() => setFormHover(false)}
              className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 sm:p-8 lg:p-10 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:border-sky-200"
            >
              <form onSubmit={handleSubmit}>
                <h2 className="font-bold text-xl sm:text-2xl text-gray-900 mb-6">Send us a message</h2>
                <div className="mb-4 sm:mb-5">
                  <label htmlFor="contact-name" className="block font-medium text-gray-900 mb-2">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="mb-4 sm:mb-5">
                  <label htmlFor="contact-email" className="block font-medium text-gray-900 mb-2">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="contact-message" className="block font-medium text-gray-900 mb-2">Message</label>
                  <textarea
                    id="contact-message"
                    placeholder="How can we help you?"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50/50 text-sm sm:text-base resize-vertical focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                {status === 'success' && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Thanks for reaching out — we've received your message and will get back to you soon.
                  </div>
                )}
                {status === 'error' && (
                  <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-emerald-500 text-white font-semibold text-sm sm:text-base rounded-lg py-3 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-60"
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
          {/* Contact Info - centered */}
          <div 
            ref={contactInfoRef}
            className={`w-full max-w-2xl ${animationClasses.fadeUp(contactInfoVisible)}`}
          >
            <h2 className="font-bold text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">Get in touch</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed text-center">
              Our customer support team is available to assist you with any questions or concerns.
              Feel free to reach out through any of the following channels.
            </p>
            
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-emerald-50 text-emerald-600 rounded-lg p-2 sm:p-2.5 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="3"/>
                    <path d="M3 7l9 6 9-6"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Email</div>
                  <div className="text-gray-700 text-xs sm:text-sm">
                    <a href={`mailto:${CONTACT.email}`} className="hover:text-emerald-600 transition-colors break-all">{CONTACT.email}</a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-emerald-50 text-emerald-600 rounded-lg p-2 sm:p-2.5 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Phone</div>
                  <div className="text-gray-700 text-xs sm:text-sm">
                    <a href={CONTACT.phoneHref} className="hover:text-emerald-600 transition-colors">{CONTACT.phone}</a>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-emerald-50 text-emerald-600 rounded-lg p-2 sm:p-2.5 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Address</div>
                  <address className="text-gray-700 text-xs sm:text-sm not-italic">
                    {CONTACT.address.map((line, i) => (
                      <React.Fragment key={line}>
                        {i > 0 && <br />}
                        {line}
                      </React.Fragment>
                    ))}
                  </address>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-emerald-50 text-emerald-600 rounded-lg p-2 sm:p-2.5 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M6 22v-2a6 6 0 0112 0v2"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Contact Person</div>
                  <div className="text-gray-700 text-xs sm:text-sm">
                    {CONTACT.person}
                    {CONTACT.role ? ` (${CONTACT.role})` : ''}
                  </div>
                </div>
              </div>
              
            </div>
            
            <div className="bg-sky-50/60 rounded-xl border border-sky-100 p-5 sm:p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">To help us reply faster, include</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                <li>The medicine name, strength and quantity you need</li>
                <li>Your country or delivery location</li>
                <li>Your inquiry reference, if you already sent one (like CN-2026-0018)</li>
              </ul>
              <p className="mt-3 text-sm text-gray-600">
                We reply by email. We haven't published fixed support hours, so we don't promise a reply time, but every message reaches our team.
                Please don't send card numbers or passwords.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Other ways to get help */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <h2 className="font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight text-center mb-6">Other ways to get help</h2>
        <HelpOptions />
      </div>
      <div className="bg-sky-50/60 py-12 sm:py-16 mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <OrderSteps />
          <TopFaqs heading="Frequently asked questions" intro="Quick answers to what buyers ask us most." />
        </div>
      </div>

      {/* Footer is rendered globally in App.jsx */}
    </div>
  );
}
