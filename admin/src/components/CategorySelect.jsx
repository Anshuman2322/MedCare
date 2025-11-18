import React from 'react';

const CATS = [
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

export default function CategorySelect({ value, onChange }) {
  return (
    <select className="border rounded-md px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select category…</option>
      {CATS.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
