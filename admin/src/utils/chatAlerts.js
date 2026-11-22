// Alerts for the support team when a customer is waiting in the website chat:
// a short chime, a count in the tab title and, if allowed, a desktop
// notification. Each is best-effort; a browser that blocks one just skips it.

let audioContext = null;

export function playChime() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ??= new Context();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const start = audioContext.currentTime;
    [660, 880, 1046.5].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const at = start + index * 0.13;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.3);
    });
  } catch {
    // No sound is fine.
  }
}

// "(2) CureNeed Admin" while customers are waiting.
export function showCountInTitle(count) {
  const clean = document.title.replace(/^\(\d+\)\s+/, '');
  document.title = count > 0 ? `(${count}) ${clean}` : clean;
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export const notificationPermission = () => (notificationsSupported() ? window.Notification.permission : 'unsupported');

// Call from a click: browsers only show the permission prompt then.
export async function askNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (window.Notification.permission !== 'default') return window.Notification.permission;
  try {
    return await window.Notification.requestPermission();
  } catch {
    return window.Notification.permission;
  }
}

export function showDesktopNotification({ title, body, onClick }) {
  if (notificationPermission() !== 'granted') return;
  try {
    const notification = new window.Notification(title, { body, tag: 'cureneed-support-chat' });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch {
    // Some browsers only allow notifications from a service worker.
  }
}
