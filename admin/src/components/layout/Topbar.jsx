import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function usePageTitle() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/medicines/add')) return 'Add Medicine';
  if (pathname.startsWith('/medicines/edit')) return 'Edit Medicine';
  if (pathname.startsWith('/medicines')) return 'Medicines';
  if (pathname.startsWith('/categories')) return 'Categories';
  return 'Dashboard';
}

export default function Topbar() {
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b border-emerald-100">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold">MedCare Admin</div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/medicines/add"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700"
          >
            + New Medicine
          </Link>
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
            MC
          </div>
        </div>
      </div>
    </header>
  );
}
