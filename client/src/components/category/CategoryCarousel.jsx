import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import CategoryCard from './CategoryCard.jsx';

const PrevIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

const NextIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

// Full-width, infinite-loop, auto-scrolling category carousel: mouse drag
// and touch swipe are native Embla behavior, autoplay pauses on
// hover/focus and resumes after interaction, and a continuous progress
// indicator (not pagination dots) tracks scroll position above the cards.
export default function CategoryCarousel({ categories }) {
  const autoplay = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', containScroll: false },
    [autoplay.current]
  );
  const [progress, setProgress] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const updateProgress = useCallback((api) => {
    setProgress(Math.min(1, Math.max(0, api.scrollProgress())));
  }, []);

  useEffect(() => {
    if (!emblaApi) return undefined;
    updateProgress(emblaApi);
    emblaApi.on('scroll', updateProgress);
    emblaApi.on('reInit', updateProgress);
    return () => {
      emblaApi.off('scroll', updateProgress);
      emblaApi.off('reInit', updateProgress);
    };
  }, [emblaApi, updateProgress]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollNext();
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <div className="relative h-[2px] flex-1 rounded-full bg-[#E5E7EB]">
          <div
            className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#16A34A] shadow-[0_0_0_4px_rgba(22,163,74,0.15)] transition-[left] duration-150 ease-linear"
            style={{ left: `calc(${progress * 100}% - 5px)` }}
          />
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous categories"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#0F172A] transition-all duration-200 hover:border-[#16A34A] hover:text-[#16A34A] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next categories"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#0F172A] transition-all duration-200 hover:border-[#16A34A] hover:text-[#16A34A] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
          >
            <NextIcon />
          </button>
        </div>
      </div>

      <div
        ref={emblaRef}
        className="overflow-hidden focus:outline-none"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Shop by category"
        onKeyDown={onKeyDown}
      >
        <div className="flex gap-6">
          {categories.map((c) => (
            <div
              key={c.name}
              className="min-w-0 flex-[0_0_250px]"
              role="group"
              aria-roledescription="slide"
              aria-label={c.name}
            >
              <CategoryCard
                name={c.name}
                description={c.description}
                Illustration={c.illustration}
                href={`/shop?category=${encodeURIComponent(c.name)}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
