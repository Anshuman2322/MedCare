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

// 🔥 Prevent crash from missing export
export const AnimatedCard = ({ children }) => children;