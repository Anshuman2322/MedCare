import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((msg, opts = {}) => {
    const id = idRef.current++;
    const {
      type = 'info',
      duration = 3000,
    } = opts || {};
    setToasts((prev) => [...prev, { id, type, msg }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed top-3 right-3 z-[10000] space-y-2 w-[92vw] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'flex items-start gap-2 p-3 rounded-lg shadow-lg border text-sm',
              t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
              t.type === 'error' && 'bg-red-50 border-red-200 text-red-800',
              t.type === 'warning' && 'bg-amber-50 border-amber-200 text-amber-800',
              t.type === 'info' && 'bg-slate-50 border-slate-200 text-slate-800',
            ].filter(Boolean).join(' ')}
            role="status"
            aria-live="polite"
          >
            <div className="mt-0.5">
              {t.type === 'success' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.59a.75.75 0 1 0-1.22-.92l-3.353 4.45-1.42-1.42a.75.75 0 1 0-1.06 1.06l2 2a.75.75 0 0 0 1.14-.09l3.913-5.08Z" clipRule="evenodd" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 7.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0V8.25A.75.75 0 0 0 12 7.5Z" clipRule="evenodd" />
                </svg>
              )}
              {t.type === 'warning' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12.866 3.5a1.5 1.5 0 0 0-2.598 0L1.633 18.5A1.5 1.5 0 0 0 2.932 20.75h18.136a1.5 1.5 0 0 0 1.3-2.25L12.866 3.5Zm-.616 5.25a.75.75 0 1 1 1.5 0v4.5a.75.75 0 0 1-1.5 0V8.75Zm.75 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 6a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0ZM12 9.75a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 1.5 0v-6a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 leading-5">{t.msg}</div>
            <button
              type="button"
              className="ml-2 text-slate-600 hover:text-slate-900"
              aria-label="Close notification"
              onClick={() => remove(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
