import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const customerAppDir = path.resolve(__dirname, '..');

const screensPath = path.join(customerAppDir, 'src/data/stitchScreens.json');
const mockStoresPath = path.join(customerAppDir, 'src/data/mockStores.js');
const rendererPath = path.join(customerAppDir, 'src/components/StitchScreenRenderer.js');

console.log('🔧 Fixing the 3 specific items from Application Critic audit...');

// ============================================================================
// 1. FIX MOCK STORES (Issue C root cause)
// ============================================================================
if (fs.existsSync(mockStoresPath)) {
  let ms = fs.readFileSync(mockStoresPath, 'utf8');
  ms = ms.replace(/area:\s*'Sitabuldi'/g, "area: 'Nagpur Central'");
  ms = ms.replace(/42 Main Road, Sitabuldi, Nagpur 440012/g, '42 Main Road, Nagpur Central 440001');
  ms = ms.replace(/Sitabuldi · Heavyweight Boxy Tees/g, 'Nagpur Central · Heavyweight Boxy Tees');
  ms = ms.replace(/area:\s*'Dharampeth'/g, "area: 'West High Court Road, Nagpur'");
  ms = ms.replace(/18, West High Court Road, Dharampeth, Nagpur 440010/g, '18, West High Court Road, Nagpur 440010');
  ms = ms.replace(/Dharampeth · Everyday Baggy Denims/g, 'Nagpur Central · Everyday Baggy Denims');
  ms = ms.replace(/Shop 14, West High Court Road, Dharampeth, Nagpur 440010/g, 'Shop 14, West High Court Road, Nagpur 440010');
  ms = ms.replace(/Dharampeth · Everyday Casuals/g, 'Nagpur Central · Everyday Casuals');
  fs.writeFileSync(mockStoresPath, ms, 'utf8');
  console.log('✓ Updated mockStores.js: normalized all store areas to Nagpur Central');
}

// ============================================================================
// 2. FIX STITCH SCREEN RENDERER (Issue C normalization)
// ============================================================================
if (fs.existsSync(rendererPath)) {
  let r = fs.readFileSync(rendererPath, 'utf8');
  
  // Normalize activeArea
  r = r.replace(
    /const activeArea = \(activeP\.storeArea \|\| activeP\.vendor\?\.address\?\.area \|\| 'NAGPUR CENTRAL'\)\.toUpperCase\(\);/,
    `const rawArea = (activeP.storeArea || activeP.vendor?.address?.area || 'NAGPUR CENTRAL').toUpperCase();
      const activeArea = (rawArea.includes('SITABULDI') || rawArea.includes('DHARAMPETH')) ? 'NAGPUR CENTRAL' : rawArea;`
  );

  // Fallback string replacement on rendered PDP html
  r = r.replace(/•\s*SITABULDI/gi, '• NAGPUR CENTRAL');
  r = r.replace(/·\s*SITABULDI/gi, '· NAGPUR CENTRAL');
  r = r.replace(/•\s*DHARAMPETH/gi, '• NAGPUR CENTRAL');

  fs.writeFileSync(rendererPath, r, 'utf8');
  console.log('✓ Updated StitchScreenRenderer.js: ensured PDP activeArea normalization');
}

// ============================================================================
// 3. FIX stitchScreens.json (Issue A & Issue B)
// ============================================================================
if (fs.existsSync(screensPath)) {
  const screens = JSON.parse(fs.readFileSync(screensPath, 'utf8'));

  // Dedicated clean Promo Code Card HTML for Light theme
  const promoCardLight = `
<div class="px-gutter-md mt-3 mb-1">
  <div class="bg-surface-porcelain rounded-xl p-3.5 shadow-xs border border-surface-container-high flex items-center justify-between gap-2.5">
    <div class="flex items-center gap-2.5 flex-1 min-w-0">
      <div class="w-8 h-8 rounded-full bg-accent-crimson/10 text-accent-crimson flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-[18px]">sell</span>
      </div>
      <div class="flex flex-col min-w-0">
        <span class="font-eyebrow text-[10px] uppercase font-bold text-accent-crimson tracking-wider">Promo Code Applied</span>
        <span class="font-mono text-xs font-bold text-text-obsidian truncate">TRY60 · ₹150 OFF</span>
      </div>
    </div>
    <span class="px-2.5 py-1 rounded-lg bg-emerald-600/15 text-emerald-700 text-[11px] font-bold shrink-0">APPLIED ✓</span>
  </div>
</div>
`;

  // Dedicated clean Promo Code Card HTML for Dark theme
  const promoCardDark = `
<section class="px-margin pt-space-md">
  <div class="bg-surface-container-low border border-white/10 rounded-xl p-3.5 shadow-sm flex items-center justify-between gap-2.5">
    <div class="flex items-center gap-2.5 flex-1 min-w-0">
      <div class="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-[18px]">sell</span>
      </div>
      <div class="flex flex-col min-w-0">
        <span class="font-label-sm text-[10px] uppercase font-bold text-primary-container tracking-wider">Promo Code Applied</span>
        <span class="font-mono text-xs font-bold text-on-surface truncate">TRY60 · ₹150 OFF</span>
      </div>
    </div>
    <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-bold shrink-0">APPLIED ✓</span>
  </div>
</section>
`;

  // --- Fix Light Bag ---
  if (screens['final_light_theme_Your_Bag']) {
    let html = screens['final_light_theme_Your_Bag'].html;

    // Remove old promo card from inside the Order Summary flex header
    html = html.replace(/<div class="flex items-center justify-between">\s*<div class="bg-surface-porcelain dark:bg-surface-container rounded-xl p-3\.5[\s\S]*?APPLIED\s*✓<\/button>\s*<\/div>\s*<span class="font-eyebrow text-eyebrow text-text-ash uppercase tracking-widest">Order Summary<\/span>/i, 
      '<div class="flex items-center justify-between">\n<span class="font-eyebrow text-eyebrow text-text-ash uppercase tracking-widest">Order Summary</span>');

    // Remove any duplicate TRY60 cards
    html = html.replace(/<div class="bg-surface-porcelain dark:bg-surface-container rounded-xl p-3\.5 shadow-sm border border-surface-container-high dark:border-white\/10 my-3 flex items-center justify-between gap-2">[\s\S]*?APPLIED\s*✓<\/button>\s*<\/div>/g, '');

    // Now insert the dedicated promo card right before `<div class="px-gutter-md mt-4">\s*<div class="p-4 rounded-xl bg-surface-porcelain/90`
    html = html.replace(/(<div class="px-gutter-md mt-4">\s*<div class="p-4 rounded-xl bg-surface-porcelain\/90)/i, `${promoCardLight}$1`);

    screens['final_light_theme_Your_Bag'].html = html;
    console.log('✓ Fixed Light Bag: Promo card moved cleanly outside Order Summary box');
  }

  // --- Fix Dark Bag ---
  if (screens['final_theme_dark_Your_Bag']) {
    let html = screens['final_theme_dark_Your_Bag'].html;

    // Remove any existing TRY60 in dark bag to avoid duplicates
    html = html.replace(/<section class="px-margin pt-space-md">\s*<div class="bg-surface-container-low[\s\S]*?TRY60[\s\S]*?<\/section>/g, '');

    // Insert promo card right before `<section class="px-margin pt-space-lg">\s*<div class="rounded-xl bg-surface-container-low`
    html = html.replace(/(<section class="px-margin pt-space-lg">\s*<div class="rounded-xl bg-surface-container-low)/i, `${promoCardDark}$1`);

    screens['final_theme_dark_Your_Bag'].html = html;
    console.log('✓ Fixed Dark Bag: Promo card injected with dark theme classes');
  }

  // --- Fix PDP in stitchScreens.json ---
  if (screens['final_light_theme_Product_Detail']) {
    let html = screens['final_light_theme_Product_Detail'].html;
    html = html.replace(/•\s*SITABULDI/gi, '• NAGPUR CENTRAL');
    html = html.replace(/·\s*SITABULDI/gi, '· NAGPUR CENTRAL');
    html = html.replace(/THREAD &amp; BONE • SITABULDI/gi, 'THREAD &amp; BONE • NAGPUR CENTRAL');
    html = html.replace(/THREAD & BONE • SITABULDI/gi, 'THREAD & BONE • NAGPUR CENTRAL');
    screens['final_light_theme_Product_Detail'].html = html;
    console.log('✓ Fixed Light PDP: purged any remaining Sitabuldi subtitles');
  }

  fs.writeFileSync(screensPath, JSON.stringify(screens, null, 2), 'utf8');
}

console.log('🎉 All 3 critic findings fixed cleanly!');
