import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFaq } from '../../api/faq.js';

// Used if the questions can't be loaded: the same answers the FAQ page gives.
const FALLBACK = [
  { id: 'how-to-order', question: 'How do I place an order?', answer: 'CureNeed works on quotes rather than instant checkout. Send a quote request for the medicine and quantity you need; our team replies with availability, pricing, shipping and an estimated timeline, and nothing is final until you confirm the quote.' },
  { id: 'ship-countries', question: 'Which countries do you ship to?', answer: 'We regularly supply buyers in the United States, United Kingdom, Canada, Australia, New Zealand, India, Kuwait, Philippines, Bangladesh and Aruba. For any other destination, send an inquiry and our team will confirm.' },
  { id: 'prescription-needed', question: 'Do I need a prescription?', answer: 'Some medicines need a valid prescription. Each product page shows whether it is required, and our team confirms any verification steps for your country while preparing your quote.' },
];

const IDS = ['how-to-order', 'ship-countries', 'payment-methods', 'prescription-needed', 'bulk-orders', 'shipping-time'];

/** A short, expandable list of the most useful questions, with a link to the full FAQ page. */
export default function TopFaqs({ heading = 'Quick answers', intro = '' }) {
  const [items, setItems] = useState(FALLBACK);

  useEffect(() => {
    let live = true;
    fetchFaq()
      .then((data) => {
        const picked = IDS.map((id) => data.items.find((item) => item.id === id)).filter(Boolean);
        if (live && picked.length) setItems(picked);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <div>
      <div className="cn-reveal mb-6 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{heading}</h2>
        {intro && <p className="mt-2 text-sm text-gray-600 sm:text-base">{intro}</p>}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.id} className="cn-glow-soft group rounded-xl border border-gray-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 font-semibold text-gray-900 sm:px-5">
              {item.question}
              <span aria-hidden="true" className="text-emerald-600 transition-transform group-open:rotate-180">▾</span>
            </summary>
            <p className="whitespace-pre-line border-t border-gray-100 px-4 pb-4 pt-3 text-gray-700 leading-relaxed sm:px-5">{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link to="/faq" className="inline-flex items-center rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
          See all frequently asked questions →
        </Link>
      </div>
    </div>
  );
}
