import React, { useEffect, useState } from 'react';
import ManageMedicines from './pages/ManageMedicines.jsx';
import AddMedicine from './pages/AddMedicine.jsx';
import EditMedicine from './pages/EditMedicine.jsx';
import ManageCategories from './pages/ManageCategories.jsx';
import { api } from './api/axios.js';

export default function App() {
  const [page, setPage] = useState('list');
  const [editId, setEditId] = useState(null);
  const [listScrollTop, setListScrollTop] = useState(0);
  const [q, setQ] = useState('');
  const [all, setAll] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  // Load once for client-side search
  async function ensureLoaded() {
    if (loaded) return;
    try {
      const { data } = await api.get('/medicines');
      setAll(data || []);
      setLoaded(true);
    } catch {
      // ignore; keep empty list
    }
  }

  const goBack = () => {
    // Use internal navigation instead of browser history to avoid leaving app
    if (page !== 'list') {
      setPage('list');
      setEditId(null);
    } else {
      // As a fallback, only then touch browser history
      window.history.length > 1 && window.history.back();
    }
  };

  // Restore scroll when returning to the list view after edits/navigation
  useEffect(() => {
    if (page === 'list') {
      // Wait for list to render, then restore position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: listScrollTop, behavior: 'auto' });
        });
      });
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-6xl mx-auto p-4 flex gap-3 items-center">
          <img src="/logo.png" alt="CureNeed logo" className="h-12 sm:h-14 md:h-16 w-auto select-none" />
          <h1 className="text-xl font-semibold text-emerald-700">Medicine Management System Dashboard</h1>

          {/* Search box */}
          <div className="relative ml-4 hidden sm:block">
            <form onSubmit={(e) => {
              e.preventDefault();
              const term = q.trim().toLowerCase();
              if (!term) return;
              const match = all.find((m) => m.name?.toLowerCase().includes(term));
              if (match?.id) {
                setEditId(match.id);
                setPage('edit');
                setOpen(false);
              }
            }}>
              <input
                type="search"
                value={q}
                onFocus={() => { ensureLoaded(); setOpen(true); }}
                onChange={(e) => { setQ(e.target.value); ensureLoaded(); setOpen(true); }}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
                placeholder="Search medicine to edit..."
                className="w-72 md:w-96 px-3 py-2 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </form>
            {open && q.trim() && (
              <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-72 overflow-auto">
                {all
                  .filter((m) => m.name?.toLowerCase().includes(q.trim().toLowerCase()))
                  .slice(0, 8)
                  .map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setEditId(m.id); setPage('edit'); setOpen(false); }}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-slate-600">{m.category} · {m.form} · ${m.price}</div>
                    </button>
                  ))}
                {all.filter((m) => m.name?.toLowerCase().includes(q.trim().toLowerCase())).length === 0 && (
                  <div className="px-3 py-2 text-slate-500">No matches</div>
                )}
              </div>
            )}
          </div>

          <nav className="ml-auto flex gap-2">
            <button className={`px-3 py-2 rounded-md ${page==='list'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`} onClick={() => { setPage('list'); setEditId(null); setTimeout(() => window.scrollTo({ top: listScrollTop, behavior: 'auto' }), 0); }}>Medicines</button>
            <button className={`px-3 py-2 rounded-md ${page==='add'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`} onClick={() => { setListScrollTop(window.scrollY || document.documentElement.scrollTop || 0); setPage('add'); setEditId(null); }}>Add</button>
            <button className={`px-3 py-2 rounded-md ${page==='cats'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`} onClick={() => { setListScrollTop(window.scrollY || document.documentElement.scrollTop || 0); setPage('cats'); setEditId(null); }}>Categories</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {page === 'list' && (
          <ManageMedicines
            showDeleted={showDeleted}
            onToggleDeleted={setShowDeleted}
            onDeletedCountChange={setDeletedCount}
            onEdit={(id) => {
              setListScrollTop(window.scrollY || document.documentElement.scrollTop || 0);
              setEditId(id);
              setPage('edit');
            }}
            onReady={() => {
              // Restore scroll precisely after list has loaded and rendered
              window.scrollTo({ top: listScrollTop, behavior: 'auto' });
            }}
          />
        )}
        {page === 'add' && <AddMedicine onDone={() => setPage('list')} />}
        {page === 'edit' && editId && <EditMedicine id={editId} onDone={() => {
          setEditId(null);
          setPage('list');
          setTimeout(() => window.scrollTo({ top: listScrollTop, behavior: 'auto' }), 0);
        }} />}
        {page === 'cats' && <ManageCategories />}
      </main>
    </div>
  );
}
