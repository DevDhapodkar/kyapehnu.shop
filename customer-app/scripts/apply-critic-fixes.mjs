import fs from 'node:fs';
import path from 'node:path';

const stitchScreensPath = path.resolve('src/data/stitchScreens.json');
const stitchRendererPath = path.resolve('src/components/StitchScreenRenderer.js');
const stitchAuthPath = path.resolve('src/stitch/StitchAuth.js');
const stitchRawJsxPath = path.resolve('src/stitch/stitchRawJsx.json');

console.log('🔧 Applying Application Critic fixes across customer app...');

// ============================================================================
// 1. UPDATE stitchScreens.json
// ============================================================================
if (fs.existsSync(stitchScreensPath)) {
  const screens = JSON.parse(fs.readFileSync(stitchScreensPath, 'utf8'));

  for (const [key, screen] of Object.entries(screens)) {
    if (!screen.html) continue;
    let h = screen.html;

    // A. Search bar placeholder: shorten from 64 to 30 chars
    h = h.replace(/placeholder="Search oversized tees, hoodies, baggy denims, cargos, shirts\.\.\."/g, 'placeholder="Search tees, hoodies, denims..."');
    h = h.replace(/placeholder="Search zardozi, silk kurtas, Dharampeth styles\.\.\."/g, 'placeholder="Search tees, hoodies, denims..."');

    // B. Auth placeholder: Mobile number or email
    h = h.replace(/placeholder="e\.g\.\s*98230\s*45892\s*or\s*name@email\.com"/g, 'placeholder="Mobile number or email"');
    h = h.replace(/placeholder="e\.g\.\s*98230\s*45892\s*or\s*radhika@kyapehnu\.shop"/g, 'placeholder="Mobile number or email"');

    // C. Storefront Hero Streetwear image & location
    const streetwearHeroImg = 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=900';
    if (key.includes('Storefront_Home')) {
      h = h.replace(/Thread &amp; Bone · Sitabuldi/g, 'Thread &amp; Bone · Nagpur Central');
      h = h.replace(/Thread &amp; Bone · Sitabuldi • 1\.2 km away/g, 'Thread &amp; Bone · Nagpur Central • 1.2 km away');
      h = h.replace(/background-image:\s*url\('[^']+'\)/, `background-image: url('${streetwearHeroImg}')`);
    }

    // D. Shopping Bag (Your_Bag)
    if (key.includes('Your_Bag') || key.includes('Couture_Bag')) {
      // Multi-boutique banner
      h = h.replace(/Consolidated pickup from Dharampeth &amp; Gan\.\.\./g, 'Express pickup from verified Nagpur boutiques');
      h = h.replace(/Consolidated pickup from Dharampeth & Gan\.\.\./g, 'Express pickup from verified Nagpur boutiques');
      
      // Bottom padding to avoid double-footer occlusion
      h = h.replace(/(<main[^>]*class="[^"]*pb-)[^"]*(")/g, '$148$2');
      h = h.replace(/(<div[^>]*class="[^"]*pb-)[0-9]+([^"]*space-y-[^"]*")/g, '$148$2');

      // Add Coupon / Promo Code Card if not already present
      if (!h.includes('TRY60')) {
        const couponCardHtml = `
<div class="bg-surface-porcelain dark:bg-surface-container rounded-xl p-3.5 shadow-sm border border-surface-container-high dark:border-white/10 my-3 flex items-center justify-between gap-2">
  <div class="flex items-center gap-2 flex-1 min-w-0">
    <span class="material-symbols-outlined text-accent-crimson text-xl shrink-0">sell</span>
    <div class="flex flex-col min-w-0 flex-1">
      <span class="text-[10px] uppercase font-bold text-accent-crimson tracking-wider">Promo Code Applied</span>
      <span class="text-xs font-mono font-bold text-text-obsidian dark:text-on-surface truncate">TRY60 · ₹150 OFF</span>
    </div>
  </div>
  <button type="button" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs active:scale-95 shrink-0">APPLIED ✓</button>
</div>
`;
        h = h.replace(/(<div[^>]*class="[^"]*ORDER SUMMARY[^"]*"|<div[^>]*class="[^"]*order-summary[^"]*")/i, `${couponCardHtml}$1`);
        // Fallback insertion before Order Summary text
        if (!h.includes('TRY60')) {
          h = h.replace(/(<span[^>]*class="[^"]*">ORDER SUMMARY<\/span>)/i, `${couponCardHtml}$1`);
        }
      }
    }

    // E. Product Detail (PDP)
    if (key.includes('Product_Detail')) {
      h = h.replace(/Acquire Now/g, 'Instant Checkout');
      h = h.replace(/THREAD &amp; BONE • SITABULDI/g, 'THREAD &amp; BONE • NAGPUR CENTRAL');
      h = h.replace(/THREAD &amp; BONE · DHARAMPETH · 1\.4 KM/g, 'THREAD &amp; BONE · NAGPUR CENTRAL · 1.4 KM');
      h = h.replace(/THREAD &amp; BONE · SITABULDI/g, 'THREAD &amp; BONE · NAGPUR CENTRAL');
      h = h.replace(/DHARAMPETH BOUTIQUE · 1\.4 KM/g, 'NAGPUR CENTRAL · 1.4 KM');
    }

    // F. Live Tracking Screen
    if (key.includes('Live_Tracking')) {
      h = h.replace(/Tailored/g, 'Packed');
      h = h.replace(/TAILORED/g, 'PACKED');
      h = h.replace(/HOME · SITABULDI/g, 'NAGPUR EXPRESS HUB · LIVE');
      h = h.replace(/>Sitabuldi</g, '>Nagpur Home<');
      h = h.replace(/Studio Anamika Dharampeth/g, 'Studio Anamika Nagpur');
      h = h.replace(/Sitabuldi Fashion Boutique/g, 'Nagpur Fashion Hub');
      h = h.replace(/Chanderi Rose Zari Kurta/g, 'Heavyweight Boxy Graphic Tee');
      h = h.replace(/Organza Marodi Scarf/g, 'Vintage Wash Baggy Cargo Pant');
      // Fix bottom padding for courier card visibility
      h = h.replace(/(<main[^>]*class="[^"]*pb-)[^"]*(")/g, '$148$2');
      h = h.replace(/(<div[^>]*class="[^"]*pb-)[0-9]+([^"]*space-y-[^"]*")/g, '$148$2');
    }

    // G. Profile Screen
    if (key.includes('Profile')) {
      h = h.replace(/Zari Paithani Drape \(Nagpur Express\)/g, 'Heavyweight Oversized Hoodie (Nagpur Express)');
    }

    // H. Vendor Registration Step 1
    if (key.includes('Vendor_Registration') || key.includes('Merchant')) {
      h = h.replace(/e\.g\.\s*Urban Thread Co\.\s*\/\s*Symbi Merch/g, 'e.g. Urban Thread Co.');
      h = h.replace(/e\.g\.\s*Aryan Sharma\s*\/\s*Dev D/g, 'e.g. Aryan Sharma');
      h = h.replace(/Zero inventory lock-in\s*•\s*45-min White Glove Porter:/g, 'Zero inventory lock-in · 45-min Porter Dispatch');
      h = h.replace(/Zero inventory lock-in\s*•\s*45-min White Glove Porter/g, 'Zero inventory lock-in · 45-min Porter Dispatch');
    }

    screen.html = h;
  }

  fs.writeFileSync(stitchScreensPath, JSON.stringify(screens, null, 2), 'utf8');
  console.log('✓ Updated stitchScreens.json with critic fixes');
}

// ============================================================================
// 2. UPDATE StitchScreenRenderer.js
// ============================================================================
if (fs.existsSync(stitchRendererPath)) {
  let rendererCode = fs.readFileSync(stitchRendererPath, 'utf8');

  // Shorten search placeholder in dynamic replacements
  rendererCode = rendererCode.replace(
    /placeholder="Search oversized tees, hoodies, baggy denims, cargos, shirts\.\.\."/g,
    'placeholder="Search tees, hoodies, denims..."'
  );

  // Shorten auth placeholder
  rendererCode = rendererCode.replace(
    /placeholder="e\.g\.\s*98230\s*45892\s*or\s*name@email\.com"/g,
    'placeholder="Mobile number or email"'
  );

  // 2-Column Grid Boutique name: remove • NAGPUR to prevent overflow
  rendererCode = rendererCode.replace(
    /\$\{boutique\}\s*•\s*NAGPUR/g,
    '${boutique}'
  );

  // PDP button text: Acquire Now -> Instant Checkout
  rendererCode = rendererCode.replace(/Acquire Now/g, 'Instant Checkout');

  // PDP Location fix: SITABULDI -> NAGPUR CENTRAL
  rendererCode = rendererCode.replace(
    /const activeArea = \(activeP\.storeArea \|\| activeP\.vendor\?\.address\?\.area \|\| 'SITABULDI'\)\.toUpperCase\(\);/,
    "const activeArea = (activeP.storeArea || activeP.vendor?.address?.area || 'NAGPUR CENTRAL').toUpperCase();"
  );

  // Shopping Bag: Ensure Coupon Card is injected in cart items view
  if (!rendererCode.includes('id="cartCouponBlock"')) {
    const couponComponentHtml = `
      // Injected Coupon & Promo Card
      const couponCardHtml = \`
        <div id="cartCouponBlock" class="p-3.5 my-3 rounded-xl bg-surface-porcelain border border-surface-container-high shadow-xs flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-full bg-accent-crimson/10 text-accent-crimson flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[18px]">sell</span>
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-eyebrow text-[10px] uppercase font-bold text-accent-crimson tracking-wider">Active Promo Applied</span>
              <span class="font-mono text-xs font-bold text-text-obsidian truncate">TRY60 · ₹150 OFF</span>
            </div>
          </div>
          <button type="button" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs active:scale-95 shrink-0">
            APPLIED ✓
          </button>
        </div>
      \`;
      html = html.replace(/(<div[^>]*class="[^"]*p-4[^"]*bg-surface-porcelain[^"]*"[^>]*>\s*<div[^>]*class="flex items-center justify-between mb-3"[^>]*>\s*<span[^>]*>ORDER SUMMARY<\\/span>)/i, \`\${couponCardHtml}$1\`);
    `;
    rendererCode = rendererCode.replace(
      /(\/\/ 3\. YOUR BAG \/ COUTURE BAG:)/i,
      `$1\n${couponComponentHtml}`
    );
  }

  // Double footer padding: make sure shopping bag and live tracking have ample bottom clearance
  rendererCode = rendererCode.replace(
    /pb-24 bg-surface min-h-screen/g,
    'pb-48 bg-surface min-h-screen'
  );
  rendererCode = rendererCode.replace(
    /pb-24 bg-ground-base/g,
    'pb-48 bg-ground-base'
  );

  fs.writeFileSync(stitchRendererPath, rendererCode, 'utf8');
  console.log('✓ Updated StitchScreenRenderer.js with critic fixes');
}

// ============================================================================
// 3. UPDATE StitchAuth.js & stitchRawJsx.json
// ============================================================================
if (fs.existsSync(stitchAuthPath)) {
  let authCode = fs.readFileSync(stitchAuthPath, 'utf8');
  authCode = authCode.replace(/placeholder="e\.g\.\s*98230\s*45892\s*or\s*name@email\.com"/g, 'placeholder="Mobile number or email"');
  authCode = authCode.replace(/placeholder="e\.g\.\s*98230\s*45892\s*or\s*radhika@kyapehnu\.shop"/g, 'placeholder="Mobile number or email"');
  fs.writeFileSync(stitchAuthPath, authCode, 'utf8');
  console.log('✓ Updated StitchAuth.js');
}

if (fs.existsSync(stitchRawJsxPath)) {
  let rawJsx = fs.readFileSync(stitchRawJsxPath, 'utf8');
  rawJsx = rawJsx.replace(/placeholder=\\"e\.g\.\s*98230\s*45892\s*or\s*name@email\.com\\"/g, 'placeholder=\\"Mobile number or email\\"');
  rawJsx = rawJsx.replace(/Search oversized tees, hoodies, baggy denims, cargos, shirts\.\.\./g, 'Search tees, hoodies, denims...');
  rawJsx = rawJsx.replace(/Acquire Now/g, 'Instant Checkout');
  fs.writeFileSync(stitchRawJsxPath, rawJsx, 'utf8');
  console.log('✓ Updated stitchRawJsx.json');
}

console.log('🎉 All critic fixes applied successfully!');
