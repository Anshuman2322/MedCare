import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function usePageTitle() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/medicines/add')) return 'Add Medicine';
  if (pathname.startsWith('/medicines/edit')) return 'Edit Medicine';
  if (pathname.startsWith('/medicines')) return 'Medicines';
  if (pathname.startsWith('/categories')) return 'Categories';
  if (pathname.startsWith('/inquiries')) return 'Inquiries';
  if (pathname.startsWith('/messages')) return 'Messages';
  if (pathname.startsWith('/support-chat')) return 'Support Chat';
  if (pathname.startsWith('/faq')) return 'FAQ & Chat Answers';
  if (pathname.startsWith('/reviews')) return 'Reviews';
  if (pathname.startsWith('/manage-admins')) return 'Admin Management';
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
      {/* pl-24 on phones keeps the title clear of the fixed "Menu" button (hidden from lg up). */}
      <div className="mx-auto max-w-6xl py-3 pl-24 pr-4 sm:py-4 sm:pr-6 lg:pl-6 flex items-center gap-3 sm:gap-4 relative">
        <div className="min-w-0">
          <div className="hidden sm:block text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold">CureNeed Admin</div>
          <h1 className="truncate text-lg sm:text-2xl font-semibold text-slate-900">{title}</h1>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/medicines/add"
            aria-label="New Medicine"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700 sm:px-4"
          >
            <span aria-hidden="true">+<span className="hidden sm:inline"> New Medicine</span></span>
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={`Account menu for ${admin?.email || 'admin'}`}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-card hover:border-emerald-200"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {(admin?.email || 'MC').slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-semibold text-slate-900">{admin?.email || 'Admin'}</div>
                <RoleBadge role={admin?.role} />
              </div>
              <span className="text-slate-400 text-xs">▾</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-100 bg-white shadow-card py-2 z-20">
                <div className="px-4 py-2 text-xs text-slate-500 sm:hidden">{admin?.email}</div>
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
