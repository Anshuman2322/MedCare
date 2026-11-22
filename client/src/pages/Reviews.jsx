import React from 'react';
import SEO from '../components/SEO.jsx';
import AllReviews from '../components/reviews/AllReviews.jsx';
import { BUSINESS } from '../config/business';

const platformNames = Object.values(BUSINESS.reviewSources)
  .map((s) => s.name)
  .join(' and ');

// Every customer review in one place (this website and other platforms), with
// one combined rating, filters and the review form.
export default function Reviews() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Customer Reviews"
        description="Read reviews from CureNeed customers about our products, quotes and delivery, and share your own experience."
        path="/reviews"
      />
      <section className="border-b border-gray-100 bg-sky-50">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-10 xl:px-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Customer Reviews</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            What our customers say about our products, quotes and delivery, here and on {platformNames}.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <AllReviews />
      </div>
    </div>
  );
}
