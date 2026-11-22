// How a visitor finds out the team replied when they aren't looking at the
// chat: a short chime, an unread count in the tab title and, if they allowed
// it, a browser notification. Every call is best-effort: a browser that blocks
// any of these simply skips it.

let audioContext = null;

// Two soft notes generated in the browser, no audio file to download.
export function playChime() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ??= new Context();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const start = audioContext.currentTime;
    [880, 1318.5].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const at = start + index * 0.14;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.12, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.32);
    });
  } catch {
    // No sound is fine.
  }
}

// "(2) Shop by Category | CureNeed" while replies are waiting to be read.
export function showUnreadInTitle(count) {
  if (typeof document === 'undefined') return;
  const clean = document.title.replace(/^\(\d+\)\s+/, '');
  document.title = count > 0 ? `(${count}) ${clean}` : clean;
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export const notificationPermission = () => (notificationsSupported() ? window.Notification.permission : 'unsupported');

// Must be called from a click: browsers only show the permission prompt then.
export async function askNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (window.Notification.permission !== 'default') return window.Notification.permission;
  try {
    return await window.Notification.requestPermission();
  } catch {
    return window.Notification.permission;
  }
}

export function showBrowserNotification({ title, body, onClick }) {
  if (notificationPermission() !== 'granted') return;
  try {
    const notification = new window.Notification(title, { body, tag: 'cureneed-chat' });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}

// A new message from the team: chime, and a notification when the tab isn't
// in front.
export function announceReply(message, { onOpen } = {}) {
  playChime();
  if (typeof document !== 'undefined' && document.hidden) {
    showBrowserNotification({
      title: `${message.agentName || 'CureNeed Support'} replied`,
      body: String(message.text || '').slice(0, 160),
      onClick: onOpen,
    });
  }
}
