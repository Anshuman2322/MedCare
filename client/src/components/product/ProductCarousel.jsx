import React, { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import ProductCard from './ProductCard.jsx';

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

// Premium showcase slider (Apple/Nike style discrete slides, not a
// continuous marquee): peek effect via percentage-based flex-basis so
// the next card is always ~25% visible, loop:true + Embla's own eased
// scroll physics (duration tuned toward ~600ms, never an abrupt jump),
// autoplay every 4.5s that pauses on hover/focus and resumes after
// manual interaction, floating circular prev/next, and dot pagination.
export default function ProductCarousel({ products, onQuickInquiry }) {
  const autoplay = useRef(
    Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', duration: 36 },
    [autoplay.current]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback((api) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return undefined;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect(emblaApi);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', () => {
      setScrollSnaps(emblaApi.scrollSnapList());
      onSelect(emblaApi);
    });
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

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
      {/* Buttons are absolutely positioned against this row-only wrapper
          (not the outer div that also contains the dots below), so
          top-1/2 centers on the card row's own height, not the whole
          carousel block including pagination. */}
      <div className="relative">
        <div
          ref={emblaRef}
          className="overflow-hidden focus:outline-none"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured medicines"
          onKeyDown={onKeyDown}
        >
          <div className="flex gap-6">
            {products.map((product) => (
              <div
                key={product.slug || product._id}
                className="min-w-0 flex-[0_0_83%] sm:flex-[0_0_40%] lg:flex-[0_0_23.5%]"
                role="group"
                aria-roledescription="slide"
                aria-label={product.name}
              >
                <ProductCard product={product} onQuickInquiry={onQuickInquiry} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous products"
          className="absolute -left-2 lg:-left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0F172A] shadow-[0_4px_16px_rgba(15,23,42,0.15)] transition-all duration-200 hover:scale-105 hover:bg-[#16A34A] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
        >
          <PrevIcon />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next products"
          className="absolute -right-2 lg:-right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0F172A] shadow-[0_4px_16px_rgba(15,23,42,0.15)] transition-all duration-200 hover:scale-105 hover:bg-[#16A34A] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
        >
          <NextIcon />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Slide pagination">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === selectedIndex}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] ${
              index === selectedIndex ? 'w-6 bg-[#16A34A]' : 'w-2 bg-[#E5E7EB] hover:bg-[#CBD5E1]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
