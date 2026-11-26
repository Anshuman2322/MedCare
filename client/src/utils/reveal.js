// Scroll reveal and pointer glow for the classes in styles/effects.css.
//
// Safe by design:
// - Content is only hidden after this has started (html.cn-reveal-on), so if it
//   never runs (old browser, error, tests) everything is simply visible.
// - The "seen" state is a data attribute (data-in), not a class, so a React
//   re-render that rewrites className can never hide an element again.
// - Anything already on screen, or above it, is shown straight away.
// - New elements (route changes, lazy pages) are picked up automatically.

const SELECTOR = '.cn-reveal';
let started = false;

// animate: play the entrance (scrolled into view); otherwise just show it.
function show(el, animate = false) {
  el.setAttribute('data-in', animate ? 'anim' : '');
}

export function initReveal() {
  if (started || typeof window === 'undefined') return;
  started = true;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduced) return; // no hiding at all

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
          show(entry.target, entry.isIntersecting);
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  const scan = () => {
    document.querySelectorAll(`${SELECTOR}:not([data-in]):not([data-reveal-watch])`).forEach((el) => {
      el.setAttribute('data-reveal-watch', '');
      // On screen on arrival: play the entrance now. Scrolled past: just show it.
      const rect = el.getBoundingClientRect();
      if (rect.bottom <= 0) show(el);
      else if (rect.top < window.innerHeight * 0.92) show(el, true);
      else observer.observe(el);
    });
  };

  document.documentElement.classList.add('cn-reveal-on');
  scan();

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      scan();
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  // Pointer-following light on glow cards (cheap: one listener, CSS variables only).
  document.addEventListener(
    'pointermove',
    (event) => {
      const card = event.target instanceof Element ? event.target.closest('.cn-glow-card, .cn-glow-soft') : null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--cn-mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--cn-my', `${event.clientY - rect.top}px`);
    },
    { passive: true }
  );
}
