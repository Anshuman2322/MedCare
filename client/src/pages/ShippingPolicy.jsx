import React from 'react';

const sections = [
  {
    title: 'Shipping Coverage',
    body: `We currently ship to addresses within the United States. International shipping is not yet available but is planned for the future.`,
  },
  {
    title: 'Processing Time',
    body: `Once your order or inquiry is confirmed, orders are typically processed within 1-2 business days before shipping. You'll be notified if any item requires additional processing time (for example, due to a required prescription review).`,
  },
  {
    title: 'Delivery Times',
    body: `Standard shipping typically takes 3-5 business days after processing. Expedited shipping options are available at checkout for 1-2 day delivery, depending on your location.`,
  },
  {
    title: 'Shipping Costs',
    body: `Shipping costs are calculated based on order size, weight, and delivery speed, and will be confirmed with you before your order is finalized.`,
  },
  {
    title: 'Order Tracking',
    body: `Once your order ships, you will receive tracking information via email so you can follow your delivery's progress.`,
  },
  {
    title: 'Delayed or Missing Deliveries',
    body: `If your delivery is delayed beyond the estimated window or you believe a package is missing, please contact our support team so we can look into it and assist you.`,
  },
];

export default function ShippingPolicy() {
  return (
    <div className="bg-white min-h-screen">
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
