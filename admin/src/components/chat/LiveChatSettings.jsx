import React, { useEffect, useState } from 'react';
import { getLiveChatSettings, updateLiveChatSettings } from '../../api/chatApi.js';

// Online/away switch, the wait customers are promised, and the name shown
// above the team's replies. Customers who ask for the team get the message
// built from these.
export default function LiveChatSettings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ waitText: '', agentName: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getLiveChatSettings()
      .then(({ data }) => {
        if (!active) return;
        setSettings(data);
        setForm({ waitText: data.waitText || '', agentName: data.agentName || '' });
      })
      .catch(() => active && setError('Could not load live chat settings.'));
    return () => {
      active = false;
    };
  }, []);

  async function save(update, note) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await updateLiveChatSettings(update);
      setSettings(data);
      setForm({ waitText: data.waitText || '', agentName: data.agentName || '' });
      setMessage(note);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return error ? <div className="card p-4 text-sm text-rose-700">{error}</div> : null;
  }

  const online = settings.available;
  const changed = form.waitText.trim() !== settings.waitText || form.agentName.trim() !== (settings.agentName || '');

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Live chat</div>
          <p className="mt-0.5 text-xs text-slate-600">
            {online
              ? `Customers who ask for the team are told to stay on the page: an expert joins within ${settings.waitText}.`
              : "Customers who ask for the team are told you're away and will reply here and by email."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label="Live chat availability"
          disabled={saving}
          onClick={() => save({ available: !online }, online ? 'Live chat set to Away.' : 'Live chat is Online.')}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            online ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-700'
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${online ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} aria-hidden />
          {online ? 'Online' : 'Away'}
          <span className="font-normal text-slate-500">· switch to {online ? 'Away' : 'Online'}</span>
        </button>
      </div>

      <form
        className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          save({ waitText: form.waitText, agentName: form.agentName }, 'Saved.');
        }}
      >
        <label className="text-xs font-semibold text-slate-700">
          Expected wait (shown to customers)
          <input
            value={form.waitText}
            onChange={(event) => setForm((prev) => ({ ...prev, waitText: event.target.value }))}
            maxLength={40}
            placeholder="5–10 minutes"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Your name in the chat
          <input
            value={form.agentName}
            onChange={(event) => setForm((prev) => ({ ...prev, agentName: event.target.value }))}
            maxLength={40}
            placeholder={settings.defaultAgentName || 'CureNeed Support'}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !changed || !form.waitText.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>

      {(message || error) && (
        <p className={`mt-2 text-xs font-medium ${error ? 'text-rose-700' : 'text-emerald-700'}`} role="status">
          {error || message}
        </p>
      )}
    </div>
  );
}
