import React, { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { LOGO_DATA_URI } from '../constants/logoDataUri';

const LIGHT_HTML = `
<main id="welcomeScreen" data-screen="welcome" class="flex-1 flex flex-col w-full max-w-[430px] mx-auto min-h-screen bg-[#FAF9F5] text-neutral-900 select-none pb-28 relative">
  <!-- Top Navigation Header -->
  <header class="w-full flex items-center justify-between px-5 pt-4 pb-2 z-20">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-b from-[#C4243A] to-[#920021] p-0.5 shadow-md flex items-center justify-center">
        <img src="` + LOGO_DATA_URI + `" alt="Kya Pehnu? Logo" class="w-full h-full object-cover rounded-[10px]" />
      </div>
      <span class="text-xl font-bold tracking-tight text-neutral-900 font-serif">Kya Pehnu?</span>
    </div>

    <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xs border border-black/5 text-[#C4243A] text-xs font-bold">
      <span class="material-symbols-outlined text-[15px]">bolt</span>
      <span>45 Mins · Nagpur</span>
    </div>
  </header>

  <!-- Hero Headline -->
  <section class="px-5 pt-3 pb-2 text-left">
    <span class="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#C4243A] block mb-1">
      Nagpur's Fast Fashion App
    </span>
    <h1 class="text-[26px] font-extrabold text-neutral-950 tracking-tight leading-tight mb-1.5">
      Fashion Delivered to Your Door in 45 Minutes.
    </h1>
    <p class="text-xs text-neutral-500 leading-relaxed max-w-[340px]">
      Trending streetwear, party wear, casuals &amp; everyday fits from top local boutiques.
    </p>
  </section>

  <!-- Category Preview Grid (Blinkit 4-Card Quick Look) -->
  <section class="px-5 my-2">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-bold text-neutral-900 uppercase tracking-wider">Explore Collections</span>
      <span class="text-[11px] font-medium text-[#C4243A]">45-min doorstep delivery</span>
    </div>

    <div class="grid grid-cols-2 gap-2.5 w-full">
      <!-- Card 1: Streetwear -->
      <div data-category="Streetwear &amp; Casuals" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-black/5 bg-white group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-100">
          <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80" alt="Streetwear &amp; Cargos" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#C4243A] text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Trending</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-900">Streetwear &amp; Cargos</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Oversized tees &amp; denim</p>
        </div>
      </div>

      <!-- Card 2: Party Fits -->
      <div data-category="Women's Wear" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-black/5 bg-white group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-100">
          <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80" alt="Party &amp; Clubwear" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Hot Fits</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-900">Party &amp; Clubwear</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Dresses, co-ords &amp; chic fits</p>
        </div>
      </div>

      <!-- Card 3: Casuals -->
      <div data-category="Men's Fashion" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-black/5 bg-white group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-100">
          <img src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80" alt="Casuals &amp; Denim" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-sky-600 text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Daily Fits</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-900">Casuals &amp; Denim</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Shirts, polos &amp; daily basics</p>
        </div>
      </div>

      <!-- Card 4: Modern Ethnic -->
      <div data-category="Kurtas &amp; Sets" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-black/5 bg-white group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-100">
          <img src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80" alt="Kurtas &amp; Fusion Sets" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Festive</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-900">Kurtas &amp; Sets</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Modern ethnic &amp; fusion</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Blinkit 3-Pillar Service Highlights -->
  <section class="px-5 my-2">
    <div class="grid grid-cols-3 gap-2 w-full">
      <div class="p-2.5 rounded-2xl bg-white border border-black/5 flex flex-col items-center text-center shadow-xs">
        <div class="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-[#C4243A] mb-1">
          <span class="material-symbols-outlined text-[18px]">bolt</span>
        </div>
        <span class="text-[11px] font-bold text-neutral-900">45 Mins</span>
        <span class="text-[9px] text-neutral-400 mt-0.5">Nagpur dispatch</span>
      </div>

      <div class="p-2.5 rounded-2xl bg-white border border-black/5 flex flex-col items-center text-center shadow-xs">
        <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-1">
          <span class="material-symbols-outlined text-[18px]">checkroom</span>
        </div>
        <span class="text-[11px] font-bold text-neutral-900">Doorstep Trial</span>
        <span class="text-[9px] text-neutral-400 mt-0.5">Try before buy</span>
      </div>

      <div class="p-2.5 rounded-2xl bg-white border border-black/5 flex flex-col items-center text-center shadow-xs">
        <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-1">
          <span class="material-symbols-outlined text-[18px]">payments</span>
        </div>
        <span class="text-[11px] font-bold text-neutral-900">Pay on Delivery</span>
        <span class="text-[9px] text-neutral-400 mt-0.5">Zero-risk COD</span>
      </div>
    </div>
  </section>

  <!-- Sticky Bottom Action Sheet -->
  <div class="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#FAF9F5] via-[#FAF9F5]/95 to-transparent pt-4 pb-5 px-5">
    <div class="flex flex-col gap-2 max-w-[430px] mx-auto w-full">
      <button
        aria-label="Explore Storefront as Guest"
        class="w-full h-13 bg-gradient-to-r from-[#C4243A] via-[#B81F35] to-[#920021] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C4243A]/25 hover:shadow-xl hover:shadow-[#C4243A]/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Start Shopping</span>
        <span class="material-symbols-outlined text-[20px]">east</span>
      </button>

      <button
        class="w-full h-11 bg-white border border-neutral-200 text-neutral-900 font-semibold text-xs rounded-xl shadow-xs hover:bg-neutral-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>Log In with Mobile</span>
      </button>

      <div class="flex items-center justify-center gap-2 pt-0.5 text-[10px] text-neutral-400">
        <span>✓ 100% Genuine Nagpur Boutiques</span>
        <span>•</span>
        <span>✓ Free Doorstep Trial</span>
      </div>
    </div>
  </div>
</main>
`;

const DARK_HTML = `
<main id="welcomeScreen" data-screen="welcome" class="flex-1 flex flex-col w-full max-w-[430px] mx-auto min-h-screen bg-[#0E0E10] text-neutral-100 select-none pb-28 relative">
  <!-- Ambient background glow -->
  <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#C4243A]/15 blur-[120px] pointer-events-none"></div>

  <!-- Top Navigation Header -->
  <header class="w-full flex items-center justify-between px-5 pt-4 pb-2 z-20">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-b from-[#C4243A] to-[#680016] p-0.5 shadow-md flex items-center justify-center">
        <img src="` + LOGO_DATA_URI + `" alt="Kya Pehnu? Logo" class="w-full h-full object-cover rounded-[10px]" />
      </div>
      <span class="text-xl font-bold tracking-tight text-neutral-100 font-serif">Kya Pehnu?</span>
    </div>

    <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md shadow-xs border border-white/10 text-rose-400 text-xs font-bold">
      <span class="material-symbols-outlined text-[15px]">bolt</span>
      <span>45 Mins · Nagpur</span>
    </div>
  </header>

  <!-- Hero Headline -->
  <section class="px-5 pt-3 pb-2 text-left z-10">
    <span class="text-[10px] font-extrabold tracking-[0.2em] uppercase text-rose-400 block mb-1">
      Nagpur's Fast Fashion App
    </span>
    <h1 class="text-[26px] font-extrabold text-neutral-50 tracking-tight leading-tight mb-1.5">
      Fashion Delivered to Your Door in 45 Minutes.
    </h1>
    <p class="text-xs text-neutral-400 leading-relaxed max-w-[340px]">
      Trending streetwear, party wear, casuals &amp; everyday fits from top local boutiques.
    </p>
  </section>

  <!-- Category Preview Grid (Blinkit 4-Card Quick Look) -->
  <section class="px-5 my-2 z-10">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-bold text-neutral-200 uppercase tracking-wider">Explore Collections</span>
      <span class="text-[11px] font-medium text-rose-400">45-min doorstep delivery</span>
    </div>

    <div class="grid grid-cols-2 gap-2.5 w-full">
      <!-- Card 1: Streetwear -->
      <div data-category="Streetwear &amp; Casuals" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-white/10 bg-neutral-900 group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-800">
          <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80" alt="Streetwear &amp; Cargos" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#C4243A] text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Trending</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-100">Streetwear &amp; Cargos</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Oversized tees &amp; denim</p>
        </div>
      </div>

      <!-- Card 2: Party Fits -->
      <div data-category="Women's Wear" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-white/10 bg-neutral-900 group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-800">
          <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80" alt="Party &amp; Clubwear" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Hot Fits</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-100">Party &amp; Clubwear</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Dresses, co-ords &amp; chic fits</p>
        </div>
      </div>

      <!-- Card 3: Casuals -->
      <div data-category="Men's Fashion" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-white/10 bg-neutral-900 group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-800">
          <img src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80" alt="Casuals &amp; Denim" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-sky-600 text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Daily Fits</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-100">Casuals &amp; Denim</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Shirts, polos &amp; daily basics</p>
        </div>
      </div>

      <!-- Card 4: Modern Ethnic -->
      <div data-category="Kurtas &amp; Sets" class="category-card relative rounded-2xl overflow-hidden shadow-xs border border-white/10 bg-neutral-900 group cursor-pointer active:scale-98 transition-all">
        <div class="h-28 w-full overflow-hidden relative bg-neutral-800">
          <img src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80" alt="Kurtas &amp; Fusion Sets" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold tracking-wide uppercase shadow-xs">Festive</span>
        </div>
        <div class="p-2.5 text-left">
          <h3 class="text-xs font-bold text-neutral-100">Kurtas &amp; Sets</h3>
          <p class="text-[10px] text-neutral-400 mt-0.5">Modern ethnic &amp; fusion</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Blinkit 3-Pillar Service Highlights -->
  <section class="px-5 my-2 z-10">
    <div class="grid grid-cols-3 gap-2 w-full">
      <div class="p-2.5 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col items-center text-center shadow-xs">
        <div class="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-1">
          <span class="material-symbols-outlined text-[18px]">bolt</span>
        </div>
        <span class="text-[11px] font-bold text-neutral-100">45 Mins</span>
        <span class="text-[9px] text-neutral-400 mt-0.5">Nagpur dispatch</span>
      </div>

      <div class="p-2.5 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col items-center text-center shadow-xs">
        <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-1">
          <span class="material-symbols-outlined text-[18px]">checkroom</span>
        </div>
        <span class="text-[11px] font-bold text-neutral-100">Doorstep Trial</span>
        <span class="text-[9px] text-neutral-400 mt-0.5">Try before buy</span>
      </div>

      <div class="p-2.5 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col items-center text-center shadow-xs">
        <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1">
          <span class="material-symbols-outlined text-[18px]">payments</span>
        </div>
        <span class="text-[11px] font-bold text-neutral-100">Pay on Delivery</span>
        <span class="text-[9px] text-neutral-400 mt-0.5">Zero-risk COD</span>
      </div>
    </div>
  </section>

  <!-- Sticky Bottom Action Sheet -->
  <div class="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#0E0E10] via-[#0E0E10]/95 to-transparent pt-4 pb-5 px-5">
    <div class="flex flex-col gap-2 max-w-[430px] mx-auto w-full">
      <button
        aria-label="Explore Storefront as Guest"
        class="w-full h-13 bg-gradient-to-r from-[#C4243A] via-[#B81F35] to-[#920021] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#C4243A]/25 hover:shadow-xl hover:shadow-[#C4243A]/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Start Shopping</span>
        <span class="material-symbols-outlined text-[20px]">east</span>
      </button>

      <button
        class="w-full h-11 bg-neutral-800 border border-neutral-700 text-neutral-100 font-semibold text-xs rounded-xl shadow-xs hover:bg-neutral-750 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>Log In with Mobile</span>
      </button>

      <div class="flex items-center justify-center gap-2 pt-0.5 text-[10px] text-neutral-400">
        <span>✓ 100% Genuine Nagpur Boutiques</span>
        <span>•</span>
        <span>✓ Free Doorstep Trial</span>
      </div>
    </div>
  </div>
</main>
`;

export default function StitchWelcome({ navigation }) {
  const isDark = useThemeStore((s) => s.isDark);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = (e) => {
      const card = e.target.closest('[data-category]');
      if (card) {
        e.preventDefault();
        const category = card.getAttribute('data-category');
        navigation.navigate('Home', { selectedCategory: category });
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
        text.includes('start shopping') ||
        text.includes('explore fits') ||
        aria.includes('explore') ||
        aria.includes('browse')
      ) {
        e.preventDefault();
        navigation.navigate('Home');
      } else if (
        text.includes('log in') ||
        text.includes('sign in') ||
        text.includes('account') ||
        text.includes('mobile') ||
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

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-start overflow-y-auto">
      <div
        ref={containerRef}
        className="w-full flex-1 flex flex-col"
        dangerouslySetInnerHTML={{ __html: isDark ? DARK_HTML : LIGHT_HTML }}
      />
    </div>
  );
}

