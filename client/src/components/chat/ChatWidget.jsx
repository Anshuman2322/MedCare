import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { pollChatMessages } from '../../api/chat';
import { readToken, isLive, setLive, readSeen, markSeen, shouldAnnounce, setUnread, useUnread } from './liveChatStore.js';
import { announceReply, showUnreadInTitle } from './chatAlerts.js';
import './chatLauncher.css';

// The panel (and everything it pulls in) only downloads once a visitor actually
// opens support, so the landing page never pays for it.
const ChatPanel = lazy(() => import('./ChatPanel.jsx'));

// How often the closed launcher checks for the team's replies.
const CHECK_VISIBLE_MS = 8000;
const CHECK_HIDDEN_MS = 20000;

// While a visitor waits for the team with the panel closed (or on another
// page), keep checking for replies and surface them on the launcher.
function useReplyWatcher({ open, onOpen }) {
  useEffect(() => {
    if (open) return undefined;

    let cancelled = false;
    let timer;
    const check = async () => {
      const token = readToken();
      if (token && isLive()) {
        try {
          const seen = readSeen();
          const data = await pollChatMessages({ sessionToken: token, after: seen || undefined });
          if (cancelled) return;
          if (data.conversation && !data.conversation.handoffRequested) setLive(false);

          const messages = data.messages || [];
          if (!seen) {
            // Nothing marked as read yet: start counting from now.
            if (messages.length) markSeen(messages[messages.length - 1].at);
          } else {
            const replies = messages.filter((message) => message.role !== 'user');
            const latest = replies[replies.length - 1];
            setUnread({ unread: replies.length, preview: latest || null });
            showUnreadInTitle(replies.length);
            if (latest && shouldAnnounce(latest)) announceReply(latest, { onOpen });
          }
        } catch (error) {
          if (error?.status === 404) setLive(false);
        }
      }
      if (!cancelled) timer = window.setTimeout(check, document.hidden ? CHECK_HIDDEN_MS : CHECK_VISIBLE_MS);
    };

    check();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, onOpen]);
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [dismissedPreview, setDismissedPreview] = useState('');
  const launcherRef = useRef(null);
  const { unread, preview } = useUnread();

  const openPanel = useCallback(() => {
    setEverOpened(true);
    setOpen(true);
    setUnread({ unread: 0, preview: null });
    showUnreadInTitle(0);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  useReplyWatcher({ open, onOpen: openPanel });

  // Other parts of the site (the FAQ page) can open the chat.
  useEffect(() => {
    window.addEventListener('cureneed:open-chat', openPanel);
    return () => window.removeEventListener('cureneed:open-chat', openPanel);
  }, [openPanel]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closePanel]);

  const showPreview = !open && unread > 0 && preview && preview.id !== dismissedPreview;
  const unreadLabel = unread > 0 ? ` (${unread} new message${unread === 1 ? '' : 's'} from our team)` : '';

  return (
    <>
      {showPreview && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[9.5rem] right-5 z-40 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-2xl md:bottom-24 md:right-6"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white" aria-hidden="true">
                C
              </span>
              <div>
                <div className="text-xs font-semibold text-gray-900">{preview.agentName || 'CureNeed Support'}</div>
                <div className="text-[11px] text-emerald-700">New message</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissedPreview(preview.id)}
              aria-label="Dismiss message preview"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-snug text-gray-800">{preview.text}</p>
          <button
            type="button"
            onClick={openPanel}
            className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Reply
          </button>
        </div>
      )}

      <div className="cn-launcher" data-open={open}>
        <button type="button" onClick={openPanel} tabIndex={-1} aria-hidden="true" className="cn-label">
          <span className="cn-wave">👋</span>
          <span>
            Need help?
            <small>Chat with our team</small>
          </span>
        </button>
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-label={`Open CureNeed Support${unreadLabel}`}
          aria-expanded={open}
          className="cn-fab"
        >
          <span className="cn-ring" aria-hidden="true" />
          <span className="cn-ring two" aria-hidden="true" />
          <span className="cn-shine" aria-hidden="true" />
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.5C6.75 2.5 2.5 6.4 2.5 11.2c0 2.45 1.1 4.65 2.9 6.2L4.6 21.4a.6.6 0 00.85.7l3.9-2.1c.85.25 1.75.38 2.65.38 5.25 0 9.5-3.9 9.5-8.7S17.25 2.5 12 2.5z" />
          </svg>
          <span className="cn-dots" aria-hidden="true">
            <i style={{ background: '#059669' }} />
            <i style={{ background: '#059669' }} />
            <i style={{ background: '#059669' }} />
          </span>
          <span className="cn-online" aria-hidden="true" />
          {unread > 0 && !open && (
            <span className="absolute -right-1 -top-1 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white" aria-hidden="true">
              {unread}
            </span>
          )}
        </button>
      </div>

      {everOpened && (
        <Suspense fallback={null}>
          <ChatPanel open={open} onClose={closePanel} />
        </Suspense>
      )}
    </>
  );
}
