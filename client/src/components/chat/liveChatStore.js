import { useSyncExternalStore } from 'react';

// Shared state for the support chat, used by the always-mounted launcher
// (ChatWidget) and the lazily loaded panel (ChatPanel / useChatSession).
//
// Kept in sessionStorage so it survives page changes and reloads in this tab:
//   token  the visitor's chat session
//   live   '1' once they asked to talk to the team (the launcher then keeps
//          checking for the team's replies even while the panel is closed)
//   seen   time of the newest message they have actually seen

const TOKEN_KEY = 'cureneed-chat-session';
const LIVE_KEY = 'cureneed-chat-live';
const SEEN_KEY = 'cureneed-chat-seen';

function read(key) {
  try {
    return sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function write(key, value) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Private browsing can reject storage; the chat still works in memory.
  }
}

export const readToken = () => read(TOKEN_KEY);
export const writeToken = (token) => write(TOKEN_KEY, token);

export const isLive = () => read(LIVE_KEY) === '1';
export const setLive = (live) => write(LIVE_KEY, live ? '1' : '');

export const readSeen = () => read(SEEN_KEY);
export function markSeen(at) {
  const next = Date.parse(at || '');
  if (!Number.isFinite(next)) return;
  const previous = Date.parse(read(SEEN_KEY)) || 0;
  if (next > previous) write(SEEN_KEY, new Date(next).toISOString());
}

export function forgetSession() {
  write(TOKEN_KEY, '');
  write(LIVE_KEY, '');
  write(SEEN_KEY, '');
  lastAnnounced = 0;
  setUnread({ unread: 0, preview: null });
}

// Each reply is announced (sound, notification) once, however often it's polled.
let lastAnnounced = 0;
export function shouldAnnounce(message) {
  const at = Date.parse(message?.at || '');
  if (!Number.isFinite(at) || at <= lastAnnounced) return false;
  lastAnnounced = at;
  return true;
}

// Unread replies from the team while the panel is closed (launcher badge and
// the preview bubble above it).
let state = { unread: 0, preview: null };
const listeners = new Set();

export function setUnread(next) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

export function useUnread() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
