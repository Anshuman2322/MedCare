import React, { useEffect, useState } from 'react';
import { api } from '../api/axios.js';

export default function ManageCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setCats(data?.categories || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-2">Allowed Categories</h2>
      {loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <>
          <ul className="list-disc pl-6 space-y-1">
            {cats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-500 mt-3">
            Categories are currently fixed for compatibility. If you need changes, please contact the site admin to update the backend allowlist.
          </p>
        </>
      )}
    </div>
  );
}
