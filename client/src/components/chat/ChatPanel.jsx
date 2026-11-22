import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrency } from '../../store/useStore.jsx';
import { useChatProduct } from './chatProductStore.js';
import useChatSession from './useChatSession.js';
import ChatMessage from './ChatMessage.jsx';
import { InquiryForm, StatusForm, HandoffForm } from './ChatForms.jsx';
import { askNotificationPermission, notificationPermission } from './chatAlerts.js';

// Minutes since `since`, refreshed every 15 seconds while `active`.
function useMinutesSince(since, active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, [active]);
  const start = Date.parse(since || '');
  return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 60000)) : 0;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5" aria-label="CureNeed Support is typing" role="status">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">CureNeed Support</span>
      <span className="flex gap-1 rounded-full bg-emerald-50 px-2.5 py-2">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

export default function ChatPanel({ open, onClose }) {
  const { currency } = useCurrency();
  const product = useChatProduct();
  const [activeForm, setActiveForm] = useState(null);
  const [draft, setDraft] = useState('');

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const syncedMessageRef = useRef(null);

  const {
    messages,
    conversation,
    loading,
    sending,
    error,
    send,
    submitHandoff,
    submitStatusCheck,
    confirmInquiry,
    retry,
    restart,
  } = useChatSession({ open, productContext: product });

  const withHuman = Boolean(conversation?.handoffRequested);
  const agentJoined = Boolean(conversation?.agentJoined);
  const team = conversation?.team;
  const teamAway = team?.available === false;
  const waitingForTeam = withHuman && !agentJoined;
  const minutesWaiting = useMinutesSince(conversation?.waitingSince, open && waitingForTeam);
  const [notifyState, setNotifyState] = useState(() => notificationPermission());

  const statusText = !withHuman
    ? 'Assistant · replies instantly'
    : agentJoined
      ? "You're chatting with our team"
      : teamAway
        ? 'Our team will reply here soon'
        : `Waiting for an expert · usually ${team?.waitText || '5–10 minutes'}`;

  const startNewChat = useCallback(async () => {
    // Leaving a conversation with the team is easy to do by accident.
    if (withHuman && !window.confirm('Leave this conversation with our team? Their reply will still reach you by email.')) return;
    setActiveForm(null);
    setDraft('');
    await restart();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [restart, withHuman]);

  const enableNotifications = useCallback(async () => {
    setNotifyState(await askNotificationPermission());
  }, []);

  // An assistant reply carrying a form opens it; any later reply closes it.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === syncedMessageRef.current) return;
    syncedMessageRef.current = last.id;

    if (last.form) setActiveForm(last.form);
    else if (last.role !== 'user') setActiveForm(null);
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [open, messages, sending, activeForm]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Only the phone layout covers the page, so only it should freeze the page
  // behind it — on desktop the widget sits alongside a still-usable site.
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 639px)').matches) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleAction = useCallback(
    (action) => {
      setActiveForm(null);
      send({ actionId: action.id, actionLabel: action.label });
    },
    [send]
  );

  const handleSubmitDraft = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setActiveForm(null);
    send({ text });
  };

  const handleInquiryFor = useCallback((card) => {
    setActiveForm({ id: 'inquiry', medicine: card });
  }, []);

  const handleInquirySubmitted = useCallback(
    async (referenceId) => {
      setActiveForm(null);
      await confirmInquiry(referenceId);
    },
    [confirmInquiry]
  );

  // z-[60] clears the sticky navbar and the floating home button (both z-50),
  // which otherwise punch through the phone-width full-screen panel.
  return (
    <div
      role="dialog"
      aria-label="CureNeed Support chat"
      aria-hidden={!open}
      className={`fixed inset-0 z-[60] flex h-[100dvh] w-full flex-col bg-white transition-all duration-200 ease-out sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[620px] sm:max-h-[calc(100vh-3rem)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl ${
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-3 opacity-0'
      }`}
    >
      <header className="flex items-center justify-between gap-3 bg-emerald-600 px-4 py-3 text-white sm:rounded-t-2xl">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-base font-bold" aria-hidden="true">
            C
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">CureNeed Support</div>
            <div className="flex items-start gap-1.5 text-xs leading-snug text-emerald-50">
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${waitingForTeam ? 'animate-pulse bg-amber-300' : 'bg-emerald-300'}`}
                aria-hidden="true"
              />
              <span>{statusText}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={startNewChat}
            disabled={loading || sending}
            title="Start a new chat"
            aria-label="Start a new chat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-emerald-700 hover:text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 0113.66-5.66L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 01-13.66 5.66L4 15.5M4 20v-4.5h4.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close CureNeed Support"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-emerald-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </header>

      {waitingForTeam && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900" role="status">
          <span>
            {teamAway
              ? "⏳ Our team is away. They'll reply here, or by email if you've left."
              : `⏳ Please keep this chat open, an expert will join you soon.`}
            {minutesWaiting > 0 && <span className="font-semibold"> Waiting {minutesWaiting} min.</span>}
          </span>
          {notifyState === 'default' && (
            <button
              type="button"
              onClick={enableNotifications}
              className="shrink-0 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              🔔 Notify me
            </button>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-busy={sending || loading}
        className="flex-1 space-y-4 overflow-y-auto bg-white px-3 py-4"
      >
        {loading && <p className="text-center text-xs text-gray-500">Starting your conversation…</p>}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            currency={currency}
            onAction={handleAction}
            onInquire={handleInquiryFor}
            onNavigate={onClose}
            disabled={sending}
          />
        ))}

        {sending && <TypingIndicator />}

        {activeForm?.id === 'inquiry' && activeForm.medicine && (
          <InquiryForm
            key={`${activeForm.medicine.slug}-${activeForm.quantity || 1}-${activeForm.packagingType || ''}`}
            medicine={activeForm.medicine}
            initialQuantity={activeForm.quantity}
            initialPackaging={activeForm.packagingType}
            currency={currency}
            visitor={conversation?.visitor}
            onCancel={() => setActiveForm(null)}
            onSubmitted={handleInquirySubmitted}
          />
        )}

        {activeForm?.id === 'status' && (
          <StatusForm
            key={activeForm.referenceId || 'status'}
            initialReference={activeForm.referenceId || ''}
            onCancel={() => setActiveForm(null)}
            onSubmit={async (payload) => {
              await submitStatusCheck(payload);
              setActiveForm(null);
            }}
          />
        )}

        {activeForm?.id === 'handoff' && (
          <HandoffForm
            team={conversation?.team}
            visitor={conversation?.visitor}
            onCancel={() => setActiveForm(null)}
            onSubmit={async (payload) => {
              await submitHandoff(payload);
              setActiveForm(null);
            }}
          />
        )}

        {error && (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
            <p className="text-xs text-red-700">{error}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={retry}
                className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setActiveForm({ id: 'handoff' })}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Talk to Our Team
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmitDraft}
        className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-2xl"
      >
        <label htmlFor="chat-composer" className="sr-only">
          Type your message
        </label>
        <input
          id="chat-composer"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={withHuman ? 'Message our support team…' : 'Type your message...'}
          autoComplete="off"
          disabled={loading}
          className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={sending || loading || !draft.trim()}
          aria-label="Send message"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l16-8-6 8 6 8-16-8z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
