import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startChatSession,
  sendChatMessage,
  pollChatMessages,
  requestChatHandoff,
  recordChatInquiry,
  checkInquiryStatus,
} from '../../api/chat';
import { readToken, writeToken, setLive, markSeen, forgetSession, shouldAnnounce } from './liveChatStore.js';
import { announceReply, showUnreadInTitle } from './chatAlerts.js';

// While the visitor waits for (or talks with) the team, the open panel checks
// for their replies this often. The closed launcher has its own, slower check.
const LIVE_POLL_MS = 5000;
const GENERIC_ERROR = "Sorry, we're having trouble processing that right now.";

// Server messages are the source of truth, but an optimistic echo keeps the
// visitor's own message on screen while the reply is in flight.
function mergeMessages(previous, incoming) {
  const byId = new Map(previous.filter((message) => !message.pending).map((m) => [m.id, m]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => new Date(a.at) - new Date(b.at));
}

const pageHidden = () => typeof document !== 'undefined' && document.hidden;

export default function useChatSession({ open, productContext }) {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const tokenRef = useRef(readToken());
  const startedRef = useRef(false);
  const contextRef = useRef(productContext);
  contextRef.current = productContext;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const hiddenUnreadRef = useRef(0);

  const applyResponse = useCallback((data) => {
    if (data.conversation) setConversation(data.conversation);
    if (data.messages?.length) setMessages((prev) => mergeMessages(prev, data.messages));
  }, []);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarting(true);
    setError('');

    try {
      const data = await startChatSession({
        sessionToken: tokenRef.current || undefined,
        productContext: contextRef.current || undefined,
      });
      tokenRef.current = data.sessionToken;
      writeToken(data.sessionToken);
      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (err) {
      // A stale token from a previous visit shouldn't strand the visitor.
      if (err.status === 404 && tokenRef.current) {
        tokenRef.current = '';
        forgetSession();
        startedRef.current = false;
        setStarting(false);
        return start();
      }
      setError(GENERIC_ERROR);
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    if (open) start();
  }, [open, start]);

  // The product being viewed changed while the panel was already open.
  useEffect(() => {
    if (!open || !startedRef.current || starting) return;
    const slug = productContext?.slug || '';
    if (!slug || slug === conversation?.productContext?.slug) return;

    startedRef.current = false;
    start();
  }, [open, productContext?.slug, conversation?.productContext?.slug, starting, start]);

  // The launcher keeps checking for the team's replies after the panel closes.
  const live = Boolean(conversation?.handoffRequested);
  useEffect(() => {
    if (conversation) setLive(live);
  }, [conversation, live]);

  // Whatever is on screen in a visible tab counts as read.
  useEffect(() => {
    if (!open || pageHidden() || !messages.length) return;
    markSeen(messages[messages.length - 1].at);
    hiddenUnreadRef.current = 0;
    showUnreadInTitle(0);
  }, [open, messages]);

  useEffect(() => {
    if (!open) return undefined;
    const onVisible = () => {
      if (pageHidden()) return;
      const latest = messagesRef.current[messagesRef.current.length - 1];
      if (latest) markSeen(latest.at);
      hiddenUnreadRef.current = 0;
      showUnreadInTitle(0);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [open]);

  const send = useCallback(
    async ({ text = '', actionId = '', actionLabel = '' }) => {
      if (!tokenRef.current || sending) return;

      const echo = text || actionLabel;
      const optimistic = {
        id: `pending-${Date.now()}`,
        role: 'user',
        text: echo,
        at: new Date().toISOString(),
        pending: true,
      };

      setMessages((prev) => [...prev, optimistic]);
      setSending(true);
      setError('');

      try {
        const data = await sendChatMessage({
          sessionToken: tokenRef.current,
          text,
          actionId,
          actionLabel,
          productContext: contextRef.current || undefined,
        });
        applyResponse(data);
      } catch {
        setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
        setError(GENERIC_ERROR);
      } finally {
        setSending(false);
      }
    },
    [applyResponse, sending]
  );

  const submitHandoff = useCallback(
    async (payload) => {
      const data = await requestChatHandoff({ ...payload, sessionToken: tokenRef.current });
      applyResponse(data);
    },
    [applyResponse]
  );

  const submitStatusCheck = useCallback(
    async (payload) => {
      const data = await checkInquiryStatus({ ...payload, sessionToken: tokenRef.current });
      applyResponse(data);
    },
    [applyResponse]
  );

  const confirmInquiry = useCallback(
    async (referenceId) => {
      const data = await recordChatInquiry({ sessionToken: tokenRef.current, referenceId });
      applyResponse(data);
    },
    [applyResponse]
  );

  // Only a conversation with the team needs polling: the assistant's replies
  // already arrive in the send response. The first check runs straight away,
  // so replies that came in while the panel was closed show up at once.
  useEffect(() => {
    if (!open || !live || !tokenRef.current) return undefined;

    const controller = new AbortController();
    const check = async () => {
      const known = new Set(messagesRef.current.map((message) => message.id));
      const last = messagesRef.current[messagesRef.current.length - 1];
      try {
        const data = await pollChatMessages({
          sessionToken: tokenRef.current,
          after: last?.at,
          signal: controller.signal,
        });
        const fresh = (data.messages || []).filter((message) => message.role !== 'user' && !known.has(message.id));
        applyResponse(data);

        const latest = fresh[fresh.length - 1];
        if (latest && shouldAnnounce(latest)) {
          if (pageHidden()) {
            hiddenUnreadRef.current += fresh.length;
            showUnreadInTitle(hiddenUnreadRef.current);
          }
          if (latest.role === 'agent' || pageHidden()) announceReply(latest);
        }
      } catch {
        // A dropped poll is recoverable on the next tick.
      }
    };

    check();
    const timer = setInterval(check, LIVE_POLL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [open, live, applyResponse]);

  // A brand-new conversation: the old one stays on the server (the team can
  // still read it), the widget simply stops using it.
  const restart = useCallback(async () => {
    tokenRef.current = '';
    forgetSession();
    startedRef.current = false;
    setMessages([]);
    setConversation(null);
    setError('');
    await start();
  }, [start]);

  const retry = useCallback(() => {
    setError('');
    if (!tokenRef.current) {
      startedRef.current = false;
      start();
    }
  }, [start]);

  return {
    messages,
    conversation,
    loading: starting,
    sending,
    error,
    send,
    submitHandoff,
    submitStatusCheck,
    confirmInquiry,
    retry,
    restart,
  };
}
