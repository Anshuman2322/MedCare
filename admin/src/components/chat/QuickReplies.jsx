import React, { useState } from 'react';
import { createQuickReply, updateQuickReply, deleteQuickReply } from '../../api/chatApi.js';

// {name}, {email} and {product} become the customer's first name, email and
// the product they were viewing.
export function fillPlaceholders(text, conversation) {
  const firstName = String(conversation?.visitor?.name || '').trim().split(/\s+/)[0];
  return String(text || '')
    .replace(/\{name\}/gi, firstName || 'there')
    .replace(/\{email\}/gi, conversation?.visitor?.email || 'your email')
    .replace(/\{product\}/gi, conversation?.productContext?.name || 'this medicine');
}

// One-click replies above the composer. Clicking one puts it in the reply box
// (placeholders filled in) so it can be checked or tweaked, then sent.
export function QuickReplyBar({ replies, conversation, disabled, onPick, onManage }) {
  return (
    <div className="flex items-center gap-2 border-t border-slate-100 px-3 pt-2">
      <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1" aria-label="Quick replies">
        {replies.length === 0 && <span className="text-xs text-slate-500">No quick replies yet.</span>}
        {replies.map((reply) => (
          <button
            key={reply.id}
            type="button"
            disabled={disabled}
            title={fillPlaceholders(reply.text, conversation)}
            onClick={() => onPick(fillPlaceholders(reply.text, conversation))}
            className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reply.title}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onManage}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
      >
        Manage
      </button>
    </div>
  );
}

function ReplyEditor({ initial, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [text, setText] = useState(initial?.text || '');
  return (
    <form
      className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ title: title.trim(), text: text.trim() });
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={40}
        placeholder="Button label, e.g. Welcome"
        aria-label="Quick reply title"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Hi {name}, thanks for waiting! …"
        aria-label="Quick reply text"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">Use {'{name}'}, {'{email}'} or {'{product}'} to fill in the customer's details.</span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !text.trim()}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-emerald-300"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
}

// Add, edit and delete the saved replies (shared by the whole team).
export function QuickRepliesManager({ replies, onChange, onClose }) {
  const [editing, setEditing] = useState(null); // reply id, 'new' or null
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function run(action) {
    setSaving(true);
    setError('');
    try {
      await action();
      setEditing(null);
      await onChange();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save the quick reply.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto border-t border-slate-100 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Quick replies</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            + Add
          </button>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
            Done
          </button>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-rose-700">{error}</p>}

      {editing === 'new' && (
        <ReplyEditor saving={saving} onCancel={() => setEditing(null)} onSave={(input) => run(() => createQuickReply(input))} />
      )}

      {replies.map((reply) =>
        editing === reply.id ? (
          <ReplyEditor
            key={reply.id}
            initial={reply}
            saving={saving}
            onCancel={() => setEditing(null)}
            onSave={(input) => run(() => updateQuickReply(reply.id, input))}
          />
        ) : (
          <div key={reply.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-2.5">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900">{reply.title}</div>
              <div className="mt-0.5 line-clamp-2 text-xs text-slate-600">{reply.text}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => setEditing(reply.id)} className="rounded px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete the quick reply "${reply.title}"?`)) run(() => deleteQuickReply(reply.id));
                }}
                className="rounded px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Delete
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
