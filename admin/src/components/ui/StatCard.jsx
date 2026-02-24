import React from 'react';

export default function StatCard({ title, value, accent, subtitle }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="text-sm font-semibold text-emerald-700">{title}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {accent && <span className="text-sm text-emerald-600 font-semibold">{accent}</span>}
      </div>
      {subtitle && <div className="mt-1 text-xs text-slate-600">{subtitle}</div>}
    </div>
  );
}
