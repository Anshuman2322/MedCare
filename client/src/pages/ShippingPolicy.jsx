import React from 'react';
import SEO from '../components/SEO.jsx';

const sections = [
  {
    title: 'How Delivery Works',
    body: `CureNeed works on an inquiry basis rather than instant checkout. Once you submit an inquiry for a medicine, our team follows up directly to confirm whether delivery is available to your location, along with pricing and an estimated timeline, before anything is finalized.`,
  },
  {
    title: 'Processing Time',
    body: `After your inquiry is confirmed, our team will let you know how long processing will take. Prescription-required items may need additional time for verification before they're prepared for delivery.`,
  },
  {
    title: 'Delivery Costs',
    body: `Delivery costs depend on the item, quantity, and destination, and will be confirmed with you as part of following up on your inquiry — before anything is finalized.`,
  },
  {
    title: 'Order Tracking',
    body: `If tracking information is available for your delivery, our team will share it with you directly once it ships.`,
  },
  {
    title: 'Delayed or Missing Deliveries',
    body: `If your delivery is delayed beyond the timeline you were given, or you believe something is missing, please contact our support team so we can look into it and assist you.`,
  },
];

export default function ShippingPolicy() {
  return (
    <div className="bg-white min-h-screen">
      <SEO title="Shipping Policy" description="How delivery works for CureNeed inquiries — processing, costs, and tracking." path="/shipping-policy" />
      <div className="w-full bg-sky-50/60 pb-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Shipping Policy
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Last updated: July 2026</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <p className="text-gray-600 text-base leading-relaxed">
          This policy explains how we handle shipping for orders and confirmed inquiries placed through CureNeed.
        </p>
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{section.title}</h2>
            <p className="text-gray-600 text-base leading-relaxed">{section.body}</p>
          </div>
        ))}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Contact Us</h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Questions about shipping can be sent to{' '}
            <a href="mailto:support@cureneed.com" className="text-emerald-600 hover:text-emerald-700">
              support@cureneed.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
