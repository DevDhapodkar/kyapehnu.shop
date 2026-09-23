// scripts/purify-all-streetwear.mjs
// Complete eradication of all traditional/ethnic/saree/kurta/zari/handloom copy across the entire app
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[Purify] Starting comprehensive streetwear purification across codebase...');

const PHRASES = [
  // Full titles & phrases
  [/e\.g\.\s*Handwoven\s+Organza\s+Dupatta\s+Kurta/gi, 'e.g. Oversized Graphic Tee, Baggy Cargos'],
  [/(?:Royal\s+)?Chanderi\s+Zari\s+Kurta(?:\s+Set)?/gi, 'Heavyweight Graphic Streetwear Tee'],
  [/Chanderi\s+Zari\s+Silk\s+Angrakha(?:\s+Set)?/gi, 'Heavyweight Boxy Graphic Tee'],
  [/Chanderi\s+Silk\s+Angrakha(?:\s+Set)?/gi, 'Heavyweight Boxy Graphic Tee'],
  [/Chanderi\s+Angrakha/gi, 'Heavyweight Boxy Graphic Tee'],
  [/Tissue\s+Zari\s+Saree/gi, 'Acid Wash Oversized Hoodie'],
  [/Tussar\s+Silk\s+Kurta(?:\s+Set)?/gi, 'Relaxed Selvedge Baggy Jeans'],
  [/Tussar\s+Handloom\s+Saree/gi, 'Relaxed Baggy Cargo Pants'],
  [/Tussar\s+Kurta\s+Set/gi, 'Selvedge Denim Set'],
  [/Organza\s+Marodi\s+Scarf/gi, 'Acid Wash Oversized Hoodie'],
  [/Raw\s+Silk\s+Banarasi\s+Jacket/gi, 'Multi-Pocket Utility Cargo Pants'],
  [/Zari\s+Border\s+Silk\s+Dupatta/gi, 'Heavyweight Boxy Graphic Tee'],
  [/Paithani\s+Border\s+Silk\s+Kurta/gi, 'Oversized Streetwear Hoodie'],
  [/Maheshwari\s+Silks\s+(?:&|&amp;)\s+Weaves/gi, 'Studio Anamika Streetwear'],
  [/Maheshwari\s+Handlooms/gi, 'Studio Anamika Streetwear'],
  [/Studio\s+Anamika\s+Handlooms/gi, 'Studio Anamika Streetwear'],
  [/Handloom\s+Chanderi\s+(?:&|&amp;)\s+Organza\s+Kurta/gi, 'Heavyweight Oversized Graphic Tee'],
  [/Nagpur\s+Handloom\s+Archive/gi, 'Nagpur Streetwear Archive'],
  [/100%\s+Certified\s+Authentic\s+Nagpur\s+Handloom/gi, '100% Certified Authentic Streetwear'],
  [/9\s+Handlooms\s+Active/gi, '9 Boutique Drops Active'],
  [/Certified\s+handlooms\s+of\s+Gandhibagh/gi, 'Nagpur Fast Fashion &amp; Streetwear Hub'],
  [/master\s+handloom\s+weaver/gi, 'independent streetwear designer'],
  [/84\s+certified\s+handloom\s+families/gi, '84 local independent streetwear creators'],
  [/Historic\s+handloom\s+store/gi, 'Curated streetwear boutique'],

  // Categories & Specialties Chips
  [/Paithani\s+(?:&|&amp;)\s+Silks/gi, 'Graphic Tees &amp; Hoodies'],
  [/Angrakhas\s+(?:&|&amp;)\s+Kurtas(?:\s*\(\d+\))?/gi, 'Tees &amp; Hoodies (12)'],
  [/Sarees\s+(?:&|&amp;)\s+Drapes(?:\s*\(\d+\))?/gi, 'Denims &amp; Cargos (8)'],
  [/Dupattas\s+(?:&|&amp;)\s+Scarves(?:\s*\(\d+\))?/gi, 'Casual Shirts (4)'],
  [/All\s+Weaves(?:\s*\(\d+\))?/gi, 'All Fits (24)'],
  [/Handloom\s+Sarees/gi, 'Denims &amp; Cargos'],
  [/Men's\s+Kurta\s+(?:&|&amp;)\s+Bandhgala/gi, "Men's Casuals &amp; Tees"],
  [/Bridal\s+(?:&|&amp;)\s+Wedding\s+Wear/gi, 'Everyday Streetwear'],
  [/Bridal\s+Collection/gi, 'Casual Shirts &amp; Polos'],
  [/Bridal\s+Lehengas/gi, 'Denim Jackets &amp; Vests'],
  [/Party\s+(?:&|&amp;)\s+Festive/gi, 'Casual Shirts &amp; Polos'],
  [/Designer\s+Kurtas/gi, 'Oversized Graphic Tees'],
  [/Chanderi\s+Sets/gi, 'Oversized Hoodies'],
  [/Occasion\s+Wear/gi, 'Sneakers &amp; Kicks'],
  [/Contemporary\s+Streetwear/gi, 'Oversized Streetwear'],
  [/Ethnic\s+(?:&|&amp;)\s+Festive\s*\(\s*Secondary\s*\)/gi, 'Everyday Streetwear'],

  // Garment cuts / silhouettes
  [/One-Piece\s+Dress\s+(?:&|&amp;)\s+Angrakha/gi, 'Boxy Oversized Fits'],
  [/Angrakha\s+Wrap/gi, 'Boxy Drop-Shoulder'],
  [/Fit\s+(?:&|&amp;)\s+Flare\s+Maxi/gi, 'Straight Leg Baggy'],
  [/Kaftan\s+Tunic/gi, 'Relaxed Cargo Cut'],
  [/Tiered\s+Peplum/gi, 'Classic Regular'],
  [/Straight\s+Shift\s+Dress/gi, 'Cropped Boxy Tee'],
  [/Asymmetric\s+Hem/gi, 'Raw Hem Relaxed'],

  // Fabrics
  [/Pure\s+Paithani\s+Handloom/gi, 'French Terry Fleece'],
  [/Chanderi\s+Silk/gi, '240 GSM Combed Cotton'],
  [/Tussar\s+Raw\s+Silk/gi, 'Rigid Washed Denim'],
  [/Organza\s+Tissue/gi, 'Cotton Twill'],
  [/Mulmul\s+Cotton/gi, 'Heavyweight Jersey'],
  [/Modal\s+Satin/gi, 'Loopknit Cotton'],
  [/100%\s+Mulberry\s+Handloom/gi, '240 GSM Combed Cotton'],
  [/2\.5m\s+Tussar\s+Zari\s+Weave/gi, 'Heavy Cotton Twill'],

  // Tailoring references
  [/Doorstep\s+Tailoring\s+(?:&|&amp;)\s+Size\s+Swaps/gi, 'Doorstep Size Swaps &amp; Try-On'],
  [/Review\s+Tailoring\s+Specs\s+(?:&|&amp;)\s+Measurements/gi, 'Review Dispatch Specs &amp; Packaging'],
  [/Tailoring\s*\/\s*Packing/gi, 'Packing &amp; Dispatch'],
  [/doorstep\s+tailoring/gi, 'doorstep size swap'],
  [/tailor\s+bust/gi, 'studio mannequin'],

  // Care instructions
  [/Dry\s+Clean\s+Only\s*\(\s*Zari\s+Guard\s*\)/gi, 'Machine Wash Cold'],

  // Sizing (Bust -> Chest / Waist)
  [/Blouse\s+34["”]?,\s*Angrakha\s+38["”]?,\s*Kurta\s+M/gi, 'T-Shirt L, Hoodie XL, Jeans 32"'],
  [/Small\s*\(\s*Bust\s+36["”]?\s*\)/gi, 'Small (Chest 38")'],
  [/Medium\s*\(\s*Bust\s+38["”]?\s*\)/gi, 'Medium (Chest 40")'],
  [/Large\s*\(\s*Bust\s+40["”]?\s*\)/gi, 'Large (Chest 42")'],
  [/Extra\s+Large\s*\(\s*Bust\s+42["”]?\s*\)/gi, 'Extra Large (Chest 44")'],
  [/Bust\s+36["”]?/gi, 'Chest 38"'],
  [/Bust\s+38["”]?/gi, 'Chest 40"'],
  [/Bust\s+40["”]?/gi, 'Chest 42"'],
  [/Bust\s+42["”]?/gi, 'Chest 44"'],

  // QC & Zoom
  [/zari\s+weave\s+textures/gi, 'fabric knit, seam stitching, and graphic prints'],
  [/metallic\s+gold\s+zari\s+threadwork/gi, 'high-density puff print graphic artwork'],
  [/golden\s+zari\s+pallu/gi, 'heavyweight cotton wash'],
  [/golden\s+zari\s+embroidery/gi, 'clean seam finish and heavy fleece texture'],
  [/Banarasi\s+antique\s+zari\s+weave/gi, 'heavyweight cotton loopknit finish'],
  [/Zari\s+hemline\s+with\s+mother-of-pearl\s+potli\s+buttons/gi, 'Clean drop-shoulder hemline with reinforced collar'],
  [/Midnight\s+Zari/gi, 'Midnight Onyx Noir'],
  [/Extra-weft\s+Zari\s+Buti/gi, 'High-Density Puff Print'],
  [/pure\s+zari\s+cordwork/gi, 'clean double-needle seam finish'],
  [/Zari\s+Border/gi, 'Reinforced Hem'],
  [/zari\s+borders/gi, 'ribbed collar and cuffs'],

  // Word-boundary cleanses (ensuring no URL hashes are touched)
  [/\bPaithani\b/g, 'Heavyweight Streetwear'],
  [/\bSarees\b/g, 'Streetwear Drops'],
  [/\bsaree\b/gi, 'hoodie'],
  [/\bHandlooms\b/g, 'Streetwear Fits'],
  [/\bhandloom\b/gi, 'streetwear'],
  [/\bZari\b/g, 'Graphic'],
  [/\bzari\b/g, 'graphic'],
  [/\bAngrakhas\b/g, 'Tees & Hoodies'],
  [/\bangrakha\b/gi, 'heavyweight tee'],
  [/\bChanderi\b/g, 'Heavyweight Cotton'],
  [/\bchanderi\b/g, 'heavyweight cotton'],
  [/\bKurtas\b/g, 'Graphic Tees'],
  [/\bkurta\b/gi, 'streetwear tee'],
  [/\bDupattas\b/g, 'Casual Shirts'],
  [/\bdupatta\b/gi, 'jacket'],
  [/\bBridal\b/g, 'Streetwear'],
  [/\bbridal\b/g, 'streetwear'],
  [/\bTailoring\b/g, 'Dispatch'],
  [/\btailoring\b/g, 'dispatch'],
];

function cleanseString(str) {
  let s = str;
  for (const [regex, replacement] of PHRASES) {
    s = s.replace(regex, replacement);
  }
  return s;
}

// 1. Cleanse stitchScreens.json
const stitchScreensPath = path.join(rootDir, 'src', 'data', 'stitchScreens.json');
const stitchScreens = JSON.parse(fs.readFileSync(stitchScreensPath, 'utf8'));

let screensModified = 0;
for (const [screenKey, screen] of Object.entries(stitchScreens)) {
  if (!screen || !screen.html) continue;
  const original = screen.html;
  const cleansed = cleanseString(original);
  if (cleansed !== original) {
    screen.html = cleansed;
    screensModified++;
  }
}
fs.writeFileSync(stitchScreensPath, JSON.stringify(stitchScreens, null, 2), 'utf8');
console.log(`[Purify] stitchScreens.json: cleansed ${screensModified} screens.`);

// 2. Cleanse StitchProductIngestion.js
const ingestionPath = path.join(rootDir, 'src', 'stitch', 'StitchProductIngestion.js');
let ingestionContent = fs.readFileSync(ingestionPath, 'utf8');
ingestionContent = cleanseString(ingestionContent);
fs.writeFileSync(ingestionPath, ingestionContent, 'utf8');
console.log('[Purify] src/stitch/StitchProductIngestion.js cleansed.');

// 3. Cleanse StitchVendorRegister.js
const registerPath = path.join(rootDir, 'src', 'stitch', 'StitchVendorRegister.js');
let registerContent = fs.readFileSync(registerPath, 'utf8');
registerContent = cleanseString(registerContent);
fs.writeFileSync(registerPath, registerContent, 'utf8');
console.log('[Purify] src/stitch/StitchVendorRegister.js cleansed.');

// 4. Cleanse StitchScreenRenderer.js
const rendererPath = path.join(rootDir, 'src', 'components', 'StitchScreenRenderer.js');
let rendererContent = fs.readFileSync(rendererPath, 'utf8');
rendererContent = cleanseString(rendererContent);
fs.writeFileSync(rendererPath, rendererContent, 'utf8');
console.log('[Purify] src/components/StitchScreenRenderer.js cleansed.');

console.log('[Purify] Streetwear purification complete!');
