import React from 'react';
import heroBg from '../assets/hero-pharmacy.jpg';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';

const Hero = () => {
  const [titleRef, titleVisible] = useScrollAnimation(0.1, 0);
  const [subtitleRef, subtitleVisible] = useScrollAnimation(0.1, 200);
  const [buttonsRef, buttonsVisible] = useScrollAnimation(0.1, 400);

  return (
    <section className="relative w-full">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Left shading for legibility (white fade to transparent) */}
      <div className="absolute inset-0 bg-linear-to-r from-white/85 via-white/70 to-transparent" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32 min-h-[520px] md:min-h-[560px] lg:min-h-[640px] flex items-center">
          <div className="max-w-3xl">
            <h1 
              ref={titleRef}
              className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 ${animationClasses.fadeUp(titleVisible)}`}
            >
              <span className="block">Your Health, Our</span>
              <span className="block text-emerald-600">Priority</span>
            </h1>
            <p 
              ref={subtitleRef}
              className={`mt-4 text-base sm:text-lg md:text-xl text-gray-700/90 max-w-2xl ${animationClasses.fadeUp(subtitleVisible)}`}
            >
              Quality medicines delivered to your doorstep. Fast, reliable and affordable
              healthcare products you can trust.
            </p>
            <div 
              ref={buttonsRef}
              className={`mt-6 flex flex-col sm:flex-row sm:items-center gap-3 ${animationClasses.fadeUp(buttonsVisible)}`}
            >
              <button className="inline-flex items-center justify-center px-5 md:px-6 lg:px-7 py-2.5 md:py-3 rounded-lg bg-emerald-600 text-white text-sm md:text-base font-medium shadow hover:bg-emerald-700 transition-colors">
                Shop Now
              </button>
              <button className="inline-flex items-center justify-center px-5 md:px-6 lg:px-7 py-2.5 md:py-3 rounded-lg border border-emerald-200 bg-white text-emerald-700 text-sm md:text-base font-medium hover:bg-emerald-50 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;