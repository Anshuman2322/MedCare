import React, { useEffect, useState } from 'react';
import { api } from '../api/axios.js';

export default function CategorySelect({ value, onChange, multiple = false }) {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    api.get('/categories').then(({ data }) => setCats(data?.categories || [])).catch(() => setCats([]));
  }, []);
  return (
    <select
      multiple={multiple}
      className="border rounded-md px-3 py-2"
      value={value}
      onChange={(e) => {
        if (multiple) {
          const arr = Array.from(e.target.selectedOptions).map((o) => o.value);
          onChange(arr);
        } else {
          onChange(e.target.value);
        }
      }}
    >
      {!multiple && <option value="">Select category…</option>}
      {cats.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
