import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/medicines', label: 'Medicines' },
  { to: '/medicines/add', label: 'Add Medicine' },
  { to: '/categories', label: 'Categories' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-card border border-emerald-100"
      >
        Menu
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 max-w-[16rem] bg-white border-r border-emerald-100 shadow-card transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:flex`}
      >
        <div className="flex flex-col h-full px-5 py-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              MC
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.15em] text-emerald-600 font-semibold">MedCare</div>
              <div className="text-base font-semibold text-slate-900">Admin Panel</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-card'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
            <div className="font-semibold mb-1">Quick tip</div>
            Keep catalog clean: use consistent categories and concise slugs.
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/25 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
