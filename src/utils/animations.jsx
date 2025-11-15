/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react';

// Custom hook for scroll animations
export const useScrollAnimation = (threshold = 0.1, delay = 0) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible, threshold, delay]);

  return [ref, isVisible];
};

// Animation class names for different effects
export const animationClasses = {
  // Fade and slide up
  fadeUp: (isVisible) => 
    `transition-all duration-1000 ease-out ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`,
  
  // Fade and slide from left
  fadeLeft: (isVisible) => 
    `transition-all duration-1000 ease-out ${
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
    }`,
  
  // Fade and slide from right
  fadeRight: (isVisible) => 
    `transition-all duration-1000 ease-out ${
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
    }`,
  
  // Fade with scale
  fadeScale: (isVisible) => 
    `transition-all duration-1000 ease-out ${
      isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
    }`,
  
  // Fast fade up for cards
  fadeUpFast: (isVisible) => 
    `transition-all duration-700 ease-out ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    }`,
  
  // Bounce in effect
  bounceIn: (isVisible) => 
    `transition-all duration-800 ease-out ${
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
    }`
};

// Pre-built animated components
export const AnimatedSection = ({ children, className = '', delay = 0, animation = 'fadeUp' }) => {
  const [ref, isVisible] = useScrollAnimation(0.1, delay);
  
  return (
    <div ref={ref} className={`${animationClasses[animation](isVisible)} ${className}`}>
      {children}
    </div>
  );
};

export const AnimatedCard = ({ children, className = '', delay = 0, index = 0, stagger = true }) => {
  const computedDelay = stagger ? delay + (index * 60) : delay; // shorter stagger; can be disabled
  const [ref, isVisible] = useScrollAnimation(0.05, computedDelay);
  return (
    <div ref={ref} className={`${animationClasses.fadeUpFast(isVisible)} ${className}`}>
      {children}
    </div>
  );
};