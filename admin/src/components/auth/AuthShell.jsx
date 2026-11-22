import React from 'react';

export const authInputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

export const authButtonClass =
  'w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60';

export const authLinkClass = 'text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline';

export function Banner({ tone = 'error', children }) {
  const isError = tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${
        isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      {children}
    </div>
  );
}

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-100 p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-lg">CN</div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600 break-words">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
