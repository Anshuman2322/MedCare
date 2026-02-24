import React from 'react';

export default function Badge({ tone = 'neutral', children }) {
  const toneMap = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    danger: 'bg-rose-50 text-rose-700 border-rose-100',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneMap[tone]}`}>
      {children}
    </span>
  );
}
