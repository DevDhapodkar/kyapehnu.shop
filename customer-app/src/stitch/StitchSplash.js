import React, { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { LOGO_DATA_URI } from '../constants/logoDataUri';

const LIGHT_HTML = `<main class="fixed inset-0 z-50 w-full h-full flex flex-col justify-between items-center bg-[#FAF9F5] select-none px-6 py-14 overflow-hidden">
  <!-- Top spacing anchor -->
  <div class="w-full h-6"></div>

  <!-- Center brand hero -->
  <div class="flex flex-col items-center text-center my-auto z-10 max-w-sm">
    <div class="relative mb-6">
      <div class="absolute -inset-4 bg-gradient-to-tr from-[#C4243A]/20 via-amber-500/10 to-rose-500/15 rounded-[36px] blur-2xl animate-pulse"></div>
      <div class="relative w-28 h-28 rounded-[28px] bg-gradient-to-b from-[#C4243A] to-[#920021] p-1 shadow-2xl flex items-center justify-center border border-white/60">
        <img src="` + LOGO_DATA_URI + `" alt="Kya Pehnu? Logo" class="w-full h-full object-cover rounded-[24px]" />
      </div>
    </div>

    <h1 class="text-4xl font-extrabold text-neutral-950 tracking-tight mb-2 font-sans">
      Kya Pehnu<span class="text-[#C4243A]">?</span>
    </h1>
    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-[#C4243A] mb-1.5">
      Nagpur's 45-Minute Fashion App
    </p>
    <p class="text-xs text-neutral-500 max-w-[260px] leading-relaxed">
      Trending streetwear, party wear &amp; everyday fits delivered to your doorstep.
    </p>
  </div>

  <!-- Bottom progress bar & delivery guarantee -->
  <div class="w-full max-w-xs flex flex-col items-center gap-3 z-10">
    <div class="w-48 h-1 bg-neutral-200 rounded-full overflow-hidden relative shadow-inner">
      <div class="h-full bg-gradient-to-r from-[#C4243A] via-rose-500 to-amber-500 rounded-full w-full animate-pulse"></div>
    </div>
    <div class="flex items-center gap-2 text-[11px] text-neutral-400 font-medium tracking-wide">
      <span class="material-symbols-outlined text-[14px] text-[#C4243A]">bolt</span>
      <span>Delivered from local Nagpur boutiques in 45 mins</span>
    </div>
  </div>
</main>`;

const DARK_HTML = `<main class="fixed inset-0 z-50 w-full h-full flex flex-col justify-between items-center bg-[#0E0E10] select-none px-6 py-14 overflow-hidden">
  <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#C4243A]/15 blur-[120px] pointer-events-none"></div>

  <!-- Top spacing anchor -->
  <div class="w-full h-6"></div>

  <!-- Center brand hero -->
  <div class="flex flex-col items-center text-center my-auto z-10 max-w-sm">
    <div class="relative mb-6">
      <div class="absolute -inset-4 bg-gradient-to-tr from-[#C4243A]/25 via-amber-500/10 to-rose-500/15 rounded-[36px] blur-2xl animate-pulse"></div>
      <div class="relative w-28 h-28 rounded-[28px] bg-gradient-to-b from-[#C4243A] to-[#680016] p-1 shadow-2xl flex items-center justify-center border border-white/20">
        <img src="` + LOGO_DATA_URI + `" alt="Kya Pehnu? Logo" class="w-full h-full object-cover rounded-[24px]" />
      </div>
    </div>

    <h1 class="text-4xl font-extrabold text-neutral-50 tracking-tight mb-2 font-sans">
      Kya Pehnu<span class="text-rose-400">?</span>
    </h1>
    <p class="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400 mb-1.5">
      Nagpur's 45-Minute Fashion App
    </p>
    <p class="text-xs text-neutral-400 max-w-[260px] leading-relaxed">
      Trending streetwear, party wear &amp; everyday fits delivered to your doorstep.
    </p>
  </div>

  <!-- Bottom progress bar & delivery guarantee -->
  <div class="w-full max-w-xs flex flex-col items-center gap-3 z-10">
    <div class="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden relative shadow-inner">
      <div class="h-full bg-gradient-to-r from-[#C4243A] via-rose-500 to-amber-400 rounded-full w-full animate-pulse"></div>
    </div>
    <div class="flex items-center gap-2 text-[11px] text-neutral-500 font-medium tracking-wide">
      <span class="material-symbols-outlined text-[14px] text-rose-400">bolt</span>
      <span>Delivered from local Nagpur boutiques in 45 mins</span>
    </div>
  </div>
</main>`;

export default function StitchSplash({ onFinish }) {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish?.();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-50 w-full h-full cursor-pointer flex flex-col justify-center items-center"
      dangerouslySetInnerHTML={{ __html: isDark ? DARK_HTML : LIGHT_HTML }}
    />
  );
}

