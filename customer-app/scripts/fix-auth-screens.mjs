import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensPath = path.resolve(__dirname, '../src/data/stitchScreens.json');
const rawScreens = JSON.parse(fs.readFileSync(screensPath, 'utf8'));

console.log('Loaded stitchScreens.json with', Object.keys(rawScreens).length, 'screens');

// 1. LIGHT AUTH SCREEN
const lightAuthHtml = `<main class="flex-1 flex flex-col w-full bg-ground-base pt-safe pb-safe px-gutter-md"><div class="flex flex-col w-full pb-8 select-none">

<header class="flex items-center justify-between py-3 mb-2">
<button aria-label="Go back" class="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-low shadow-sm text-text-obsidian active:scale-95 transition-transform duration-150" type="button">
<span class="material-symbols-outlined text-[20px]">arrow_back</span>
</button>
<div class="flex items-center gap-2">
<img alt="Kya Pehnu Royal Crest" class="w-8 h-8 rounded-lg shadow-sm object-cover" src="/app/apple-touch-icon.png">
<span class="font-title-md text-title-md text-primary tracking-tight">Kya Pehnu?</span>
</div>
<div class="w-10 h-10 flex items-center justify-center">
<span class="material-symbols-outlined text-text-ash text-[22px]">help_outline</span>
</div>
</header>

<section class="flex flex-col mb-6 pt-2">
<div class="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-surface-container mb-2.5">
<span class="w-1.5 h-1.5 rounded-full bg-accent-crimson animate-pulse"></span>
<span class="font-eyebrow text-eyebrow text-accent-gold uppercase tracking-widest">Nagpur Fashion Pass</span>
</div>
<h1 class="font-display-hero-mobile text-display-hero-mobile text-text-obsidian leading-tight tracking-tight mb-2">
      Welcome to <span class="text-primary italic font-title-lg">Kya Pehnu?</span>
</h1>
<p class="font-body-md text-body-md text-text-slate max-w-sm">
      Enter your mobile number to access express deliveries, trending streetwear, and curated everyday fits.
    </p>
</section>


<div class="bg-surface-porcelain rounded-xl shadow-md p-5 flex flex-col gap-4">

  <!-- Mode Split Tabs: Sign In vs Register -->
  <div class="flex items-center p-1 rounded-xl bg-ground-subtle border border-surface-container-high" id="auth-tab-bar" role="tablist">
    <button id="tab-signin" type="button" role="tab" aria-selected="true" class="flex-1 py-2.5 rounded-lg text-tabular-caption font-bold text-center transition-all bg-surface-porcelain text-text-obsidian shadow-sm flex items-center justify-center gap-1.5">
      <span class="material-symbols-outlined text-[16px] text-accent-crimson">login</span>
      <span>Sign In</span>
    </button>
    <button id="tab-register" type="button" role="tab" aria-selected="false" class="flex-1 py-2.5 rounded-lg text-tabular-caption font-semibold text-center transition-all text-text-slate hover:text-text-obsidian flex items-center justify-center gap-1.5">
      <span class="material-symbols-outlined text-[16px]">person_add</span>
      <span>Register</span>
    </button>
  </div>

  <!-- Sign In Panel -->
  <div class="flex flex-col gap-3.5" id="panel-signin">
    <div class="flex flex-col gap-1.5">
      <label class="font-tabular-caption text-tabular-caption text-text-slate flex items-center justify-between">
        <span>Mobile Number or Email</span>
        <span class="text-accent-gold-deep font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">verified</span> Instant OTP</span>
      </label>
      <div class="relative flex items-center">
        <input id="signin-identifier" class="w-full h-12 px-3.5 rounded-lg bg-ground-subtle text-text-obsidian font-body-md text-body-md placeholder:text-text-ash focus:bg-surface-porcelain focus:shadow-md outline-none transition-all duration-150" placeholder="e.g. 98230 45892 or name@email.com" type="text" value="">
        <span class="absolute right-3.5 material-symbols-outlined text-text-ash text-[18px]">person</span>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <label class="font-tabular-caption text-tabular-caption text-text-slate">Password / PIN</label>
        <button type="button" class="text-accent-crimson font-tabular-caption text-[11px] font-semibold hover:underline" id="btn-forgot-password">Forgot Password?</button>
      </div>
      <div class="relative flex items-center">
        <input id="signin-password" class="w-full h-12 px-3.5 rounded-lg bg-ground-subtle text-text-obsidian font-body-md text-body-md placeholder:text-text-ash focus:bg-surface-porcelain focus:shadow-md outline-none transition-all duration-150" placeholder="Enter your password" type="password" value="">
        <button id="toggle-signin-password" class="absolute right-3.5 text-text-ash hover:text-text-obsidian flex items-center" type="button">
          <span class="material-symbols-outlined text-[18px]">visibility</span>
        </button>
      </div>
    </div>

    <!-- Keep me signed in placed cleanly under password -->
    <label class="flex items-center gap-2.5 cursor-pointer py-1 select-none">
      <input checked="" class="w-4 h-4 rounded accent-accent-crimson cursor-pointer" id="remember-me" type="checkbox">
      <span class="font-body-sm text-body-sm text-text-slate">
        Keep me signed in for 45-minute instant checkout
      </span>
    </label>

    <button class="w-full h-13 py-3.5 rounded-full bg-accent-crimson hover:bg-accent-crimson-deep text-on-primary font-tabular-price text-tabular-price shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 mt-1" id="btn-submit-signin" type="button">
      <span>Sign In to Kya Pehnu</span>
      <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
    </button>

    <div class="text-center pt-1">
      <span class="font-body-sm text-text-slate">New customer? </span>
      <button type="button" id="link-switch-to-register" class="font-body-sm font-bold text-accent-crimson hover:underline">Create an Account</button>
    </div>
  </div>

  <!-- Register Panel (Hidden by default in Sign In mode) -->
  <div class="flex flex-col gap-3.5 hidden" id="panel-register">
    <div class="flex flex-col gap-1.5">
      <label class="font-tabular-caption text-tabular-caption text-text-slate">Full Name</label>
      <div class="relative flex items-center">
        <input id="reg-name" class="w-full h-12 px-3.5 rounded-lg bg-ground-subtle text-text-obsidian font-body-md text-body-md placeholder:text-text-ash focus:bg-surface-porcelain focus:shadow-md outline-none transition-all duration-150" placeholder="e.g. Radhika Deshmukh" type="text" value="">
        <span class="absolute right-3.5 material-symbols-outlined text-text-ash text-[18px]">badge</span>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-tabular-caption text-tabular-caption text-text-slate flex items-center justify-between">
        <span>Mobile Number</span>
        <span class="text-accent-gold-deep font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">verified</span> Instant OTP</span>
      </label>
      <div class="flex items-center gap-2">
        <div class="flex items-center justify-center gap-1 h-12 px-3 rounded-lg bg-ground-subtle text-text-obsidian shadow-inner">
          <span class="text-[14px]"><svg class="w-4 h-3 rounded-[2px] shadow-xs inline-block" viewBox="0 0 24 16"><rect width="24" height="5.33" fill="#FF9933"/><rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/><rect y="10.66" width="24" height="5.33" fill="#138808"/><circle cx="12" cy="8" r="1.8" fill="#000080"/></svg></span>
          <span class="font-tabular-price text-tabular-price">+91</span>
        </div>
        <div class="relative flex-1 flex items-center">
          <input id="reg-phone" class="w-full h-12 px-3.5 rounded-lg bg-ground-subtle text-text-obsidian font-tabular-price text-tabular-price placeholder:text-text-ash focus:bg-surface-porcelain focus:shadow-md outline-none transition-all duration-150" inputmode="numeric" placeholder="98230 45892" type="tel" value="">
          <span class="absolute right-3.5 material-symbols-outlined text-accent-gold text-[18px]">verified_user</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-tabular-caption text-tabular-caption text-text-slate">Email Address</label>
      <div class="relative flex items-center">
        <input id="reg-email" class="w-full h-12 px-3.5 rounded-lg bg-ground-subtle text-text-obsidian font-body-md text-body-md placeholder:text-text-ash focus:bg-surface-porcelain focus:shadow-md outline-none transition-all duration-150" placeholder="name@example.com" type="email" value="">
        <span class="absolute right-3.5 material-symbols-outlined text-text-ash text-[18px]">mail</span>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="font-tabular-caption text-tabular-caption text-text-slate">Create Password</label>
      <div class="relative flex items-center">
        <input id="reg-password" class="w-full h-12 px-3.5 rounded-lg bg-ground-subtle text-text-obsidian font-body-md text-body-md placeholder:text-text-ash focus:bg-surface-porcelain focus:shadow-md outline-none transition-all duration-150" placeholder="Minimum 6 characters" type="password" value="">
        <button id="toggle-reg-password" class="absolute right-3.5 text-text-ash hover:text-text-obsidian flex items-center" type="button">
          <span class="material-symbols-outlined text-[18px]">visibility</span>
        </button>
      </div>
    </div>

    <button class="w-full h-13 py-3.5 rounded-full bg-accent-crimson hover:bg-accent-crimson-deep text-on-primary font-tabular-price text-tabular-price shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 mt-1" id="btn-submit-register" type="button">
      <span>Create Store Account</span>
      <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
    </button>

    <div class="text-center pt-1">
      <span class="font-body-sm text-text-slate">Already have an account? </span>
      <button type="button" id="link-switch-to-signin" class="font-body-sm font-bold text-accent-crimson hover:underline">Sign In here</button>
    </div>
  </div>

  <!-- Social Divider with clean relative margins -->
  <div class="relative flex py-2 items-center my-1">
    <div class="flex-grow border-t border-surface-container-high"></div>
    <span class="flex-shrink mx-3 font-eyebrow text-eyebrow text-text-ash uppercase tracking-wider">or continue with</span>
    <div class="flex-grow border-t border-surface-container-high"></div>
  </div>

  <div class="flex flex-col w-full">
    <button class="w-full h-11 px-3 rounded-lg bg-ground-subtle hover:bg-surface-container-high text-text-obsidian font-tabular-caption text-tabular-caption font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform duration-150 cursor-pointer" type="button">
      <svg class="w-4 h-4" viewBox="0 0 24 24"><path d="M12 5c1.54 0 2.92.56 4.01 1.48l3.01-3.01C17.2 1.8 14.78 1 12 1 7.4 1 3.52 3.61 1.63 7.41l3.66 2.84C6.18 7.37 8.84 5 12 5z" fill="#EA4335"></path><path d="M23.49 12.28c0-.82-.07-1.6-.2-2.28H12v4.51h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.66 2.84c2.14-1.97 3.74-4.88 3.74-8.65z" fill="#4285F4"></path><path d="M5.29 14.75c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.63 7.41C.59 9.5.01 11.69.01 12c0 2.31.59 4.5 1.62 6.59l3.66-2.84z" fill="#FBBC05"></path><path d="M12 23c3.24 0 5.95-1.07 7.93-2.91l-3.66-2.84c-1.07.72-2.45 1.16-4.27 1.16-3.16 0-5.82-2.37-6.71-5.25L1.63 16.59C3.52 20.39 7.4 23 12 23z" fill="#34A853"></path></svg>
      <span>Continue with Google</span>
    </button>
  </div>

  <div class="flex items-center justify-center gap-1.5 pt-1 text-text-slate text-xs">
    <span class="material-symbols-outlined text-accent-crimson text-[16px]">electric_bolt</span>
    <span>45-min express delivery across Nagpur</span>
  </div>

</div>

<div class="mt-5 rounded-2xl bg-surface-container-high/90 border border-black/[0.06] p-3.5 flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:border-accent-gold/40 transition-all" data-purpose="vendor-callout" data-action="register-vendor" id="registerBoutiqueBtn">
<div class="flex items-center gap-3 min-w-0">
<div class="w-11 h-11 rounded-xl bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center shrink-0 text-accent-gold-deep">
<span class="material-symbols-outlined text-[22px]">storefront</span>
</div>
<div class="truncate">
<h4 class="text-xs sm:text-sm font-bold text-text-obsidian truncate tracking-tight">Want to Sell on Kya Pehnu?</h4>
<p class="text-[11px] text-text-slate truncate mt-0.5">Own a boutique, brand or store in Nagpur? Join our express network</p>
</div>
</div>
<button data-action="register-vendor" class="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-surface-porcelain border border-black/10 text-accent-gold-deep shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer" type="button">
<span>Register &rarr;</span>
</button>
</div>

<footer class="mt-6 flex flex-col items-center justify-center gap-1.5 text-center">
<div class="flex items-center gap-1 text-text-ash">
<span class="material-symbols-outlined text-[14px] text-accent-gold">lock</span>
<span class="font-tabular-caption text-tabular-caption">Protected by 256-bit encryption</span>
</div>
<span class="font-eyebrow text-eyebrow text-text-ash uppercase">Nagpur Same-City Express Network</span>
</footer>
</div>
</main>`;

// 2. DARK AUTH SCREEN
const darkAuthHtml = `<div class="w-full max-w-md min-h-screen flex flex-col justify-between px-5 pt-4 pb-8 relative shadow-2xl">

<div class="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 bg-crimson/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

<header class="flex items-center justify-between py-2" data-purpose="top-navigation">

<button aria-label="Go back" class="w-10 h-10 rounded-full bg-noir-card/80 border border-white/10 flex items-center justify-center text-stone-300 hover:text-white hover:bg-noir-elevated active:scale-95 transition-all" type="button">
<span class="material-symbols-outlined text-[20px]">arrow_back</span>
</button>

<div class="flex items-center gap-2" data-purpose="brand-logo">
<div class="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-noir-elevated border border-gold/30 p-0.5 shadow-sm">
<img alt="Kya Pehnu Logo" class="w-full h-full object-contain rounded-md" src="/app/apple-touch-icon.png"/>
</div>
<span class="font-garamond text-2xl font-bold tracking-normal text-white">Kya Pehnu?</span>
</div>

<button aria-label="Help and Support" class="w-10 h-10 rounded-full bg-noir-card/80 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:bg-noir-elevated active:scale-95 transition-all" type="button">
<span class="material-symbols-outlined text-[20px]">help</span>
</button>
</header>


<main class="mt-6 flex-1 flex flex-col gap-5">

<div class="flex items-center">
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-noir-card border border-gold/30 text-gold-light shadow-inner">
<span class="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse"></span>
          Nagpur Fashion Pass
        </span>
</div>

<section class="space-y-2" data-purpose="hero-header">
<h1 class="font-garamond text-[34px] leading-[1.15] font-normal tracking-tight text-stone-100">
          Welcome to <span class="italic font-medium text-crimson">Kya Pehnu?</span>
</h1>
<p class="text-stone-400 text-[13.5px] leading-relaxed pr-1 font-normal">
          Enter your mobile number to access express deliveries, trending streetwear, and curated everyday fits.
        </p>
</section>


<section class="bg-noir-surface/90 border border-noir-border rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4" data-purpose="auth-container">

  <!-- Mode Split Tabs: Sign In vs Register -->
  <div class="p-1 bg-noir-base/80 border border-white/5 rounded-xl flex items-center text-xs font-medium" id="dark-auth-tab-bar" role="tablist">
    <button id="dark-tab-signin" class="flex-1 py-2.5 px-3 rounded-lg bg-noir-elevated border border-white/10 text-white flex items-center justify-center gap-2 shadow font-semibold transition-all" type="button" role="tab" aria-selected="true">
      <span class="material-symbols-outlined text-base text-crimson">login</span>
      <span>Sign In</span>
    </button>
    <button id="dark-tab-register" class="flex-1 py-2.5 px-3 rounded-lg text-stone-400 hover:text-stone-200 flex items-center justify-center gap-2 transition-colors" type="button" role="tab" aria-selected="false">
      <span class="material-symbols-outlined text-base">person_add</span>
      <span>Register</span>
    </button>
  </div>

  <!-- Sign In Panel -->
  <div class="space-y-3" id="dark-panel-signin">
    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-stone-300">Mobile Number or Email</span>
        <span class="flex items-center gap-1 text-gold font-medium">
          <span class="material-symbols-outlined text-[14px]">verified</span>
          Verified
        </span>
      </div>
      <div class="relative">
        <input id="dark-signin-identifier" class="w-full h-12 bg-noir-base border border-white/10 rounded-xl px-4 text-sm font-semibold tracking-wide text-stone-100 focus:ring-1 focus:ring-crimson focus:border-crimson focus:outline-none transition-all" placeholder="e.g. 98230 45892 or name@email.com" type="text" value=""/>
        <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-stone-400">
          <span class="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </div>

    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-stone-300">Password / PIN</span>
        <button type="button" id="dark-btn-forgot-password" class="text-crimson text-[11px] font-medium hover:underline">Forgot Password?</button>
      </div>
      <div class="relative">
        <input id="dark-signin-password" class="w-full h-12 bg-noir-base border border-white/10 rounded-xl px-4 text-sm font-semibold tracking-wide text-stone-100 focus:ring-1 focus:ring-crimson focus:border-crimson focus:outline-none transition-all" placeholder="Enter your password" type="password" value=""/>
        <button id="dark-toggle-signin-password" type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-stone-400 hover:text-stone-200">
          <span class="material-symbols-outlined text-[18px]">visibility</span>
        </button>
      </div>
    </div>

    <!-- Keep me signed in inside panel, directly under password -->
    <label class="flex items-center gap-2.5 cursor-pointer select-none pt-1">
      <input checked="" class="w-4 h-4 rounded text-crimson bg-noir-base border-white/20 focus:ring-crimson focus:ring-offset-noir-surface rounded-sm" type="checkbox"/>
      <span class="text-xs text-stone-300">Keep me signed in for 45–minute instant checkout</span>
    </label>

    <button id="dark-btn-submit-signin" class="w-full h-12 bg-crimson hover:bg-crimson-hover text-white font-semibold rounded-xl text-[14px] tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-crimson/25 active:scale-[0.99] transition-all mt-1" type="button">
      <span>Sign In to Kya Pehnu</span>
      <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
    </button>

    <div class="text-center pt-1">
      <span class="text-xs text-stone-400">New customer? </span>
      <button type="button" id="dark-link-switch-to-register" class="text-xs font-semibold text-crimson hover:underline">Create an Account</button>
    </div>
  </div>

  <!-- Register Panel (Hidden by default in Sign In mode) -->
  <div class="space-y-3 hidden" id="dark-panel-register">
    <div class="space-y-1.5">
      <span class="font-semibold text-stone-300 text-xs">Full Name</span>
      <div class="relative">
        <input id="dark-reg-name" class="w-full h-12 bg-noir-base border border-white/10 rounded-xl px-4 text-sm font-semibold tracking-wide text-stone-100 focus:ring-1 focus:ring-crimson focus:border-crimson focus:outline-none transition-all" placeholder="e.g. Radhika Deshmukh" type="text" value=""/>
        <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-stone-400">
          <span class="material-symbols-outlined text-[18px]">badge</span>
        </div>
      </div>
    </div>

    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-stone-300">Mobile Number</span>
        <span class="flex items-center gap-1 text-gold font-medium"><span class="material-symbols-outlined text-[14px]">verified</span> Instant OTP</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="h-12 px-3 bg-noir-base border border-white/10 rounded-xl flex items-center gap-1.5 text-stone-200 text-sm font-medium" type="button">
          <span class="text-base leading-none"><svg class="w-4 h-3 rounded-[2px] shadow-xs inline-block" viewBox="0 0 24 16"><rect width="24" height="5.33" fill="#FF9933"/><rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/><rect y="10.66" width="24" height="5.33" fill="#138808"/><circle cx="12" cy="8" r="1.8" fill="#000080"/></svg></span>
          <span class="font-semibold">+91</span>
        </button>
        <div class="relative flex-1">
          <input id="dark-reg-phone" class="w-full h-12 bg-noir-base border border-white/10 rounded-xl px-4 text-sm font-semibold tracking-wide text-stone-100 focus:ring-1 focus:ring-crimson focus:border-crimson focus:outline-none transition-all" inputmode="numeric" placeholder="98230 45892" type="tel" value=""/>
          <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-emerald-500">
            <span class="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-1.5">
      <span class="font-semibold text-stone-300 text-xs">Email Address</span>
      <div class="relative">
        <input id="dark-reg-email" class="w-full h-12 bg-noir-base border border-white/10 rounded-xl px-4 text-sm font-semibold tracking-wide text-stone-100 focus:ring-1 focus:ring-crimson focus:border-crimson focus:outline-none transition-all" placeholder="name@example.com" type="email" value=""/>
        <div class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-stone-400">
          <span class="material-symbols-outlined text-[18px]">mail</span>
        </div>
      </div>
    </div>

    <div class="space-y-1.5">
      <span class="font-semibold text-stone-300 text-xs">Create Password</span>
      <div class="relative">
        <input id="dark-reg-password" class="w-full h-12 bg-noir-base border border-white/10 rounded-xl px-4 text-sm font-semibold tracking-wide text-stone-100 focus:ring-1 focus:ring-crimson focus:border-crimson focus:outline-none transition-all" placeholder="Minimum 6 characters" type="password" value=""/>
        <button id="dark-toggle-reg-password" type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-stone-400 hover:text-stone-200">
          <span class="material-symbols-outlined text-[18px]">visibility</span>
        </button>
      </div>
    </div>

    <button id="dark-btn-submit-register" class="w-full h-12 bg-crimson hover:bg-crimson-hover text-white font-semibold rounded-xl text-[14px] tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-crimson/25 active:scale-[0.99] transition-all mt-1" type="button">
      <span>Create Store Account</span>
      <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
    </button>

    <div class="text-center pt-1">
      <span class="text-xs text-stone-400">Already have an account? </span>
      <button type="button" id="dark-link-switch-to-signin" class="text-xs font-semibold text-crimson hover:underline">Sign In here</button>
    </div>
  </div>

  <div class="relative flex py-2 items-center my-1">
    <div class="flex-grow border-t border-white/10"></div>
    <span class="flex-shrink mx-3 text-[10.5px] uppercase tracking-wider text-stone-500 font-semibold">Or Continue With</span>
    <div class="flex-grow border-t border-white/10"></div>
  </div>

  <div class="flex flex-col w-full" data-purpose="social-auth-buttons">
    <button class="w-full h-11 rounded-xl bg-noir-base border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 text-xs font-semibold text-stone-200 transition-colors cursor-pointer" type="button">
      <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path d="M12 5c1.56 0 2.97.58 4.07 1.54l3.05-3.05C17.26 1.77 14.8 1 12 1 7.37 1 3.47 3.65 1.62 7.51l3.65 2.83C6.15 7.42 8.84 5 12 5z" fill="#EA4335"></path>
        <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.87c2.16-2 3.71-4.94 3.71-8.69z" fill="#4285F4"></path>
        <path d="M5.27 14.66C5.03 13.95 4.9 13.19 4.9 12.4c0-.79.13-1.55.37-2.26L1.62 7.31C.59 9.38 0 11.72 0 12.4s.59 3.02 1.62 5.09l3.65-2.83z" fill="#FBBC05"></path>
        <path d="M12 23.8c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.87c-1.07.72-2.45 1.16-4.22 1.16-3.16 0-5.85-2.42-6.73-5.34L1.62 16.67C3.47 20.53 7.37 23.8 12 23.8z" fill="#34A853"></path>
      </svg>
      <span>Continue with Google</span>
    </button>
  </div>

  <div class="flex items-center justify-center gap-1.5 pt-1 text-stone-400 text-xs">
    <span class="material-symbols-outlined text-crimson text-[16px]">electric_bolt</span>
    <span>45–min express delivery across Nagpur</span>
  </div>

</section>


<section class="mt-5 rounded-2xl bg-noir-surface/80 border border-noir-border p-3.5 flex items-center justify-between gap-3 shadow-sm cursor-pointer hover:border-gold/30 transition-all" data-purpose="vendor-callout" data-action="register-vendor" id="registerBoutiqueBtn">
<div class="flex items-center gap-3 min-w-0">
<div class="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 text-gold">
<span class="material-symbols-outlined text-[22px]">storefront</span>
</div>
<div class="truncate">
<h4 class="text-xs sm:text-sm font-bold text-stone-100 truncate tracking-tight">Want to Sell on Kya Pehnu?</h4>
<p class="text-[11px] text-stone-400 truncate mt-0.5">Own a boutique, brand or store in Nagpur? Join our express network</p>
</div>
</div>
<button data-action="register-vendor" class="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-noir-card border border-gold/40 text-gold-light hover:bg-gold hover:text-stone-950 shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer" type="button">
<span>Register &rarr;</span>
</button>
</section>

</main>


<footer class="mt-6 pt-2 pb-1 text-center space-y-1.5" data-purpose="security-footer">
<div class="inline-flex items-center justify-center gap-1.5 text-xs text-stone-400">
<span class="material-symbols-outlined text-[15px] text-gold">lock</span>
<span>Protected by 256-bit encryption</span>
</div>
<p class="text-[10px] font-semibold tracking-[0.16em] uppercase text-stone-500">
        Nagpur Same-City Express Network
      </p>
</footer>

</div>`;

rawScreens['final_light_theme_Sign_In___Auth'].html = lightAuthHtml;
rawScreens['final_theme_dark_Sign_In___Auth'].html = darkAuthHtml;

fs.writeFileSync(screensPath, JSON.stringify(rawScreens, null, 2), 'utf8');
console.log('Successfully updated final_light_theme_Sign_In___Auth & final_theme_dark_Sign_In___Auth in stitchScreens.json');
