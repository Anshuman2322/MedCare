import React from 'react';
import { Link } from 'react-router-dom';

const openChat = () => window.dispatchEvent(new Event('cureneed:open-chat'));
const card = 'flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md';

/** Ways to get help besides the form: live chat, the FAQ, the shipping policy and the shop. */
export default function HelpOptions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button type="button" onClick={openChat} className={card}>
        <span className="mb-2 text-2xl" aria-hidden="true">💬</span>
        <span className="font-semibold text-gray-900">Chat with us</span>
        <span className="mt-1 text-sm text-gray-600">Ask a question, check an inquiry's status or talk to our team. Keep the chat open and we'll reply there.</span>
      </button>
      <Link to="/faq" className={card}>
        <span className="mb-2 text-2xl" aria-hidden="true">❓</span>
        <span className="font-semibold text-gray-900">Read the FAQ</span>
        <span className="mt-1 text-sm text-gray-600">Ordering, prices, prescriptions, shipping, payments and more, answered.</span>
      </Link>
      <Link to="/shipping-policy" className={card}>
        <span className="mb-2 text-2xl" aria-hidden="true">🚚</span>
        <span className="font-semibold text-gray-900">Shipping policy</span>
        <span className="mt-1 text-sm text-gray-600">How delivery works, costs, tracking and delays.</span>
      </Link>
      <Link to="/shop" className={card}>
        <span className="mb-2 text-2xl" aria-hidden="true">💊</span>
        <span className="font-semibold text-gray-900">Find a medicine</span>
        <span className="mt-1 text-sm text-gray-600">Browse by category, then send a free quote request.</span>
      </Link>
    </div>
  );
}
