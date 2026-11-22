import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getConversations,
  getConversation,
  replyToConversation,
  updateConversationStatus,
  getQuickReplies,
  CHAT_CHANGED,
} from '../api/chatApi.js';
import LiveChatSettings from '../components/chat/LiveChatSettings.jsx';
import { QuickReplyBar, QuickRepliesManager } from '../components/chat/QuickReplies.jsx';
import { askNotificationPermission, notificationPermission } from '../utils/chatAlerts.js';

const REFRESH_MS = 10000;
// Customers are told an expert joins within minutes; past this, a wait shows red.
const LONG_WAIT_MINUTES = 10;

const statusStyles = {
  waiting: 'bg-amber-50 text-amber-700 border border-amber-100',
  active: 'bg-blue-50 text-blue-700 border border-blue-100',
  closed: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
};

const statusOptions = [
  { label: 'Waiting', value: 'waiting' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: '' },
];

function StatusBadge({ status }) {
  const key = statusStyles[status] ? status : 'active';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusStyles[key]}`}>
      {status}
    </span>
  );
}

function relativeTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return date.toLocaleDateString();
}

// How long a customer has been waiting for the team's first reply.
function waitingMinutes(conversation) {
  if (conversation?.status !== 'waiting' || conversation?.firstAgentReplyAt) return null;
  const since = Date.parse(conversation?.handoffAt || conversation?.lastMessageAt || '');
  return Number.isFinite(since) ? Math.max(0, Math.floor((Date.now() - since) / 60000)) : null;
}

function WaitingBadge({ conversation }) {
  const minutes = waitingMinutes(conversation);
  if (minutes === null) return null;
  const long = minutes >= LONG_WAIT_MINUTES;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        long ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
      }`}
      title="Time since the customer asked for the team"
    >
      ⏳ Waiting {minutes < 1 ? '<1' : minutes}m
    </span>
  );
}

// Whether the customer still has the website open (their chat checks in).
function PresenceBadge({ conversation }) {
  if (!conversation?.handoffRequested) return null;
  if (conversation.visitorOnline) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden /> Online on the site
      </span>
    );
  }
  const seen = relativeTime(conversation.visitorSeenAt);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden /> Offline{seen ? ` · last seen ${seen}` : ''}
    </span>
  );
}

function visitorLabel(conversation) {
  return conversation?.visitor?.name || conversation?.visitor?.email || 'Anonymous visitor';
}

const announceChange = () => window.dispatchEvent(new Event(CHAT_CHANGED));

export default function SupportChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('waiting');
  const [items, setItems] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [selectedId, setSelectedId] = useState(() => searchParams.get('c'));
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [quickReplies, setQuickReplies] = useState([]);
  const [managingReplies, setManagingReplies] = useState(false);
  const [alertsState, setAlertsState] = useState(() => notificationPermission());
  // "Also emailed" note, kept with the conversation it belongs to.
  const [notice, setNotice] = useState(null);

  const transcriptRef = useRef(null);
  const composerRef = useRef(null);

  // A notification link (?c=<id>) opens that conversation.
  useEffect(() => {
    const fromLink = searchParams.get('c');
    if (fromLink) {
      setSelectedId(fromLink);
      setStatus('');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadList = useCallback(async () => {
    try {
      const { data } = await getConversations({ status, limit: 50 });
      setItems(data?.items || []);
      setWaitingCount(data?.waitingCount || 0);
      setError('');
    } catch {
      setError('Unable to load conversations.');
    } finally {
      setLoadingList(false);
    }
  }, [status]);

  const loadThread = useCallback(async (id) => {
    if (!id) return;
    try {
      const { data } = await getConversation(id);
      setThread(data);
    } catch {
      setError('Unable to load this conversation.');
    }
  }, []);

  const loadQuickReplies = useCallback(async () => {
    try {
      const { data } = await getQuickReplies();
      setQuickReplies(data?.items || []);
    } catch {
      // The reply box still works without them.
    }
  }, []);

  useEffect(() => {
    setLoadingList(true);
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadQuickReplies();
  }, [loadQuickReplies]);

  useEffect(() => {
    // Opening a conversation marks it read, so the sidebar badge updates.
    loadThread(selectedId).then(announceChange);
  }, [selectedId, loadThread]);

  // Support queues are only useful if they move on their own.
  useEffect(() => {
    const timer = setInterval(() => {
      loadList();
      if (selectedId) loadThread(selectedId);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadList, loadThread, selectedId]);

  const messageCount = thread?.messages?.length || 0;
  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messageCount, selectedId]);

  const conversation = thread?.conversation;
  const closed = conversation?.status === 'closed';

  const headerMeta = useMemo(() => {
    if (!conversation) return [];
    return [
      ['Email', conversation.visitor?.email],
      ['Phone', conversation.visitor?.phone],
      ['Viewing', conversation.productContext?.name],
      ['Inquiries', conversation.inquiryRefs?.join(', ')],
    ].filter(([, value]) => value);
  }, [conversation]);

  const pickQuickReply = (text) => {
    setDraft((current) => (current.trim() ? `${current.trimEnd()} ${text}` : text));
    requestAnimationFrame(() => {
      const node = composerRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
    });
  };

  async function sendReply() {
    const text = draft.trim();
    if (!text || !selectedId || sending) return;

    setSending(true);
    setNotice(null);
    try {
      const { data } = await replyToConversation(selectedId, text);
      setDraft('');
      if (data?.emailing) {
        setNotice({ id: selectedId, text: `Sent. The customer has left the site, so it was also emailed to ${conversation?.visitor?.email}.` });
      }
      await Promise.all([loadThread(selectedId), loadList()]);
      announceChange();
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Reply could not be sent.');
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    if (!selectedId) return;
    try {
      await updateConversationStatus(selectedId, nextStatus);
      await Promise.all([loadThread(selectedId), loadList()]);
      announceChange();
    } catch (err) {
      setError(err?.response?.data?.error || 'Status update failed.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="section-title">Support</div>
          <h2 className="text-xl font-semibold">Support Chat</h2>
          <p className="text-sm text-slate-600">
            Conversations from the website chat widget.
            {waitingCount > 0 && (
              <span className="ml-1 font-semibold text-amber-700">{waitingCount} waiting for a reply.</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          {alertsState === 'default' && (
            <button
              type="button"
              onClick={async () => setAlertsState(await askNotificationPermission())}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              🔔 Enable desktop alerts
            </button>
          )}
          <button
            type="button"
            onClick={loadList}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <LiveChatSettings />

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="card flex max-h-[70vh] flex-col p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
                  status === option.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {loadingList && <p className="py-6 text-center text-sm text-slate-500">Loading…</p>}

            {!loadingList && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">💬</div>
                <p className="mt-3 text-sm font-semibold">No conversations here</p>
              </div>
            )}

            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setSelectedId(item._id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  selectedId === item._id
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">{visitorLabel(item)}</span>
                  {item.unreadForAdmin > 0 && (
                    <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                      {item.unreadForAdmin}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-600">{item.lastMessagePreview || '—'}</div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={item.status} />
                    <WaitingBadge conversation={item} />
                  </div>
                  <span className="text-[11px] text-slate-500">{relativeTime(item.lastMessageAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card flex max-h-[70vh] flex-col">
          {!conversation && (
            <div className="flex flex-1 items-center justify-center p-10 text-sm text-slate-500">
              Select a conversation to view the transcript.
            </div>
          )}

          {conversation && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-slate-900">{visitorLabel(conversation)}</div>
                    <WaitingBadge conversation={conversation} />
                    <PresenceBadge conversation={conversation} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600">
                    {headerMeta.map(([label, value]) => (
                      <span key={label}>
                        <span className="font-semibold text-slate-500">{label}:</span> {value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={conversation.status} />
                  <select
                    value={conversation.status}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    aria-label="Conversation status"
                  >
                    <option value="waiting">Waiting</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div ref={transcriptRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.messages.map((message) => {
                  const fromVisitor = message.role === 'user';
                  return (
                    <div key={message.id} className={`flex flex-col ${fromVisitor ? 'items-start' : 'items-end'}`}>
                      <span
                        className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                        title={message.role === 'agent' ? message.agentEmail || '' : undefined}
                      >
                        {fromVisitor ? 'Visitor' : message.role === 'agent' ? message.agentName || message.agentEmail || 'Agent' : 'Assistant'}
                      </span>
                      <div
                        className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                          fromVisitor
                            ? 'rounded-bl-md bg-slate-100 text-slate-800'
                            : message.role === 'agent'
                              ? 'rounded-br-md bg-emerald-600 text-white'
                              : 'rounded-br-md border border-emerald-100 bg-emerald-50 text-slate-700'
                        }`}
                      >
                        {message.text}
                      </div>
                      {message.cards?.length > 0 && (
                        <div className="mt-1 px-1 text-[11px] text-slate-500">
                          Shared: {message.cards.map((card) => card.name).join(', ')}
                        </div>
                      )}
                      <span className="px-1 text-[10px] text-slate-400">
                        {new Date(message.at).toLocaleString()}
                        {message.emailedAt && <span className="ml-1 font-semibold text-emerald-700">· 📧 Also emailed</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              {managingReplies ? (
                <QuickRepliesManager replies={quickReplies} onChange={loadQuickReplies} onClose={() => setManagingReplies(false)} />
              ) : (
                <QuickReplyBar
                  replies={quickReplies}
                  conversation={conversation}
                  disabled={closed}
                  onPick={pickQuickReply}
                  onManage={() => setManagingReplies(true)}
                />
              )}

              {!closed && conversation.handoffRequested && !conversation.visitorOnline && conversation.visitor?.email && (
                <p className="px-3 pt-2 text-[11px] text-slate-600">
                  The customer has left the site: your reply will also be emailed to <span className="font-semibold">{conversation.visitor.email}</span>.
                </p>
              )}
              {notice?.id === selectedId && (
                <p className="px-3 pt-2 text-[11px] font-medium text-emerald-700" role="status">
                  {notice.text}
                </p>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendReply();
                }}
                className="flex items-end gap-2 p-3"
              >
                <textarea
                  ref={composerRef}
                  value={draft}
                  rows={2}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter sends; Shift+Enter starts a new line.
                    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder={closed ? 'Reopen this conversation to reply' : 'Type your reply… (Enter to send, Shift+Enter for a new line)'}
                  disabled={closed}
                  aria-label="Reply to visitor"
                  className="max-h-40 min-h-[44px] flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim() || closed}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
