import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement IntersectionObserver, which the scroll-in animation
// hooks (utils/animations.jsx) construct on mount — without this, every page
// using them throws immediately in tests.
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver;

// embla-carousel also watches slide/container size via ResizeObserver,
// which jsdom doesn't implement either.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

// jsdom doesn't implement matchMedia either, which embla-carousel reads on
// init to evaluate its responsive breakpoint options (CategoryCarousel) —
// without this, mounting the homepage throws immediately in tests.
window.matchMedia = window.matchMedia || function matchMedia(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};

