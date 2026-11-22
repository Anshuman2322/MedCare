import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal.jsx';
import {
  getFaqQuestions,
  updateFaqQuestion,
  deleteFaqQuestion,
  getFaqEntries,
  createFaqEntry,
  updateFaqEntry,
  deleteFaqEntry,
  announceFaqChanged,
} from '../api/faqApi.js';

const OUTCOME = {
  unanswered: { label: 'No answer', className: 'bg-rose-50 text-rose-700 ring-rose-200', hint: 'The FAQ had nothing verified to say.' },
  suggested: { label: 'Only close matches', className: 'bg-amber-50 text-amber-800 ring-amber-200', hint: 'The visitor was offered similar questions, not an answer.' },
  escalated: { label: 'Answered, needs team', className: 'bg-sky-50 text-sky-700 ring-sky-200', hint: 'A FAQ answered and also offered a person.' },
  answered: { label: 'Answered', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', hint: 'A FAQ answered it.' },
};

// `needs` and `answered` are views over open questions, split by how the FAQ handled them.
const QUESTION_FILTERS = [
  { id: 'needs', label: 'Needs an answer', params: { status: 'new' }, keep: (q) => ['unanswered', 'suggested'].includes(q.outcome) },
  { id: 'all', label: 'Everything', params: {} },
  { id: 'answered', label: 'Answered by FAQ', params: { status: 'new' }, keep: (q) => ['answered', 'escalated'].includes(q.outcome) },
  { id: 'resolved', label: 'Resolved', params: { status: 'resolved' } },
  { id: 'ignored', label: 'Ignored', params: { status: 'ignored' } },
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

function Pill({ className, title, children }) {
  return (
    <span title={title} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${className}`}>
      {children}
    </span>
  );
}

function Btn({ tone = 'slate', busy, children, ...props }) {
  const tones = {
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    slate: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  };
  return (
    <button
      type="button"
      disabled={busy}
      {...props}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

const EMPTY = { category: 'ordering', question: '', answer: '', alternatives: '', keywords: '', priority: 5, published: true, escalate: false, links: '' };

const toForm = (entry) => ({
  category: entry.category,
  question: entry.question,
  answer: entry.answer,
  alternatives: (entry.alternatives || []).join('\n'),
  keywords: (entry.keywords || []).join(', '),
  priority: entry.priority ?? 5,
  published: entry.published !== false,
  escalate: Boolean(entry.escalate),
  links: (entry.links || []).map((link) => `${link.label} | ${link.to}`).join('\n'),
});

const toPayload = (form) => ({
  category: form.category,
  question: form.question,
  answer: form.answer,
  alternatives: form.alternatives.split('\n'),
  keywords: form.keywords.split(','),
  priority: Number(form.priority) || 5,
  published: form.published,
  escalate: form.escalate,
  links: form.links
    .split('\n')
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter(([label, to]) => label && to)
    .map(([label, to]) => ({ label, to })),
});

function EntryEditor({ editing, categories, onClose, onSaved }) {
  const [form, setForm] = useState(editing.form);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const input = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100';

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = toPayload(form);
      if (editing.id) await updateFaqEntry(editing.id, payload);
      else await createFaqEntry({ ...payload, fromQuestionId: editing.fromQuestionId });
      await onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={editing.id ? 'Edit answer' : 'Add answer'}>
      <form onSubmit={save} className="w-full max-w-2xl space-y-4 rounded-2xl border border-emerald-50 bg-white p-6 shadow-card">
        <div className="text-lg font-semibold text-slate-900">{editing.id ? 'Edit answer' : 'Add an answer'}</div>
        {editing.note && <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">{editing.note}</p>}
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select className={`${input} mt-1`} value={form.category} onChange={set('category')}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Question (as the visitor sees it)
          <input className={`${input} mt-1`} value={form.question} onChange={set('question')} maxLength={200} required />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Answer
          <textarea className={`${input} mt-1`} rows={5} value={form.answer} onChange={set('answer')} maxLength={2000} required />
          <span className="mt-1 block text-xs text-slate-500">Only state what you are sure about: no prices, dates or promises the team has not confirmed. No medical advice.</span>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Other ways visitors ask this (one per line)
          <textarea className={`${input} mt-1`} rows={3} value={form.alternatives} onChange={set('alternatives')} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Keywords (comma separated)
            <input className={`${input} mt-1`} value={form.keywords} onChange={set('keywords')} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Priority (1-10, higher wins ties)
            <input className={`${input} mt-1`} type="number" min="1" max="10" value={form.priority} onChange={set('priority')} />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Links (one per line: Label | /page)
          <textarea className={`${input} mt-1`} rows={2} value={form.links} onChange={set('links')} placeholder="Shipping Policy | /shipping-policy" />
        </label>
        <div className="flex flex-wrap gap-6 text-sm text-slate-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={set('published')} /> Show on the website and in chat</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.escalate} onChange={set('escalate')} /> Also offer &quot;Talk to our team&quot;</label>
        </div>
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <Btn onClick={onClose}>Cancel</Btn>
          <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function QuestionRow({ item, busy, onAnswer, onStatus, onDelete }) {
  const outcome = OUTCOME[item.outcome] || OUTCOME.unanswered;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold text-slate-900">&ldquo;{item.text}&rdquo;</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Pill className={outcome.className} title={outcome.hint}>{outcome.label}</Pill>
            <span>{item.source === 'page' ? 'Typed in FAQ page search' : 'Asked in chat'}</span>
            <span>· asked {item.count} {item.count === 1 ? 'time' : 'times'}</span>
            <span>· last {formatDate(item.lastAskedAt)}</span>
          </div>
          {item.faqQuestion && (
            <p className="mt-2 text-sm text-slate-600">
              {item.outcome === 'suggested' ? 'Closest FAQ: ' : 'Answered with: '}
              <span className="font-medium text-slate-800">{item.faqQuestion}</span>
            </p>
          )}
          {item.status === 'resolved' && (
            <p className="mt-2 text-sm text-emerald-700">
              Resolved{item.resolvedFaqQuestion ? <> with &ldquo;{item.resolvedFaqQuestion}&rdquo;</> : ''}.
            </p>
          )}
          {item.conversations?.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              Open the chat:
              {[...item.conversations].reverse().map((entry) => (
                <Link key={`${entry.conversationId}-${entry.at}`} to={`/support-chat?c=${entry.conversationId}`} className="font-semibold text-emerald-700 hover:underline">
                  {entry.visitorName || 'Visitor'} · {formatDate(entry.at)}
                </Link>
              ))}
            </p>
          )}
          {item.note && <p className="mt-2 text-xs italic text-slate-500">Note: {item.note}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {item.status !== 'resolved' && <Btn tone="emerald" busy={busy} onClick={() => onAnswer(item)}>Add answer</Btn>}
          {item.status === 'new' && <Btn busy={busy} onClick={() => onStatus(item, 'resolved')}>Mark resolved</Btn>}
          {item.status === 'new' && <Btn busy={busy} onClick={() => onStatus(item, 'ignored')}>Ignore</Btn>}
          {item.status !== 'new' && <Btn busy={busy} onClick={() => onStatus(item, 'new')}>Reopen</Btn>}
          <Btn tone="rose" busy={busy} onClick={() => onDelete(item)}>Delete</Btn>
        </div>
      </div>
    </li>
  );
}

function AskedTab({ categories, onEdit }) {
  const [filterId, setFilterId] = useState('needs');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const filter = QUESTION_FILTERS.find((item) => item.id === filterId);

  const load = useCallback(async () => {
    setError('');
    try {
      const params = { ...filter.params, q: search || undefined, sort: sort === 'popular' ? 'popular' : undefined };
      const { data: result } = await getFaqQuestions(params);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load the questions.');
    }
  }, [filter, search, sort]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const rows = useMemo(() => (data?.questions || []).filter((row) => !filter.keep || filter.keep(row)), [data, filter]);

  const act = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await load();
      announceFaqChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const answer = (item) =>
    onEdit({
      id: '',
      fromQuestionId: item._id,
      note: `A visitor asked: "${item.text}". The answer you save is used straight away on the FAQ page and in the chat, and this question is marked resolved.`,
      form: { ...EMPTY, question: item.text.endsWith('?') ? item.text : `${item.text}?`, alternatives: item.text, category: categories[0]?.id || 'ordering' },
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {QUESTION_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filterId === item.id}
            onClick={() => setFilterId(item.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${filterId === item.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400'}`}
          >
            {item.label}
            {item.id === 'needs' && data?.summary?.needsAnswer > 0 && <span className="ml-2 rounded-full bg-white px-1.5 text-xs text-rose-700">{data.summary.needsAnswer}</span>}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="faq-q-search">Search what visitors asked</label>
          <input id="faq-q-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
          <select aria-label="Sort" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
            <option value="recent">Most recent</option>
            <option value="popular">Most asked</option>
          </select>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {!data && !error && <p className="text-sm text-slate-500">Loading…</p>}
      {data && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
          {filterId === 'needs' ? 'Nothing waiting. Every question visitors asked has an answer.' : 'No questions here yet.'}
        </div>
      )}
      <ul className="space-y-3">
        {rows.map((item) => (
          <QuestionRow
            key={item._id}
            item={item}
            busy={busy}
            onAnswer={answer}
            onStatus={(row, status) => act(() => updateFaqQuestion(row._id, { status }))}
            onDelete={setToDelete}
          />
        ))}
      </ul>
      {data?.pages > 1 && <p className="text-xs text-slate-500">Showing the first {data.questions.length} of {data.total}. Use search to narrow it down.</p>}

      <Modal
        open={Boolean(toDelete)}
        title="Delete this question?"
        description="It is removed from this list only. The chat conversation is not touched."
        onClose={() => setToDelete(null)}
        confirmLabel="Delete"
        onConfirm={() => {
          const row = toDelete;
          setToDelete(null);
          act(() => deleteFaqQuestion(row._id));
        }}
      />
    </div>
  );
}

function AnswersTab({ data, onEdit, onChanged }) {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [toRemove, setToRemove] = useState(null);

  const entries = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (data?.entries || [])
      .filter((entry) => category === 'all' || entry.category === category)
      .filter((entry) => !text || `${entry.question} ${entry.answer} ${(entry.keywords || []).join(' ')}`.toLowerCase().includes(text));
  }, [data, category, search]);

  const labelOf = (id) => data?.categories.find((item) => item.id === id)?.label || id;

  const run = async (id, fn) => {
    setBusy(id);
    setError('');
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || 'That did not work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const toggleVisible = (entry) =>
    run(entry.id, () => updateFaqEntry(entry.id, { ...toPayload(toForm(entry)), published: !entry.published }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select aria-label="Category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="all">All categories</option>
          {(data?.categories || []).map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="faq-a-search">Search answers</label>
        <input id="faq-a-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search answers…" className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
        <button
          type="button"
          onClick={() => onEdit({ id: '', note: '', form: { ...EMPTY, category: category === 'all' ? EMPTY.category : category } })}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Add answer
        </button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <p className="text-sm text-slate-500">{entries.length} {entries.length === 1 ? 'answer' : 'answers'}</p>
      <ul className="space-y-3">
        {entries.map((entry) => {
          const votes = entry.helpful + entry.unhelpful;
          const poor = votes >= 3 && entry.unhelpful > entry.helpful;
          return (
            <li key={entry.id} className={`rounded-xl border bg-white p-4 shadow-sm ${poor ? 'border-rose-200' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{entry.question}</p>
                    {entry.custom && <Pill className="bg-violet-50 text-violet-700 ring-violet-200">Added by team</Pill>}
                    {entry.edited && <Pill className="bg-sky-50 text-sky-700 ring-sky-200">Edited</Pill>}
                    {!entry.published && <Pill className="bg-slate-100 text-slate-600 ring-slate-200">Hidden</Pill>}
                    {poor && <Pill className="bg-rose-50 text-rose-700 ring-rose-200" title="More visitors found it unhelpful than helpful. Consider rewriting it.">Needs a better answer</Pill>}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{entry.answer}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {labelOf(entry.category)} · 👍 {entry.helpful} · 👎 {entry.unhelpful}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Btn busy={busy === entry.id} onClick={() => onEdit({ id: entry.id, note: '', form: toForm(entry) })}>Edit</Btn>
                  <Btn busy={busy === entry.id} onClick={() => toggleVisible(entry)}>{entry.published ? 'Hide' : 'Show'}</Btn>
                  {(entry.edited || entry.custom) && (
                    <Btn tone="rose" busy={busy === entry.id} onClick={() => setToRemove(entry)}>{entry.custom ? 'Delete' : 'Restore original'}</Btn>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <Modal
        open={Boolean(toRemove)}
        title={toRemove?.custom ? 'Delete this answer?' : 'Restore the original answer?'}
        description={toRemove?.custom ? 'Visitors will no longer see it on the website or in the chat.' : 'Your edits to this answer are discarded and the original text comes back.'}
        onClose={() => setToRemove(null)}
        confirmLabel={toRemove?.custom ? 'Delete' : 'Restore'}
        onConfirm={() => {
          const entry = toRemove;
          setToRemove(null);
          run(entry.id, () => deleteFaqEntry(entry.id));
        }}
      />
    </div>
  );
}

export default function Faq() {
  const [tab, setTab] = useState('asked');
  const [entries, setEntries] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const loadEntries = useCallback(async () => {
    try {
      const { data } = await getFaqEntries();
      setEntries(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load the answers.');
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const saved = async () => {
    setEditing(null);
    await loadEntries();
    setReloadKey((key) => key + 1);
    announceFaqChanged();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">FAQ &amp; chat answers</h1>
        <p className="mt-1 text-sm text-slate-600">
          See what visitors asked on the website chat and FAQ page, answer the ones that have no answer yet, and edit what visitors read. Changes go live within seconds.
        </p>
      </div>

      <div role="tablist" className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'asked', label: 'Asked by visitors' },
          { id: 'answers', label: `Answers${entries ? ` (${entries.entries.length})` : ''}` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === item.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {tab === 'asked' && <AskedTab key={reloadKey} categories={entries?.categories || []} onEdit={setEditing} />}
      {tab === 'answers' && (
        <AnswersTab
          data={entries}
          onEdit={setEditing}
          onChanged={async () => {
            await loadEntries();
            announceFaqChanged();
          }}
        />
      )}

      {editing && <EntryEditor editing={editing} categories={entries?.categories || []} onClose={() => setEditing(null)} onSaved={saved} />}
    </div>
  );
}
