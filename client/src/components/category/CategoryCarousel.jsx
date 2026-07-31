import React, { useCallback, useMemo, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
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

// Continuous marquee-style category carousel (Apple showcase / logo-wall
// style), not a slide-by-slide autoplay: AutoScroll nudges the track a
// fraction of a pixel every frame via Embla's GPU-accelerated translate3d
// track transform, rather than snapping to discrete positions. `speed` is
// tuned so one full pass of the (duplicated) category list takes roughly
// 30s. The list is rendered twice back-to-back - with loop:true a single
// copy is usually wide enough on its own, but doubling it guarantees
// there's never a visible gap at the seam even on very wide viewports.
// The second copy is aria-hidden so screen readers and Tab order only
// see each category once.
export default function CategoryCarousel({ categories }) {
  const autoScroll = useRef(
    // speed is px moved per animation frame (~60fps), so speed * 60 ≈ px/sec.
    // Measured empirically: at speed 0.55 the track moved ~33px/s. With 17
    // cards at 250px + 24px gaps (~4634px for one full pass), 2.6 lands
    // one complete cycle at roughly 4634 / (2.6 * 60) ≈ 30s.
    AutoScroll({ speed: 2.6, startDelay: 0, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', containScroll: false, dragFree: true, skipSnaps: true },
    [autoScroll.current]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollNext();
    }
  };

  const loopedSlides = useMemo(
    () => [
      ...categories.map((c) => ({ ...c, key: `${c.name}-a`, hidden: false })),
      ...categories.map((c) => ({ ...c, key: `${c.name}-b`, hidden: true })),
    ],
    [categories]
  );

  return (
    <div>
      <div className="mb-8 flex justify-end">
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
          {loopedSlides.map(({ key, hidden, ...c }) => (
            <div
              key={key}
              className="min-w-0 flex-[0_0_250px]"
              role="group"
              aria-roledescription="slide"
              aria-label={c.name}
              aria-hidden={hidden}
            >
              <CategoryCard
                name={c.name}
                description={c.description}
                Illustration={c.illustration}
                href={`/shop?category=${encodeURIComponent(c.name)}`}
                tabIndex={hidden ? -1 : 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
