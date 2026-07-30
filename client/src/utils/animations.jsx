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

export const animationClasses = {
  fadeUp: () => "",
  fadeLeft: () => "",
  fadeRight: () => ""
};

// Wraps children in a single element so multi-child callers (e.g. an image
// div + an info div meant to form one card) don't get flattened into
// separate siblings - that flattening is what breaks CSS Grid layouts,
// since each sibling becomes its own grid item instead of one combined card.
export const AnimatedCard = ({ children, className = '', index, delay, stagger, ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);