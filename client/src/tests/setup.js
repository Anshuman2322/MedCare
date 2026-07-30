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

