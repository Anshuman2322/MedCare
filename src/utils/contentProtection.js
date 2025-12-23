/* Lightweight content protection for the main website.
 * Notes: This raises friction but cannot fully prevent copying or devtools usage.
 */

export function enableContentProtection() {
  try {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    }, { passive: false });

    // Block copy/cut operations globally
    document.addEventListener('copy', (e) => { e.preventDefault(); }, { passive: false });
    document.addEventListener('cut', (e) => { e.preventDefault(); }, { passive: false });

    // Prevent dragging (e.g., images)
    document.addEventListener('dragstart', (e) => { e.preventDefault(); }, { passive: false });

    // Disable selection by default, allow on interactive controls
    const style = document.createElement('style');
    style.setAttribute('data-protection-style', 'true');
    style.textContent = `
      html, body, #root { -webkit-user-select: none; user-select: none; }
      img, video, audio { -webkit-user-drag: none; }
      input, textarea, select, [contenteditable="true"], .allow-select { -webkit-user-select: text; user-select: text; }
    `;
    document.head.appendChild(style);

    // Block common DevTools and save/print shortcuts
    const shouldBlockKey = (e) => {
      const k = (e.key || '').toLowerCase();
      return (
        k === 'f12' ||
        (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
        (e.ctrlKey && (k === 'u' || k === 's' || k === 'p')) ||
        (e.metaKey && (k === 'u' || k === 's' || k === 'p'))
      );
    };
    window.addEventListener('keydown', (e) => {
      if (shouldBlockKey(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { capture: true });

    // Observer to mark media as non-downloadable and images non-draggable
    const applyMediaGuards = () => {
      document.querySelectorAll('img').forEach((img) => {
        if (!img.hasAttribute('draggable')) img.setAttribute('draggable', 'false');
        img.addEventListener('contextmenu', (ev) => ev.preventDefault());
      });
      document.querySelectorAll('video').forEach((v) => {
        v.setAttribute('controlsList', 'nodownload');
        v.addEventListener('contextmenu', (ev) => ev.preventDefault());
      });
      document.querySelectorAll('audio').forEach((a) => {
        a.setAttribute('controlsList', 'nodownload');
        a.addEventListener('contextmenu', (ev) => ev.preventDefault());
      });
      // Remove explicit download attributes on links
      document.querySelectorAll('a[download]').forEach((a) => a.removeAttribute('download'));
    };
    applyMediaGuards();
    const mo = new MutationObserver(applyMediaGuards);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (err) {
    // Fail silently to avoid breaking the app
    console.warn('Content protection init warning:', err);
  }
}
