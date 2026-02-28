import React from 'react';
import { Link } from 'react-router-dom';

export default function StepSuccess({ firstName, referenceId, medicineSlug }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm text-center space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-inner">✅</div>
      <div className="text-xl font-semibold text-emerald-800">Inquiry submitted successfully</div>
      <p className="text-sm text-emerald-800">
        Thank you{firstName ? `, ${firstName}` : ''}. Reference ID: <span className="font-semibold">{referenceId}</span>.<br />
        Our team will contact you within 24 hours.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/shop"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
        >
          Go back to shop
        </Link>
        {medicineSlug && (
          <Link
            to={`/medicine/${medicineSlug}`}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            View medicine
          </Link>
        )}
      </div>
    </div>
  );
}
