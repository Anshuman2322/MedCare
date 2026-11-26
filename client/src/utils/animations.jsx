import { useEffect, useRef, useState } from "react";

export function useScrollAnimation() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

// Scroll-reveal classes (styles/effects.css, driven by utils/reveal.js). The
// "visible" argument is ignored: reveal.js decides when an element is seen.
export const animationClasses = {
  fadeUp: () => "cn-reveal",
  fadeLeft: () => "cn-reveal cn-reveal-left",
  fadeRight: () => "cn-reveal cn-reveal-right",
  zoom: () => "cn-reveal cn-reveal-zoom",
};

// Wraps children in a single element so multi-child callers (e.g. an image
// div + an info div meant to form one card) don't get flattened into
// separate siblings - that flattening is what breaks CSS Grid layouts,
// since each sibling becomes its own grid item instead of one combined card.
// Each card fades in as it scrolls into view, a few cards in a row slightly staggered.
export const AnimatedCard = ({ children, className = '', index = 0, delay = 0, stagger = true, style, ...rest }) => (
  <div
    className={`cn-reveal ${className}`.trim()}
    style={{ '--cn-d': `${(Number(delay) || 0) + (stagger ? (index % 4) * 70 : 0)}ms`, ...style }}
    {...rest}
  >
    {children}
  </div>
);