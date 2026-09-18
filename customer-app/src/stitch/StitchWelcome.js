
import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { LOGO_DATA_URI } from '../constants/logoDataUri';

const LIGHT_HTML = `<main class="flex-1 flex flex-col justify-between w-full max-w-md mx-auto min-h-screen px-6 py-8 sm:py-12 select-none bg-[#FAF9F5] text-neutral-900 relative overflow-hidden font-sans">
  <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-rose-500/5 blur-3xl pointer-events-none -z-10"></div>
  <div class="absolute bottom-1/4 right-0 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none -z-10"></div>

  <div class="w-full flex items-center justify-end z-10 pt-1">
    <button type="button" data-action="toggle-theme" class="text-xs font-medium text-neutral-400 hover:text-neutral-700 px-2.5 py-1 rounded-full bg-black/[0.03] hover:bg-black/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer">
      <span>🌙</span>
      <span>Dark</span>
    </button>
  </div>

  <div class="flex flex-col items-center text-center my-auto w-full z-10 py-4">
    <div class="relative mb-5 group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
      <div class="absolute -inset-3 bg-[#C4243A]/15 rounded-[34px] blur-xl"></div>
      <div class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-gradient-to-b from-[#C4243A] via-[#B81F35] to-[#8E1B29] p-1 shadow-2xl flex items-center justify-center border border-white/80">
        <img alt="Kya Pehnu? Emblem" class="w-full h-full object-cover rounded-[24px]" src="${LOGO_DATA_URI}" />
      </div>
    </div>

    <h1 class="font-display-hero-mobile text-display-hero-mobile text-text-obsidian tracking-tight mb-2 font-normal text-4xl" style="font-family: 'EB Garamond', Georgia, serif;">
      Kya Pehnu?
    </h1>

    <p class="text-sm sm:text-base font-semibold text-neutral-800 tracking-tight mt-1.5">
      Fashion Delivered in 45 Minutes.
    </p>
    <p class="text-xs sm:text-[13px] text-neutral-500 max-w-[290px] leading-relaxed mt-1">
      Trending streetwear, party wear &amp; everyday fits from Nagpur's finest boutiques.
    </p>

    <div class="w-full max-w-xs mt-6 space-y-3 text-left">
      <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 border border-black/[0.04] shadow-xs">
        <div class="w-8 h-8 rounded-lg bg-rose-50 text-[#C4243A] flex items-center justify-center flex-shrink-0 text-sm font-bold">
          ⚡
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-neutral-900">45-Minute Delivery</div>
          <div class="text-[11px] text-neutral-500 truncate">Hyperlocal courier from local boutiques</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 border border-black/[0.04] shadow-xs">
        <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
          👗
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-neutral-900">Free Doorstep Trial</div>
          <div class="text-[11px] text-neutral-500 truncate">Try before you buy, keep what fits</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/80 border border-black/[0.04] shadow-xs">
        <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
          💳
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-neutral-900">Pay on Delivery</div>
          <div class="text-[11px] text-neutral-500 truncate">Cash or UPI with zero return hassle</div>
        </div>
      </div>
    </div>
  </div>

  <div class="w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center gap-2.5 z-10 pt-2 pb-2">
    <button
      type="button"
      aria-label="Explore Looks · Explore Storefront as Guest"
      class="w-full h-12 py-3 px-6 rounded-2xl bg-[#C4243A] hover:bg-[#B01E33] active:scale-[0.98] text-white font-semibold text-sm tracking-wide shadow-lg shadow-rose-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>Explore Looks</span>
      <span class="text-base font-bold">→</span>
    </button>

    <button
      type="button"
      aria-label="Log In to Your Account"
      class="w-full h-12 py-3 px-6 rounded-2xl bg-white hover:bg-neutral-50 border border-neutral-200/80 active:scale-[0.98] text-neutral-800 font-medium text-sm tracking-wide shadow-xs transition-all flex items-center justify-center cursor-pointer"
    >
      <span>Log In to Your Account</span>
    </button>

    <div class="text-[11px] text-neutral-400 font-normal tracking-wide text-center pt-1">
      Free doorstep trial · Pay with cash or UPI
    </div>
  </div>
</main>`;

const DARK_HTML = `<main class="flex-1 flex flex-col justify-between w-full max-w-md mx-auto min-h-screen px-6 py-8 sm:py-12 select-none bg-[#0E0E10] text-neutral-100 relative overflow-hidden font-sans">
  <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-88 h-88 rounded-full bg-[#C4243A]/12 blur-[100px] pointer-events-none -z-10"></div>
  <div class="absolute bottom-1/4 right-0 w-72 h-72 rounded-full bg-[#C8A24A]/8 blur-[100px] pointer-events-none -z-10"></div>

  <div class="w-full flex items-center justify-end z-10 pt-1">
    <button type="button" data-action="toggle-theme" class="text-xs font-medium text-neutral-400 hover:text-neutral-200 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer">
      <span>☀️</span>
      <span>Light</span>
    </button>
  </div>

  <div class="flex flex-col items-center text-center my-auto w-full z-10 py-4">
    <div class="relative mb-5 group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
      <div class="absolute -inset-3 bg-[#C4243A]/25 rounded-[34px] blur-xl"></div>
      <div class="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-gradient-to-b from-[#C4243A] via-[#920021] to-[#4A000F] p-1 shadow-2xl flex items-center justify-center border border-white/10">
        <img alt="Kya Pehnu? Emblem" class="w-full h-full object-cover rounded-[24px]" src="${LOGO_DATA_URI}" />
      </div>
    </div>

    <h1 class="font-display-hero-mobile text-display-hero-mobile text-[#F5F3EF] tracking-tight mb-2 font-normal text-4xl" style="font-family: 'EB Garamond', Georgia, serif;">
      Kya Pehnu?
    </h1>

    <p class="text-sm sm:text-base font-semibold text-neutral-200 tracking-tight mt-1.5">
      Fashion Delivered in 45 Minutes.
    </p>
    <p class="text-xs sm:text-[13px] text-neutral-400 max-w-[290px] leading-relaxed mt-1">
      Trending streetwear, party wear &amp; everyday fits from Nagpur's finest boutiques.
    </p>

    <div class="w-full max-w-xs mt-6 space-y-3 text-left">
      <div class="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900/80 border border-white/10 shadow-xs">
        <div class="w-8 h-8 rounded-lg bg-rose-950/60 text-rose-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
          ⚡
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-neutral-100">45-Minute Delivery</div>
          <div class="text-[11px] text-neutral-400 truncate">Hyperlocal courier from local boutiques</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900/80 border border-white/10 shadow-xs">
        <div class="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
          👗
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-neutral-100">Free Doorstep Trial</div>
          <div class="text-[11px] text-neutral-400 truncate">Try before you buy, keep what fits</div>
        </div>
      </div>

      <div class="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900/80 border border-white/10 shadow-xs">
        <div class="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
          💳
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-neutral-100">Pay on Delivery</div>
          <div class="text-[11px] text-neutral-400 truncate">Cash or UPI with zero return hassle</div>
        </div>
      </div>
    </div>
  </div>

  <div class="w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center gap-2.5 z-10 pt-2 pb-2">
    <button
      type="button"
      aria-label="Explore Looks · Explore Storefront as Guest"
      class="w-full h-12 py-3 px-6 rounded-2xl bg-[#C4243A] hover:bg-[#B01E33] active:scale-[0.98] text-white font-semibold text-sm tracking-wide shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <span>Explore Looks</span>
      <span class="text-base font-bold">→</span>
    </button>

    <button
      type="button"
      aria-label="Log In to Your Account"
      class="w-full h-12 py-3 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 active:scale-[0.98] text-neutral-100 font-medium text-sm tracking-wide shadow-xs transition-all flex items-center justify-center cursor-pointer"
    >
      <span>Log In to Your Account</span>
    </button>

    <div class="text-[11px] text-neutral-500 font-normal tracking-wide text-center pt-1">
      Free doorstep trial · Pay with cash or UPI
    </div>
  </div>
</main>`;

export default function StitchWelcome({ navigation }) {
  const isDark = useThemeStore((s) => s.isDark);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = (e) => {
      const themeBtn = e.target.closest('[data-action="toggle-theme"]');
      if (themeBtn) {
        e.preventDefault();
        useThemeStore.getState().toggleTheme();
        return;
      }

      const target = e.target.closest('button, a');
      if (!target) return;
      const text = (target.textContent || '').trim().toLowerCase();
      const aria = (target.getAttribute('aria-label') || '').toLowerCase();

      if (
        text.includes('explore looks') ||
        text.includes('explore storefront') ||
        text.includes('browse catalog') ||
        text.includes('get started') ||
        text.includes('start shopping') ||
        aria.includes('explore') ||
        aria.includes('browse')
      ) {
        e.preventDefault();
        navigation.navigate('Home');
      } else if (
        text.includes('log in') ||
        text.includes('sign in') ||
        text.includes('account') ||
        aria.includes('auth') ||
        aria.includes('log in')
      ) {
        e.preventDefault();
        navigation.navigate('Auth');
      }
    };

    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [navigation]);

  const activeHtml = isDark ? DARK_HTML : LIGHT_HTML;

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen flex flex-col"
      dangerouslySetInnerHTML={{ __html: activeHtml }}
    />
  );
}
