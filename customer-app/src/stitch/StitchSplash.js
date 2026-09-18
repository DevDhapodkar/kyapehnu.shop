
import React, { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { LOGO_DATA_URI } from '../constants/logoDataUri';

const LIGHT_HTML = `<main class="fixed inset-0 z-50 w-full h-full flex flex-col justify-between items-center bg-[#FAF9F5] select-none px-6 py-16 overflow-hidden">
  <!-- Top spacing -->
  <div class="w-full h-8"></div>

  <!-- Center brand hero -->
  <div class="flex flex-col items-center text-center my-auto z-10 max-w-sm">
    <div class="relative mb-6">
      <div class="absolute -inset-4 bg-gradient-to-tr from-[#C4243A]/15 to-transparent rounded-[36px] blur-2xl"></div>
      <div class="relative w-24 h-24 rounded-[26px] bg-gradient-to-b from-[#C4243A] to-[#920021] p-1 shadow-2xl flex items-center justify-center border border-white/60">
        <img src="` + LOGO_DATA_URI + `" alt="Kya Pehnu? Logo" class="w-full h-full object-cover rounded-[22px]" />
      </div>
    </div>

    <h1 class="font-display-hero-mobile text-display-hero-mobile text-text-obsidian tracking-tight mb-2 font-normal text-4xl" style="font-family: 'EB Garamond', Georgia, serif;">
      Kya Pehnu?
    </h1>
    <p class="text-[13px] text-neutral-500 font-normal tracking-wide mt-2">
      Fashion Delivered in 45 Minutes · Nagpur
    </p>
  </div>

  <!-- Bottom minimal indicator -->
  <div class="w-full max-w-xs flex flex-col items-center gap-3 z-10">
    <div class="w-12 h-1 bg-neutral-200/80 rounded-full overflow-hidden relative">
      <div class="h-full bg-[#C4243A] rounded-full w-full animate-pulse"></div>
    </div>
    <span class="text-[11px] text-neutral-400 font-normal tracking-wider">
      Nagpur's Fast Fashion App
    </span>
  </div>
</main>`;

const DARK_HTML = `<main class="fixed inset-0 z-50 w-full h-full flex flex-col justify-between items-center bg-[#0E0E10] select-none px-6 py-16 overflow-hidden">
  <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#C4243A]/10 blur-[120px] pointer-events-none"></div>

  <!-- Top spacing -->
  <div class="w-full h-8"></div>

  <!-- Center brand hero -->
  <div class="flex flex-col items-center text-center my-auto z-10 max-w-sm">
    <div class="relative mb-6">
      <div class="absolute -inset-4 bg-gradient-to-tr from-[#C4243A]/20 to-transparent rounded-[36px] blur-2xl"></div>
      <div class="relative w-24 h-24 rounded-[26px] bg-gradient-to-b from-[#C4243A] to-[#680016] p-1 shadow-2xl flex items-center justify-center border border-white/10">
        <img src="` + LOGO_DATA_URI + `" alt="Kya Pehnu? Logo" class="w-full h-full object-cover rounded-[22px]" />
      </div>
    </div>

    <h1 class="font-display-hero-mobile text-display-hero-mobile text-[#F5F3EF] tracking-tight mb-2 font-normal text-4xl" style="font-family: 'EB Garamond', Georgia, serif;">
      Kya Pehnu?
    </h1>
    <p class="text-[13px] text-neutral-400 font-normal tracking-wide mt-2">
      Fashion Delivered in 45 Minutes · Nagpur
    </p>
  </div>

  <!-- Bottom minimal indicator -->
  <div class="w-full max-w-xs flex flex-col items-center gap-3 z-10">
    <div class="w-12 h-1 bg-neutral-800 rounded-full overflow-hidden relative">
      <div class="h-full bg-rose-400 rounded-full w-full animate-pulse"></div>
    </div>
    <span class="text-[11px] text-neutral-500 font-normal tracking-wider">
      Nagpur's Fast Fashion App
    </span>
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
