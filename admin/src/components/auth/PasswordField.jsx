import React, { useState } from 'react';
import { authInputClass } from './AuthShell.jsx';

export default function PasswordField({ id, label, labelAction, value, onChange, autoComplete, autoFocus }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder="••••••••"
          className={`${authInputClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 px-3 text-xs font-semibold text-slate-500 hover:text-emerald-700"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
