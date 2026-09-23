// scripts/fix-all-error-ss.mjs
// Comprehensive fix for all 18 error screenshots in "errors ss"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[Fix] Starting automated fix for all 10 error categories in "errors ss"...');

// -------------------------------------------------------------
// 1. UPDATE stitchScreens.json
// -------------------------------------------------------------
const stitchScreensPath = path.join(rootDir, 'src', 'data', 'stitchScreens.json');
const stitchScreens = JSON.parse(fs.readFileSync(stitchScreensPath, 'utf8'));

// Helper to replace all occurrences
function replaceAll(str, search, replacement) {
  if (!str) return str;
  return str.split(search).join(replacement);
}

// Global text cleanses across all screens in stitchScreens.json
for (const [key, screen] of Object.entries(stitchScreens)) {
  if (!screen || !screen.html) continue;
  let h = screen.html;

  // Pivot traditional terms to modern 18-35 casual & streetwear
  h = h.replace(/Paithani\s+&\s+Silks/gi, 'Graphic Tees &amp; Hoodies');
  h = h.replace(/Chanderi\s+Silk\s+Angrakha\s+Set/gi, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/Chanderi\s+Zari\s+Silk\s+Angrakha\s+Set/gi, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/Chanderi\s+Silk\s+Angrakha/gi, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/Chanderi\s+Sets/gi, 'Oversized Hoodies');
  h = h.replace(/Handloom\s+Sarees/gi, 'Denims &amp; Cargos');
  h = h.replace(/Bridal\s+Collection/gi, 'Casual Shirts &amp; Polos');
  h = h.replace(/Occasion\s+Wear/gi, 'Sneakers &amp; Kicks');
  h = h.replace(/Bridal\s+Lehengas/gi, 'Casual Polos &amp; Knits');
  h = h.replace(/Designer\s+Kurtas/gi, 'Oversized Graphic Tees');
  h = h.replace(/Tussar\s+Silk\s+Kurta\s+Set/gi, 'Relaxed Selvedge Baggy Jeans');
  h = h.replace(/Organza\s+Marodi\s+Scarf/gi, 'Acid Wash Oversized Hoodie');
  h = h.replace(/Raw\s+Silk\s+Banarasi\s+Jacket/gi, 'Multi-Pocket Utility Cargo Pants');
  h = h.replace(/Maheshwari\s+Silks\s+&\s+Weaves/gi, 'Studio Anamika Streetwear');
  h = h.replace(/Studio\s+Anamika\s+Handlooms/gi, 'Studio Anamika Streetwear');
  h = h.replace(/Men's\s+Kurta\s+&\s+Bandhgala/gi, "Men's Casuals &amp; Tees");
  h = h.replace(/Bridal\s+&\s+Wedding\s+Wear/gi, 'Everyday Streetwear');
  h = h.replace(/One-Piece\s+Dress\s+&\s+Angrakha/gi, 'Boxy Oversized Fits');
  h = h.replace(/Angrakha\s+Wrap/gi, 'Boxy Drop-Shoulder');
  h = h.replace(/Fit\s+&\s+Flare\s+Maxi/gi, 'Straight Leg Baggy');
  h = h.replace(/Kaftan\s+Tunic/gi, 'Relaxed Cargo Cut');
  h = h.replace(/Tiered\s+Peplum/gi, 'Classic Regular');
  h = h.replace(/Straight\s+Shift\s+Dress/gi, 'Cropped Boxy Tee');
  h = h.replace(/Asymmetric\s+Hem/gi, 'Raw Hem Relaxed');

  // Fabric cleanses
  h = h.replace(/Chanderi\s+Silk/gi, '240 GSM Combed Cotton');
  h = h.replace(/Pure\s+Paithani\s+Handloom/gi, 'French Terry Fleece');
  h = h.replace(/Tussar\s+Raw\s+Silk/gi, 'Rigid Washed Denim');
  h = h.replace(/Organza\s+Tissue/gi, 'Cotton Twill');
  h = h.replace(/Mulmul\s+Cotton/gi, 'Heavyweight Jersey');
  h = h.replace(/Modal\s+Satin/gi, 'Loopknit Cotton');

  // Occasions cleanses
  h = h.replace(/Festive\s+Puja/gi, 'College &amp; Campus');
  h = h.replace(/Intimate\s+Mehendi/gi, 'Weekend Hangout');
  h = h.replace(/Luxury\s+Weekend\s+Dining/gi, 'Casual Night Out');
  h = h.replace(/Evening\s+Soir[eé]e/gi, 'Everyday Streetwear');

  // Care instructions cleanses
  h = h.replace(/Dry\s+Clean\s+Only\s*\(\s*Zari\s+Guard\s*\)/gi, 'Machine Wash Cold');

  // QC zari weave references
  h = h.replace(/zari\s+weave\s+textures/gi, 'fabric knit, seam stitching, and graphic prints');

  // Tailoring -> Packing & Dispatch
  h = h.replace(/Tailoring\s*\/\s*Packing/gi, 'Packing &amp; Dispatch');

  // Weave categories in catalogue manager
  h = h.replace(/All\s+Weaves\s*\(24\)/gi, 'All Fits (24)');
  h = h.replace(/Angrakhas\s*&\s*Kurtas\s*\(12\)/gi, 'Tees &amp; Hoodies (12)');
  h = h.replace(/Sarees\s*&\s*Drapes\s*\(8\)/gi, 'Denims &amp; Cargos (8)');
  h = h.replace(/Dupattas\s*&\s*Scarves\s*\(4\)/gi, 'Casual Shirts (4)');
  h = h.replace(/Search\s+weave,\s+silhouette,\s+SKU\s*\(e\.g\.\s*Chanderi\)\.\.\./gi, 'Search fit, graphic tee, denim, hoodie, SKU...');

  // Fix sizing bust labels to chest / standard
  h = h.replace(/Small\s*\(\s*Bust\s+36["”]?\s*\)/gi, 'Small (Chest 38")');
  h = h.replace(/Medium\s*\(\s*Bust\s+38["”]?\s*\)/gi, 'Medium (Chest 40")');
  h = h.replace(/Large\s*\(\s*Bust\s+40["”]?\s*\)/gi, 'Large (Chest 42")');
  h = h.replace(/Extra\s+Large\s*\(\s*Bust\s+42["”]?\s*\)/gi, 'Extra Large (Chest 44")');

  // Saree boutique preview description in vendor desk
  h = h.replace(/High-end Indian luxury boutique interior with rich mahogany shelves holding opulent folded raw silk and zari sarees in Dharampeth Nagpur[\s\S]*?minimal glass displays\./gi, 'Modern streetwear fashion boutique showroom with graphic tees, hoodies, sneakers, and premium denim racks in Nagpur.');

  // Fix node name in Product Ingestion
  h = h.replace(/Dharampeth\s+Node\s+4/gi, 'Nagpur Express Node (Active)');

  screen.html = h;
}

// Specifically fix Product Ingestion header transparency & publishBtn visibility in stitchScreens.json
for (const key of ['final_light_theme_Product_Ingestion___Catalog_Listing_Form', 'final_theme_dark_Product_Ingestion___Catalog_Listing_Form']) {
  const scr = stitchScreens[key];
  if (!scr || !scr.html) continue;
  let h = scr.html;

  const isDark = key.includes('dark');
  const headerBg = isDark ? '#131315' : '#FFFFFF';
  const stepperBg = isDark ? '#131315' : '#FAF9F5';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(18,18,20,0.08)';

  // 1. Ensure header is fully opaque and sits on z-50
  h = h.replace(
    /<header\s+class="sticky\s+top-0[^"]*"[^>]*>/i,
    `<header class="sticky top-0 z-50 px-3.5 py-2.5 flex items-center justify-between gap-2 transition-all min-h-[56px] shadow-sm" style="background-color: ${headerBg} !important; border-bottom: 1px solid ${borderColor}; z-index: 50 !important;">`
  );

  // 2. Ensure stepper bar is fully opaque
  h = h.replace(
    /<div\s+class="sticky\s+top-\[56px\][^"]*"[^>]*>/i,
    `<div class="sticky top-[56px] z-40 px-4 pt-2.5 pb-2 shadow-xs" style="background-color: ${stepperBg} !important; border-bottom: 1px solid ${borderColor}; z-index: 40 !important;">`
  );

  // 3. Ensure publishBtn is 100% visible, bold crimson background, white text
  h = h.replace(
    /<button[^>]*id="publishBtn"[^>]*>([\s\S]*?)<\/button>/i,
    `<button type="button" id="publishBtn" onclick="handlePublishSubmit()" class="w-full font-bold py-3.5 px-4 rounded-xl shadow-float flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.98] transition-all" style="background-color: #C4243A !important; color: #FFFFFF !important; display: flex !important; visibility: visible !important; min-height: 52px; opacity: 1 !important;">
      <i class="fa-solid fa-cloud-arrow-up text-sm"></i>
      <span class="font-bold text-white text-[14px]">Publish Product to Catalog</span>
      <i class="fa-solid fa-arrow-right text-xs opacity-80 ml-1"></i>
    </button>`
  );

  // 4. Move toast notification away from header (bottom-24 instead of top-16)
  h = h.replace(
    /class="fixed\s+top-16\s+left-1\/2\s+-translate-x-1\/2\s+z-50/g,
    'class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50'
  );

  // 5. Update default pricing from ₹4,800 to ₹1,499
  h = h.replace(/value="4800"/g, 'value="1499"');
  h = h.replace(/placeholder="4800"/g, 'placeholder="1499"');
  h = h.replace(/₹4,800/g, '₹1,499');
  h = h.replace(/₹6,400/g, '₹1,999');
  h = h.replace(/₹1,600\s*\(25%\)/g, '₹500 (25%)');
  h = h.replace(/₹4,560/g, '₹1,424');

  scr.html = h;
}

// Save stitchScreens.json
fs.writeFileSync(stitchScreensPath, JSON.stringify(stitchScreens, null, 2), 'utf8');
console.log('[Fix] stitchScreens.json updated successfully.');

// -------------------------------------------------------------
// 2. UPDATE src/stitch/StitchProductIngestion.js
// -------------------------------------------------------------
const ingestionPath = path.join(rootDir, 'src', 'stitch', 'StitchProductIngestion.js');
let ingestionContent = fs.readFileSync(ingestionPath, 'utf8');

// Apply identical cleanses to StitchProductIngestion.js
ingestionContent = ingestionContent.replace(/Chanderi\s+Zari\s+Silk\s+Angrakha\s+Set/gi, 'Heavyweight Boxy Graphic Tee');
ingestionContent = ingestionContent.replace(/Chanderi\s+Silk\s+Angrakha/gi, 'Heavyweight Boxy Graphic Tee');
ingestionContent = ingestionContent.replace(/Handloom\s+Sarees/gi, 'Denims &amp; Cargos');
ingestionContent = ingestionContent.replace(/Men's\s+Kurta\s+&\s+Bandhgala/gi, "Men's Casuals &amp; Tees");
ingestionContent = ingestionContent.replace(/Bridal\s+&\s+Wedding\s+Wear/gi, 'Everyday Streetwear');
ingestionContent = ingestionContent.replace(/One-Piece\s+Dress\s+&\s+Angrakha/gi, 'Boxy Oversized Fits');
ingestionContent = ingestionContent.replace(/Angrakha\s+Wrap/gi, 'Boxy Drop-Shoulder');
ingestionContent = ingestionContent.replace(/Fit\s+&\s+Flare\s+Maxi/gi, 'Straight Leg Baggy');
ingestionContent = ingestionContent.replace(/Kaftan\s+Tunic/gi, 'Relaxed Cargo Cut');
ingestionContent = ingestionContent.replace(/Tiered\s+Peplum/gi, 'Classic Regular');
ingestionContent = ingestionContent.replace(/Straight\s+Shift\s+Dress/gi, 'Cropped Boxy Tee');
ingestionContent = ingestionContent.replace(/Asymmetric\s+Hem/gi, 'Raw Hem Relaxed');
ingestionContent = ingestionContent.replace(/Chanderi\s+Silk/gi, '240 GSM Combed Cotton');
ingestionContent = ingestionContent.replace(/Pure\s+Paithani\s+Handloom/gi, 'French Terry Fleece');
ingestionContent = ingestionContent.replace(/Tussar\s+Raw\s+Silk/gi, 'Rigid Washed Denim');
ingestionContent = ingestionContent.replace(/Organza\s+Tissue/gi, 'Cotton Twill');
ingestionContent = ingestionContent.replace(/Mulmul\s+Cotton/gi, 'Heavyweight Jersey');
ingestionContent = ingestionContent.replace(/Modal\s+Satin/gi, 'Loopknit Cotton');
ingestionContent = ingestionContent.replace(/Festive\s+Puja/gi, 'College &amp; Campus');
ingestionContent = ingestionContent.replace(/Intimate\s+Mehendi/gi, 'Weekend Hangout');
ingestionContent = ingestionContent.replace(/Luxury\s+Weekend\s+Dining/gi, 'Casual Night Out');
ingestionContent = ingestionContent.replace(/Evening\s+Soir[eé]e/gi, 'Everyday Streetwear');
ingestionContent = ingestionContent.replace(/Dry\s+Clean\s+Only\s*\(\s*Zari\s+Guard\s*\)/gi, 'Machine Wash Cold');
ingestionContent = ingestionContent.replace(/zari\s+weave\s+textures/gi, 'fabric knit, seam stitching, and graphic prints');
ingestionContent = ingestionContent.replace(/Dharampeth\s+Node\s+4/gi, 'Nagpur Express Node (Active)');

// Sizing
ingestionContent = ingestionContent.replace(/Small\s*\(\s*Bust\s+36["”]?\s*\)/gi, 'Small (Chest 38")');
ingestionContent = ingestionContent.replace(/Medium\s*\(\s*Bust\s+38["”]?\s*\)/gi, 'Medium (Chest 40")');
ingestionContent = ingestionContent.replace(/Large\s*\(\s*Bust\s+40["”]?\s*\)/gi, 'Large (Chest 42")');
ingestionContent = ingestionContent.replace(/Extra\s+Large\s*\(\s*Bust\s+42["”]?\s*\)/gi, 'Extra Large (Chest 44")');

// Pricing
ingestionContent = ingestionContent.replace(/value=\\"4800\\"/g, 'value=\\"1499\\"');
ingestionContent = ingestionContent.replace(/placeholder=\\"4800\\"/g, 'placeholder=\\"1499\\"');
ingestionContent = ingestionContent.replace(/₹4,800/g, '₹1,499');
ingestionContent = ingestionContent.replace(/₹6,400/g, '₹1,999');
ingestionContent = ingestionContent.replace(/₹1,600\s*\(25%\)/g, '₹500 (25%)');
ingestionContent = ingestionContent.replace(/₹4,560/g, '₹1,424');

// Header transparency fix
ingestionContent = ingestionContent.replace(
  /<header\s+class=\\"sticky\s+top-0[^\\"]*\\"[^>]*>/gi,
  '<header class=\\"sticky top-0 z-50 px-3.5 py-2.5 flex items-center justify-between gap-2 transition-all min-h-[56px] shadow-sm\\" style=\\"background-color: #FFFFFF !important; border-bottom: 1px solid rgba(18,18,20,0.08); z-index: 50 !important;\\">'
);
ingestionContent = ingestionContent.replace(
  /<div\s+class=\\"sticky\s+top-\[56px\][^\\"]*\\"[^>]*>/gi,
  '<div class=\\"sticky top-[56px] z-40 px-4 pt-2.5 pb-2 shadow-xs\\" style=\\"background-color: #FAF9F5 !important; border-bottom: 1px solid rgba(18,18,20,0.08); z-index: 40 !important;\\">'
);

// Publish button fix
ingestionContent = ingestionContent.replace(
  /<button[^>]*id=\\"publishBtn\\"[^>]*>[\s\S]*?<\/button>/gi,
  `<button type=\\"button\\" id=\\"publishBtn\\" onclick=\\"handlePublishSubmit()\\" class=\\"w-full font-bold py-3.5 px-4 rounded-xl shadow-float flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.98] transition-all\\" style=\\"background-color: #C4243A !important; color: #FFFFFF !important; display: flex !important; visibility: visible !important; min-height: 52px; opacity: 1 !important;\\">
    <i class=\\"fa-solid fa-cloud-arrow-up text-sm\\"></i>
    <span class=\\"font-bold text-white text-[14px]\\">Publish Product to Catalog</span>
    <i class=\\"fa-solid fa-arrow-right text-xs opacity-80 ml-1\\"></i>
  </button>`
);

// Toast position
ingestionContent = ingestionContent.replace(
  /class=\\"fixed\s+top-16\s+left-1\/2\s+-translate-x-1\/2\s+z-50/g,
  'class=\\"fixed bottom-24 left-1/2 -translate-x-1/2 z-50'
);

fs.writeFileSync(ingestionPath, ingestionContent, 'utf8');
console.log('[Fix] src/stitch/StitchProductIngestion.js updated successfully.');

// -------------------------------------------------------------
// 3. UPDATE src/stitch/StitchVendorRegister.js
// -------------------------------------------------------------
const registerPath = path.join(rootDir, 'src', 'stitch', 'StitchVendorRegister.js');
let regContent = fs.readFileSync(registerPath, 'utf8');

// Replace traditional specialties and boutique names
regContent = regContent.replace(/Paithani\s+&\s+Silks/gi, 'Graphic Tees &amp; Hoodies');
regContent = regContent.replace(/Designer\s+Wear/gi, 'Denims &amp; Cargos');
regContent = regContent.replace(/Bridal\s+Collection/gi, 'Casual Shirts &amp; Polos');
regContent = regContent.replace(/Occasion\s+Wear/gi, 'Sneakers &amp; Kicks');
regContent = regContent.replace(/Contemporary\s+Streetwear/gi, 'Oversized Streetwear');

// Desk chips
regContent = regContent.replace(/Handloom\s+Sarees/gi, 'Graphic Tees');
regContent = regContent.replace(/Chanderi\s+Sets/gi, 'Oversized Hoodies');
regContent = regContent.replace(/Designer\s+Kurtas/gi, 'Baggy Cargos');
regContent = regContent.replace(/Party\s+&\s+Festive/gi, 'Casual Shirts');
regContent = regContent.replace(/Bridal\s+Lehengas/gi, 'Denim Jackets');

// Boutique names
regContent = regContent.replace(/Studio\s+Anamika\s+Handlooms/gi, 'Studio Anamika Streetwear');
regContent = regContent.replace(/Maheshwari\s+Silks\s+&\s+Weaves/gi, 'Studio Anamika Streetwear');
regContent = regContent.replace(/Curated\s+Handlooms\s+•\s+Designer\s+Fits/gi, 'Curated Streetwear • Everyday Fits');
regContent = regContent.replace(/High-end Indian luxury boutique interior with rich mahogany shelves holding opulent folded raw silk and zari sarees in Dharampeth Nagpur[\s\S]*?minimal glass displays\./gi, 'Modern streetwear fashion boutique showroom with graphic tees, hoodies, sneakers, and premium denim racks in Nagpur.');

fs.writeFileSync(registerPath, regContent, 'utf8');
console.log('[Fix] src/stitch/StitchVendorRegister.js updated successfully.');

// -------------------------------------------------------------
// 4. UPDATE src/components/StitchScreenRenderer.js
// -------------------------------------------------------------
const rendererPath = path.join(rootDir, 'src', 'components', 'StitchScreenRenderer.js');
let rendererContent = fs.readFileSync(rendererPath, 'utf8');

// Fix 1: handlePublishSubmit infinite recursion bug
rendererContent = rendererContent.replace(
  /window\.handlePublishSubmit\s*=\s*\(\)\s*=>\s*\{[\s\S]*?const pubBtn = document\.getElementById\('publishBtn'\);[\s\S]*?if \(pubBtn\) pubBtn\.click\(\);[\s\S]*?\};/,
  `window.handlePublishSubmit = () => {
      // Dispatches custom event to trigger publication without circular click recursion
      const event = new CustomEvent('stitch-publish-catalog', { bubbles: true });
      document.dispatchEvent(event);
    };`
);

// Fix 2: Listen for custom event or button click safely
rendererContent = rendererContent.replace(
  /if\s*\(\s*btn\s*&&\s*\(\s*btn\.id\s*===\s*'publishBtn'\s*\|\|\s*\(\s*btn\.textContent\s*&&\s*btn\.textContent\.includes\('Publish'\)\s*\)\s*\)\s*\)\s*\{/,
  `if ((btn && (btn.id === 'publishBtn' || (btn.textContent && btn.textContent.includes('Publish')))) || (e && e.type === 'stitch-publish-catalog')) {`
);

// Fix 3: Default title for newly published product: Heavyweight Boxy Graphic Tee
rendererContent = rendererContent.replace(
  /const\s+titleVal\s*=\s*titleInput\?\.value\?\.trim\(\)\s*\|\|\s*'Nagpur Zari Chanderi Kurta';/,
  `const titleVal = titleInput?.value?.trim() || 'Heavyweight Boxy Graphic Tee';`
);
rendererContent = rendererContent.replace(
  /priceInput\?\.value\s*\|\|\s*'4800'/g,
  `priceInput?.value || '1499'`
);
rendererContent = rendererContent.replace(
  /description:\s*'Nagpur Handcrafted Designer Boutique Edition'/g,
  `description: '240 GSM French Terry Cotton · Relaxed Drop-Shoulder Streetwear'`
);

// Fix 4: Catalogue Manager stats sync when 0 pieces
// Search for `html = html.replace(/\d+\s+Curated Pieces Live/gi, ...)`
const catStatsOld = `html = html.replace(/\\d+\\s+Curated Pieces Live/gi, \`\${filteredCatalog.length} Curated Pieces Live\`);`;
const catStatsNew = `html = html.replace(/\\d+\\s+Curated Pieces Live/gi, \`\${filteredCatalog.length} Curated Pieces Live\`);
      // Synchronize stat boxes (Live & Ready, Low Stock, QC Ingest)
      const liveCount = filteredCatalog.filter(p => p.isAvailable !== false).length;
      const lowStockCount = filteredCatalog.length === 0 ? 0 : Math.max(0, Math.floor(filteredCatalog.length * 0.15));
      const qcCount = filteredCatalog.length === 0 ? 0 : Math.max(0, Math.floor(filteredCatalog.length * 0.05));
      html = html.replace(/(<span class="font-tabular-price text-tabular-price text-text-obsidian">)\\d+(<\\/span>\\s*<span class="font-eyebrow text-\\[9px\\] uppercase tracking-wider text-text-ash">Live &amp; Ready<\\/span>)/i, \`$1\${liveCount}$2\`);
      html = html.replace(/(<span class="font-tabular-price text-tabular-price text-accent-gold-deep">)\\d+(<\\/span>\\s*<span class="font-eyebrow text-\\[9px\\] uppercase tracking-wider text-text-ash">Low Stock<\\/span>)/i, \`$1\${lowStockCount}$2\`);
      html = html.replace(/(<span class="font-tabular-price text-tabular-price text-accent-crimson">)\\d+(<\\/span>\\s*<span class="font-eyebrow text-\\[9px\\] uppercase tracking-wider text-text-ash">QC Ingest<\\/span>)/i, \`$1\${qcCount}$2\`);`;

if (rendererContent.includes(catStatsOld)) {
  rendererContent = rendererContent.replace(catStatsOld, catStatsNew);
  console.log('[Fix] Catalogue Manager stat boxes synchronization injected.');
}

// Fix 5: Vendor Order Queue empty tabs sync & Tailoring rename
const queueZeroOld = `if (vendorQueueOrders.length === 0) {
        html = html.replace(/\\d+\\s+Active Orders/gi, '0 Active Orders');
        const queueContainerRegex = /(<div[^>]*class="[^"]*flex flex-col gap-gutter-md[^"]*"[^>]*>)[\\s\\S]*?(<\\/div>\\s*<\\/main>)/i;
        if (queueContainerRegex.test(html)) {
          html = html.replace(queueContainerRegex, \`$1<div class="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low my-4"><span class="material-symbols-outlined text-4xl text-text-ash">inbox</span><h3 class="font-title-md text-base text-text-obsidian font-bold">No Incoming Orders</h3><p class="font-body-sm text-xs text-text-slate max-w-xs">You have no active orders in your queue right now.</p></div>$2\`);
        }
      }`;

const queueZeroNew = `if (vendorQueueOrders.length === 0) {
        html = html.replace(/\\d+\\s+Active Orders/gi, '0 Active Orders');
        // Synchronize tabs to 0 counts and use Packing & Dispatch
        const zeroTabsHtml = \`
          <button class="queue-tab active-tab bg-text-obsidian text-surface-porcelain font-semibold px-3.5 py-2 rounded-full font-tabular-caption text-tabular-caption whitespace-nowrap flex items-center gap-1.5 transition-all" data-filter="all">All (0)</button>
          <button class="queue-tab bg-surface-container-low text-text-slate px-3.5 py-2 rounded-full font-tabular-caption text-tabular-caption whitespace-nowrap flex items-center gap-1.5 transition-all" data-filter="new">New Queue (0)</button>
          <button class="queue-tab bg-surface-container-low text-text-slate px-3.5 py-2 rounded-full font-tabular-caption text-tabular-caption whitespace-nowrap flex items-center gap-1.5 transition-all" data-filter="packing">Packing &amp; Dispatch (0)</button>
          <button class="queue-tab bg-surface-container-low text-text-slate px-3.5 py-2 rounded-full font-tabular-caption text-tabular-caption whitespace-nowrap flex items-center gap-1.5 transition-all" data-filter="dispatched">Dispatched (0)</button>
        \`;
        html = html.replace(/(<div[^>]*class="[^"]*flex items-center gap-gutter-xs overflow-x-auto no-scrollbar py-1[^"]*"[^>]*>)[\\s\\S]*?(<\\/div>)/i, \`$1\${zeroTabsHtml}$2\`);
        const queueContainerRegex = /(<div[^>]*class="[^"]*flex flex-col gap-gutter-md[^"]*"[^>]*>)[\\s\\S]*?(<\\/div>\\s*<\\/main>)/i;
        if (queueContainerRegex.test(html)) {
          html = html.replace(queueContainerRegex, \`$1<div class="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low my-4"><span class="material-symbols-outlined text-4xl text-text-ash">inbox</span><h3 class="font-title-md text-base text-text-obsidian font-bold">No Incoming Orders</h3><p class="font-body-sm text-xs text-text-slate max-w-xs">You have no active orders in your queue right now.</p></div>$2\`);
        }
      }`;

if (rendererContent.includes(`if (vendorQueueOrders.length === 0) {`)) {
  rendererContent = rendererContent.replace(queueZeroOld, queueZeroNew);
  console.log('[Fix] Vendor Order Queue zero state tabs injected.');
}

// Fix 6: Rename Tailoring / Packing in non-zero queue tabs as well
rendererContent = rendererContent.replace(/Tailoring\s*\/\s*Packing/g, 'Packing &amp; Dispatch');

// Fix 7: Dynamic store name and area in queue header
rendererContent = rendererContent.replace(
  /<span class="font-tabular-caption text-tabular-caption text-text-obsidian font-semibold truncate">Nagpur Store 04<\/span>/g,
  `<span class="font-tabular-caption text-tabular-caption text-text-obsidian font-semibold truncate">\${vendorProfile?.shopName || 'Studio Anamika Streetwear'}</span>`
);

// Fix 8: Toast position in StitchScreenRenderer.js (move from top: 76 to bottom: 88 floating pill)
rendererContent = rendererContent.replace(
  /position:\s*'fixed',\s*top:\s*76,/g,
  `position: 'fixed',\n            bottom: 88,`
);

fs.writeFileSync(rendererPath, rendererContent, 'utf8');
console.log('[Fix] src/components/StitchScreenRenderer.js updated successfully.');

// -------------------------------------------------------------
// 5. UPDATE src/screens/vendor/VendorProfileScreen.js
// -------------------------------------------------------------
const profilePath = path.join(rootDir, 'src', 'screens', 'vendor', 'VendorProfileScreen.js');
let profContent = fs.readFileSync(profilePath, 'utf8');

// Ensure useThemeStore is imported
if (!profContent.includes('useThemeStore')) {
  profContent = profContent.replace(
    /import\s*\{\s*useAuthStore\s*\}\s*from\s*'\.\.\/\.\.\/store\/useAuthStore';/,
    `import { useAuthStore } from '../../store/useAuthStore';\nimport { useThemeStore } from '../../store/useThemeStore';`
  );
}

// Add theme hook call inside component
if (!profContent.includes('const isDark = useThemeStore')) {
  profContent = profContent.replace(
    /const\s+insets\s*=\s*useSafeAreaInsets\(\);/,
    `const insets = useSafeAreaInsets();\n  const isDark = useThemeStore((state) => state.isDark);`
  );
}

// Update StatusBar
profContent = profContent.replace(
  /<StatusBar barStyle="dark-content" \/>/,
  `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />`
);

// Dynamic root styling
profContent = profContent.replace(
  /<View style=\{styles\.root\}>/,
  `<View style={[styles.root, { backgroundColor: isDark ? '#121214' : '#F4EFE7' }]}>`
);

// Dynamic topBar styling
profContent = profContent.replace(
  /style=\{\[styles\.topBar,\s*\{\s*paddingTop:\s*insets\.top\s*\+\s*4\s*\}\]\}/,
  `style={[styles.topBar, { paddingTop: insets.top + 4, backgroundColor: isDark ? 'rgba(18, 18, 20, 0.96)' : 'rgba(244, 239, 231, 0.96)', borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(217, 119, 6, 0.12)' }]}`
);

// Dynamic topBarInner
profContent = profContent.replace(
  /<View style=\{styles\.topBarInner\}>/,
  `<View style={[styles.topBarInner, { backgroundColor: isDark ? '#1C1B1D' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(217, 119, 6, 0.25)' }]}>`
);

// Dynamic topBarTitle
profContent = profContent.replace(
  /<Text style=\{styles\.topBarTitle\}>/,
  `<Text style={[styles.topBarTitle, { color: isDark ? '#FDFDFD' : colors.textObsidian }]}>`
);

// Dynamic profileCard
profContent = profContent.replace(
  /<View style=\{styles\.profileCard\}>/,
  `<View style={[styles.profileCard, { backgroundColor: isDark ? '#1C1B1D' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(217, 119, 6, 0.2)' }]}>`
);

// Dynamic shopNameText and ownerNameText
profContent = profContent.replace(
  /<Text style=\{styles\.shopNameText\}>\{shopName\}<\/Text>/,
  `<Text style={[styles.shopNameText, { color: isDark ? '#FDFDFD' : colors.textObsidian }]}>{shopName}</Text>`
);
profContent = profContent.replace(
  /<Text style=\{styles\.ownerNameText\}>Proprietor: \{ownerName\}<\/Text>/,
  `<Text style={[styles.ownerNameText, { color: isDark ? '#9CA3AF' : colors.textSlate }]}>Proprietor: {ownerName}</Text>`
);

// Dynamic supportCard
profContent = profContent.replace(
  /<View style=\{styles\.supportCard\}>/,
  `<View style={[styles.supportCard, { backgroundColor: isDark ? '#1C1B1D' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(217, 119, 6, 0.2)' }]}>`
);
profContent = profContent.replace(
  /<Text style=\{styles\.sectionHeaderTitle\}>Nagpur Partner Helpline<\/Text>/,
  `<Text style={[styles.sectionHeaderTitle, { color: isDark ? '#FDFDFD' : colors.textObsidian }]}>Nagpur Partner Helpline</Text>`
);

// Dynamic supportActionBtn
profContent = profContent.replace(
  /style=\{styles\.supportActionBtn\}/g,
  `style={[styles.supportActionBtn, { backgroundColor: isDark ? '#232225' : '#FDFBF7', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(18, 18, 20, 0.08)' }]}`
);

// Dynamic switchModeCard
profContent = profContent.replace(
  /style=\{styles\.switchModeCard\}/g,
  `style={[styles.switchModeCard, { backgroundColor: isDark ? '#1C1B1D' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(217, 119, 6, 0.3)' }]}`
);
profContent = profContent.replace(
  /<Text style=\{styles\.switchModeTitle\}>/,
  `<Text style={[styles.switchModeTitle, { color: isDark ? '#FDFDFD' : colors.textObsidian }]}>`
);

// Increase scroll padding bottom from 90 to 140 for clearance above VendorBottomNav
profContent = profContent.replace(
  /paddingBottom:\s*insets\.bottom\s*\+\s*90/,
  `paddingBottom: insets.bottom + 140`
);

// Fix corridor text
profContent = profContent.replace(
  /Sitabuldi\s*·\s*Dharampeth\s*·\s*Itwari\s*·\s*Gandhibagh\s*·\s*Sadar/g,
  'Nagpur Citywide Fast Courier Network · All Zones Active'
);

fs.writeFileSync(profilePath, profContent, 'utf8');
console.log('[Fix] src/screens/vendor/VendorProfileScreen.js updated successfully.');

console.log('[Fix] All error screen updates completed successfully!');
