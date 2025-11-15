import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scroll to top on route change to avoid landing mid-page due to preserved scroll.
export default function ScrollToTop({ behavior = 'auto' }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If navigating to an anchor, let the browser handle it.
    if (hash && hash !== '#') return;
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, hash, behavior]);

  return null;
}
