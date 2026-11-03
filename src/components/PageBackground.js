'use client';

import React from 'react';

export default function PageBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* 1. Multi-Stop Ambient Mesh Glow (Spans Top, Middle & Bottom so scroll never goes flat) */}
      {/* Hero Center Brand Blue Aura */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[750px] sm:w-[1000px] md:w-[1200px] h-[550px] bg-gradient-to-b from-brand-300/40 via-sky-200/25 to-transparent rounded-full blur-3xl opacity-85" />
      
      {/* Top Left Cool Accent */}
      <div className="absolute -top-20 -left-24 w-[380px] sm:w-[480px] h-[480px] bg-gradient-to-br from-blue-300/25 via-brand-200/20 to-transparent rounded-full blur-3xl opacity-70" />
      
      {/* Top Right Cyan Highlight */}
      <div className="absolute -top-16 -right-24 w-[420px] sm:w-[520px] h-[520px] bg-gradient-to-bl from-cyan-300/30 via-sky-200/20 to-transparent rounded-full blur-3xl opacity-75" />

      {/* Mid-Page Ambient Aura (Right side - covers tutorials section & admin tables) */}
      <div className="absolute top-[35%] -right-36 w-[500px] sm:w-[650px] h-[650px] bg-gradient-to-l from-brand-200/25 via-sky-100/15 to-transparent rounded-full blur-3xl opacity-60" />

      {/* Lower-Page Ambient Aura (Left side - adds depth to bottom scroll) */}
      <div className="absolute top-[65%] -left-36 w-[500px] sm:w-[650px] h-[650px] bg-gradient-to-r from-blue-200/20 via-brand-100/15 to-transparent rounded-full blur-3xl opacity-60" />

      {/* Bottom Subtle Grounding Glow */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[350px] bg-gradient-to-t from-brand-100/25 to-transparent rounded-full blur-3xl opacity-50" />

      {/* 2. Modern Architectural Tech Grid (Crisp 40px × 40px lines that frame the entire page) */}
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(15, 23, 42, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 85% 80% at 50% 35%, #000 65%, rgba(0,0,0,0.3) 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 80% at 50% 35%, #000 65%, rgba(0,0,0,0.3) 100%)',
        }}
      />

      {/* 3. Tech Intersection Accents (Fine Brand-Blue Dots at Grid Centers) */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(0, 106, 199, 0.25) 1.2px, transparent 1.2px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0',
          maskImage: 'radial-gradient(ellipse 75% 70% at 50% 25%, #000 45%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 25%, #000 45%, transparent 95%)',
        }}
      />

      {/* 4. Micro-Texture Grain (Removes digital flat/banding, creates premium paper/frosted feel) */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
