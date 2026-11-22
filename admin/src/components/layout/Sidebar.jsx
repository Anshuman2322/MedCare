import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getReviews, REVIEWS_CHANGED } from '../../api/reviewsApi.js';
import useSupportChatAlerts from '../../hooks/useSupportChatAlerts.js';

const PENDING_REFRESH_MS = 60000;

// Number of reviews posted since an admin last opened the Reviews page.
function useNewReviews(enabled) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const refresh = () =>
      getReviews({ limit: 1 })
        .then((res) => active && setCount(res.data?.counts?.unseen || 0))
        .catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, PENDING_REFRESH_MS);
    window.addEventListener(REVIEWS_CHANGED, refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(REVIEWS_CHANGED, refresh);
    };
  }, [enabled]);
  return count;
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { admin } = useAuth();
  const canReviews = admin?.role === 'super_admin' || admin?.permissions?.inquiries === true;
  const newReviews = useNewReviews(canReviews);
  const chat = useSupportChatAlerts(canReviews);

  const navItems = useMemo(() => {
    const perms = admin?.permissions || {};
    const isSuper = admin?.role === 'super_admin';
    const can = (key) => (isSuper ? true : perms[key]);

    const base = [];
    if (can('dashboard')) base.push({ to: '/dashboard', label: 'Dashboard' });
    if (can('medicines')) {
      // end: true so this doesn't also light up on /medicines/add (and
      // other /medicines/* routes) - NavLink treats a link as active
      // whenever the current path starts with `to` unless `end` is set.
      base.push({ to: '/medicines', label: 'Medicines', end: true });
      base.push({ to: '/medicines/add', label: 'Add Medicine' });
    }
    if (can('categories')) base.push({ to: '/categories', label: 'Categories' });
    if (can('inquiries')) base.push({ to: '/inquiries', label: 'Inquiries' });
    if (can('inquiries')) base.push({ to: '/messages', label: 'Messages' });
    if (can('inquiries')) base.push({ to: '/support-chat', label: 'Support Chat', badge: 'supportChat' });
    if (can('inquiries')) base.push({ to: '/reviews', label: 'Reviews', badge: 'newReviews' });
    if (isSuper) base.push({ to: '/manage-admins', label: 'Admin Management' });
    return base;
  }, [admin?.permissions, admin?.role]);

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
              CN
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.15em] text-emerald-600 font-semibold">CureNeed</div>
              <div className="text-base font-semibold text-slate-900">Admin Panel</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
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
                {item.badge === 'supportChat' && chat.needsReply > 0 && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white"
                    title={`${chat.needsReply} customer${chat.needsReply === 1 ? '' : 's'} waiting for a reply`}
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
                    {chat.needsReply}
                    <span className="sr-only"> customers waiting for a reply</span>
                  </span>
                )}
                {item.badge === 'newReviews' && newReviews > 0 && (
                  <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white" title={`${newReviews} new review${newReviews === 1 ? '' : 's'}`}>
                    {newReviews}
                    <span className="sr-only"> new reviews</span>
                  </span>
                )}
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
