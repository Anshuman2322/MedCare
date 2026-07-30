import React, { useState } from "react";
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';

const FAQ_ITEMS = [
  {
    question: 'How long does shipping take?',
    answer: 'Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 day delivery.',
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Currently, we only ship within the United States. International shipping is coming soon.',
  },
  {
    question: 'Are prescriptions required?',
    answer: 'Some medications require a valid prescription. Submit an inquiry for the product you need and our team will follow up with you to verify your prescription before fulfilling the order.',
  },
];

export default function Contact() {
  const [, setFormHover] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Animation refs
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [formRef, formVisible] = useScrollAnimation(0.1, 200);
  const [contactInfoRef, contactInfoVisible] = useScrollAnimation(0.1, 300);
  const [faqHeaderRef, faqHeaderVisible] = useScrollAnimation(0.1, 100);
  const [faqListRef, faqListVisible] = useScrollAnimation(0.1, 200);


  return (
    <div className="bg-white min-h-screen">
      {/* Top Section */}
      <div className="w-full bg-sky-50/60 pb-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
          <div 
            ref={headerRef}
            className={`text-center ${animationClasses.fadeUp(headerVisible)}`}
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Contact Us</h1>
            <p className="text-gray-600 text-base sm:text-lg mb-8 sm:mb-10 font-normal">
              Have questions? We're here to help. Reach out to our team anytime.
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
              <form>
                <h2 className="font-bold text-xl sm:text-2xl text-gray-900 mb-6">Send us a message</h2>
                <div className="mb-4 sm:mb-5">
                  <label htmlFor="contact-name" className="block font-medium text-gray-900 mb-2">Name</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="mb-4 sm:mb-5">
                  <label htmlFor="contact-email" className="block font-medium text-gray-900 mb-2">Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="contact-message" className="block font-medium text-gray-900 mb-2">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    placeholder="How can we help you?"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50/50 text-sm sm:text-base resize-vertical focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-emerald-700 text-white font-semibold text-sm sm:text-base rounded-lg py-3 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                >
                  Send Message
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
                    <a href="mailto:support@cureneed.com" className="hover:text-emerald-600 transition-colors">support@cureneed.com</a><br />
                    <a href="mailto:orders@cureneed.com" className="hover:text-emerald-600 transition-colors">orders@cureneed.com</a>
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
                    <a href="tel:1-800-633-2273" className="hover:text-emerald-600 transition-colors">1-800-MED-CARE (1-800-633-2273)</a>
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
                  <div className="text-gray-700 text-xs sm:text-sm">
                    CureNeed Health Inc.<br />
                    123 Market Street, Suite 400<br />
                    Wilmington, DE 19801<br />
                    United States
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="bg-emerald-50 text-emerald-600 rounded-lg p-2 sm:p-2.5 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Business Hours</div>
                  <div className="text-gray-700 text-xs sm:text-sm">
                    Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                    Saturday: 10:00 AM - 4:00 PM EST<br />
                    Sunday: Closed
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 mt-6 text-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <div className="text-gray-600 text-sm sm:text-base">Map Location</div>
            </div>
          </div>
        </div>
      </div>
      {/* FAQ Section */}
      <div className="bg-sky-50/60 py-12 sm:py-16 lg:py-20 mt-8 sm:mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Business Details section moved back to About page */}
          <div 
            ref={faqHeaderRef}
            className={`text-center mb-8 sm:mb-12 ${animationClasses.fadeUp(faqHeaderVisible)}`}
          >
            <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div
            ref={faqListRef}
            className={`space-y-3 sm:space-y-4 ${animationClasses.fadeUp(faqListVisible)}`}
          >
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              const panelId = `faq-panel-${index}`;
              const buttonId = `faq-button-${index}`;
              return (
                <div
                  key={item.question}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:border-sky-200 overflow-hidden"
                >
                  <h3 className="m-0">
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                      className="w-full flex items-center justify-between gap-4 text-left p-4 sm:p-6 lg:p-7"
                    >
                      <span className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg">{item.question}</span>
                      <svg
                        className={`w-5 h-5 flex-shrink-0 text-emerald-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={`grid transition-all duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed px-4 sm:px-6 lg:px-7 pb-4 sm:pb-6 lg:pb-7">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer is rendered globally in App.jsx */}
    </div>
  );
}
