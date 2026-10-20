'use client';

import React from 'react';

export default function PageBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Soft Radial Ambient Glow in Brand Blue */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] sm:w-[850px] md:w-[1100px] h-[450px] bg-gradient-to-b from-brand-200/40 via-brand-100/20 to-transparent rounded-full blur-3xl opacity-80" />
      <div className="absolute -top-16 -left-20 w-80 h-80 bg-blue-200/25 rounded-full blur-3xl opacity-60" />
      <div className="absolute -top-16 -right-20 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl opacity-60" />

      {/* Tech Dot Matrix Grid with Smooth Radial Fade */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 10%, #000 40%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 60% at 50% 10%, #000 40%, transparent 95%)'
        }}
      />
    </div>
  );
}
