import { Component } from 'react';

// Top-level safety net: if anything below throws during render, this shows a
// real "something went wrong" screen instead of leaving the user with a
// blank white page and nothing but a console stack trace.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled error in app tree:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-3">Something went wrong</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              We hit a snag loading this page
            </h1>
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              Try reloading the page. If the problem keeps happening, head back to the homepage and try again from there.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 transition-colors"
              >
                Back to Home
              </a>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-sm font-medium hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
