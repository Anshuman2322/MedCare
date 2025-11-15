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
        <div className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 min-h-[480px] sm:min-h-[520px] md:min-h-[560px] lg:min-h-[640px] flex items-center">
          <div className="max-w-2xl lg:max-w-3xl">
            <h1 
              ref={titleRef}
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight ${animationClasses.fadeUp(titleVisible)}`}
            >
              <span className="block">Your Health, Our</span>
              <span className="block text-emerald-600">Priority</span>
            </h1>
            <p 
              ref={subtitleRef}
              className={`mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-700/90 max-w-xl lg:max-w-2xl leading-relaxed ${animationClasses.fadeUp(subtitleVisible)}`}
            >
              Quality medicines delivered to your doorstep. Fast, reliable and affordable
              healthcare products you can trust.
            </p>
            <div 
              ref={buttonsRef}
              className={`mt-6 sm:mt-8 flex flex-row items-center gap-3 sm:gap-4 ${animationClasses.fadeUp(buttonsVisible)}`}
            >
              <button className="inline-flex items-center justify-center px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 rounded-lg bg-emerald-600 text-white text-sm sm:text-base font-medium shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                Shop Now
              </button>
              <button className="inline-flex items-center justify-center px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 rounded-lg border border-emerald-200 bg-white/90 backdrop-blur-sm text-emerald-700 text-sm sm:text-base font-medium hover:bg-emerald-50 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200">
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