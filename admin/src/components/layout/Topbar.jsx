import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

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
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b border-emerald-100">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4 relative">
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
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-card hover:border-emerald-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {(admin?.email || 'MC').slice(0, 1).toUpperCase()}
              </span>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900">{admin?.email || 'Admin'}</div>
                <RoleBadge role={admin?.role} />
              </div>
              <span className="text-slate-400 text-xs">▾</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-100 bg-white shadow-card py-2 z-20">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/profile');
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        {open && (
          <div className="fixed inset-0 z-0" onClick={() => setOpen(false)} aria-hidden />
        )}
      </div>
    </header>
  );
}

function RoleBadge({ role }) {
  const normalized = role === 'super_admin' ? 'super_admin' : 'admin';
  if (normalized === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-100">
        <span aria-hidden>👑</span>
        Super Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
      Admin
    </span>
  );
}
