import React from 'react';

export default function ManageCategories() {
  const cats = [
    'Antibiotics',
    'Anti-Cancer',
    'Anti-Malarial',
    'Anti-Viral',
    'Chronic-Cardiac',
    'ED',
    'Hormones-Steroids',
    'Injections',
    'Pain-Killers',
    'Skin-Allergy-Asthma',
    'Supplements-Vitamins-Hair'
  ];

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-2">Allowed Categories</h2>
      <ul className="list-disc pl-6 space-y-1">
        {cats.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="text-sm text-slate-500 mt-3">
        Categories are fixed to guarantee compatibility with the main website’s folder structure and filters.
      </p>
    </div>
  );
}
