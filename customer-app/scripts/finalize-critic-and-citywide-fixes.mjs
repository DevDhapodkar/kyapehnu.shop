import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const customerAppDir = path.resolve(__dirname, '..');

const stitchScreensPath = path.join(customerAppDir, 'src/data/stitchScreens.json');
const stitchRendererPath = path.join(customerAppDir, 'src/components/StitchScreenRenderer.js');
const stitchAuthPath = path.join(customerAppDir, 'src/stitch/StitchAuth.js');
const stitchRawJsxPath = path.join(customerAppDir, 'src/stitch/stitchRawJsx.json');

console.log('🚀 Finalizing comprehensive Critic & Citywide Nagpur updates...');

// ============================================================================
// 1. UPDATE stitchScreens.json
// ============================================================================
if (fs.existsSync(stitchScreensPath)) {
  const screens = JSON.parse(fs.readFileSync(stitchScreensPath, 'utf8'));

  for (const [key, screen] of Object.entries(screens)) {
    if (!screen.html) continue;
    let h = screen.html;

    // A. Remove any lingering Dharampeth/Sitabuldi restrictions & hardcoded badges
    h = h.replace(/Home · Sitabuldi/gi, 'Nagpur Home · Live');
    h = h.replace(/HOME · SITABULDI/g, 'NAGPUR HOME · LIVE');
    h = h.replace(/>Home · Sitabuldi</gi, '>Nagpur Home · Live<');
    h = h.replace(/>Sitabuldi</g, '>Nagpur Home<');
    h = h.replace(/>Sitabuldi, Nagpur</g, '>Nagpur<');
    h = h.replace(/Sitabuldi, Nagpur · 440012/g, 'Nagpur Central · 440001');
    h = h.replace(/SITABULDI, NAGPUR/g, 'NAGPUR EXPRESS');
    h = h.replace(/Sitabuldi Hub/gi, 'Nagpur Central Hub');
    h = h.replace(/SITABULDI HUB/g, 'NAGPUR CENTRAL HUB');
    h = h.replace(/Sitabuldi Main Road/gi, 'Central Nagpur Express Hub');
    h = h.replace(/Direct dispatch from Sitabuldi Luxury Vault/gi, 'Direct express dispatch from central Nagpur boutique hub');
    h = h.replace(/Consolidated pickup from Dharampeth &amp; Gandhibagh/gi, 'Express pickup from verified Nagpur boutiques');
    h = h.replace(/Consolidated pickup from Dharampeth & Gandhibagh/gi, 'Express pickup from verified Nagpur boutiques');
    h = h.replace(/Consolidated pickup from Dharampeth &amp; Gan\.\.\./gi, 'Express pickup from verified Nagpur boutiques');
    h = h.replace(/Consolidated pickup from Dharampeth & Gan\.\.\./gi, 'Express pickup from verified Nagpur boutiques');
    h = h.replace(/Thread &amp; Bone · Dharampeth/gi, 'Thread &amp; Bone · Nagpur Central');
    h = h.replace(/Thread & Bone · Dharampeth/gi, 'Thread & Bone · Nagpur Central');
    h = h.replace(/Dharampeth Boutique Studio/gi, 'Nagpur Boutique Studio');
    h = h.replace(/Dharampeth Boutique/gi, 'Nagpur Boutique');
    h = h.replace(/Dharampeth Handloom/gi, 'Nagpur Fashion Studio');
    h = h.replace(/Dharampeth Node 4/gi, 'Nagpur Node 4');
    h = h.replace(/Dharampeth Store 04/gi, 'Nagpur Store 04');
    h = h.replace(/Dharampeth · Order #KP-8902/gi, 'Nagpur Central · Order #KP-8902');
    h = h.replace(/Crossing Sitabuldi Flyover · 1\.8 km away/gi, 'En route via Nagpur express corridor · 1.8 km away');
    h = h.replace(/Crossing Sitabuldi Flyover/gi, 'En route via express corridor');
    h = h.replace(/Dispatched via Amravati Rd · Fast transit/gi, 'Dispatched across Nagpur express corridor');
    h = h.replace(/Dispatched via Amravati Rd/gi, 'Dispatched across Nagpur express corridor');
    h = h.replace(/Rider on Amravati Road · 0\.8 km from Dharampeth Studio/gi, 'Rider on express corridor · 0.8 km from boutique studio');
    h = h.replace(/Rider on Amravati Road · 0\.8 km from Dharampeth/gi, 'Rider on express corridor · 0.8 km from boutique');
    h = h.replace(/Rider on Amravati Road/gi, 'Rider on Nagpur express corridor');
    h = h.replace(/Home \(Sitabuldi\), Studio \(Dharampeth\)/gi, 'Home (Nagpur Central), Office (Civil Lines)');
    h = h.replace(/Dharampeth · Baggy Denims &amp; Flannels/gi, 'Nagpur Central · Baggy Denims & Flannels');
    h = h.replace(/Sitabuldi Silk/gi, 'Nagpur Streetwear');
    h = h.replace(/Dharampeth • 18 mins away/gi, 'Nagpur Central • 18 mins away');
    h = h.replace(/Sitabuldi • 22 mins away/gi, 'West Nagpur • 22 mins away');
    h = h.replace(/Sitabuldi \(2\.1 km\)/gi, 'Nagpur Central (2.1 km)');
    h = h.replace(/Near Variety Square, Sitabuldi, Nagpur/gi, 'Near Variety Square, Nagpur Central');
    h = h.replace(/data-location="Dharampeth to Sitabuldi, Nagpur, Maharashtra"/gi, 'data-location="Nagpur Citywide Express Delivery"');
    h = h.replace(/data-location="Dharampeth to Sitabuldi, Nagpur"/gi, 'data-location="Central Nagpur to Destination"');
    h = h.replace(/data-location="Sitabuldi, Nagpur, Maharashtra, India"/gi, 'data-location="Nagpur, Maharashtra, India"');
    h = h.replace(/data-location="Dharampeth, Nagpur, India"/gi, 'data-location="Nagpur, Maharashtra, India"');
    h = h.replace(/West High Court Road, Dharampeth/gi, 'West High Court Road, Nagpur');
    h = h.replace(/Connect your boutique racks with customers across Dharampeth, Civil Lines, and Sadar within 45 minutes\./gi, 'Connect your boutique racks with customers across all of Nagpur within 45 minutes.');

    // B. Vendor Registration text cleanup
    h = h.replace(/placeholder="e\.g\.\s*Urban Thread Co\.\s*\/\s*Symbi Merch"/g, 'placeholder="e.g. Urban Thread Co."');
    h = h.replace(/placeholder="e\.g\.\s*Aryan Sharma\s*\/\s*Dev D"/g, 'placeholder="e.g. Aryan Sharma"');
    h = h.replace(/e\.g\.\s*Urban Thread Co\.\s*\/\s*Symbi Merch/g, 'e.g. Urban Thread Co.');
    h = h.replace(/e\.g\.\s*Aryan Sharma\s*\/\s*Dev D/g, 'e.g. Aryan Sharma');
    h = h.replace(/Zero inventory lock-in\s*•\s*45-min White Glove Porter:/g, 'Zero inventory lock-in · 45-min Porter Dispatch:');
    h = h.replace(/Zero inventory lock-in\s*•\s*45-min White Glove Porter/g, 'Zero inventory lock-in · 45-min Porter Dispatch');

    // C. PDP Copy Pivot to Casuals / Streetwear
    h = h.replace(
      /Nestled in Dharampeth, Anamika's studio has revitalized traditional Vidarbha handloom silhouettes for three generations\. This piece directly supports master weavers in the Umred weaver colonies\./gi,
      "Based in central Nagpur, Thread & Bone crafts contemporary streetwear and premium casuals for Nagpur's fast-moving youth."
    );
    h = h.replace(
      /Our private valet waits at your doorstep for 15 minutes while you test the drape\. Keep only what feels tailored for you\./gi,
      'Our express courier waits at your doorstep for 15 minutes while you test the fit. Keep only what fits you best.'
    );

    // D. In Live Tracking Step Timeline: replace Tailored with Packed & Ready
    if (key.includes('Live_Tracking')) {
      h = h.replace(/>Tailored</g, '>Packed & Ready<');
      h = h.replace(/>TAILORED</g, '>PACKED & READY<');
      h = h.replace(/>Tailored\s*<\/span>/g, '>Packed & Ready</span>');
      h = h.replace(/>TAILORED\s*<\/span>/g, '>PACKED & READY</span>');
    }

    screen.html = h;
  }

  fs.writeFileSync(stitchScreensPath, JSON.stringify(screens, null, 2), 'utf8');
  console.log('✓ Successfully sanitized all screens in stitchScreens.json');
}

// ============================================================================
// 2. UPDATE StitchScreenRenderer.js
// ============================================================================
if (fs.existsSync(stitchRendererPath)) {
  let rendererCode = fs.readFileSync(stitchRendererPath, 'utf8');

  rendererCode = rendererCode.replace(
    /Convenient after-work express delivery across Sitabuldi, Dharampeth, Sadar &amp; Civil Lines\./g,
    'Convenient after-work express delivery across all of Nagpur.'
  );
  rendererCode = rendererCode.replace(
    /Nagpur express riders are currently active in Sitabuldi, Dharampeth &amp; Sadar\./g,
    'Nagpur express riders are currently active across all of Nagpur.'
  );
  rendererCode = rendererCode.replace(
    /New Paithani Collection Drop/g,
    'New Streetwear & Oversized Drops'
  );
  rendererCode = rendererCode.replace(
    /Nagpur Heritage weavers added 8 handcrafted zari drapes to the catalog\./g,
    'Verified Nagpur boutiques added 24 new streetwear tees & cargos to the catalog.'
  );
  rendererCode = rendererCode.replace(
    /Certified Handlooms of Gandhibagh &amp; Paithan/g,
    'Certified Garments & Fabrics across Nagpur'
  );
  rendererCode = rendererCode.replace(
    /100% natural mulberry silk authenticated by Central Silk Board of India\. Every drape includes an individual QR verification tag\./g,
    '100% genuine cottons, denims & fabrics authenticated with QR verification tag.'
  );
  rendererCode = rendererCode.replace(
    /Pure Gold &amp; Silver Zari Guarantee/g,
    'Premium GSM & Stitch Guarantee'
  );
  rendererCode = rendererCode.replace(
    /Tested and verified electroplated zari threads that preserve their lustrous sheen across generations\./g,
    'Heavyweight 240+ GSM combed cotton and reinforced stitching engineered for lasting everyday wear.'
  );
  rendererCode = rendererCode.replace(
    /Direct Weaver Provenance/g,
    'Direct Boutique Provenance'
  );
  rendererCode = rendererCode.replace(
    /Sourced straight from certified handloom clusters in Gandhibagh and Yeola-Paithan with zero intermediaries\./g,
    'Sourced straight from verified Nagpur boutique ateliers and creators with zero intermediaries.'
  );
  rendererCode = rendererCode.replace(
    /\$\{activeItemCount\} Garment\$\{activeItemCount > 1 \? 's' : ''\} · Sitabuldi Boutique/g,
    "${activeItemCount} Item${activeItemCount > 1 ? 's' : ''} · Verified Nagpur Boutique"
  );
  rendererCode = rendererCode.replace(
    /Personalized fit profile for tailored Nagpur fashion/g,
    'Personalized fit profile for curated Nagpur fashion'
  );

  fs.writeFileSync(stitchRendererPath, rendererCode, 'utf8');
  console.log('✓ Successfully sanitized StitchScreenRenderer.js');
}

// ============================================================================
// 3. UPDATE stitchRawJsx.json
// ============================================================================
if (fs.existsSync(stitchRawJsxPath)) {
  let rawJsx = fs.readFileSync(stitchRawJsxPath, 'utf8');
  rawJsx = rawJsx.replace(/e\.g\.\s*Urban Thread Co\.\s*\/\s*Symbi Merch/g, 'e.g. Urban Thread Co.');
  rawJsx = rawJsx.replace(/e\.g\.\s*Aryan Sharma\s*\/\s*Dev D/g, 'e.g. Aryan Sharma');
  rawJsx = rawJsx.replace(/Home · Sitabuldi/gi, 'Nagpur Home · Live');
  rawJsx = rawJsx.replace(/HOME · SITABULDI/g, 'NAGPUR HOME · LIVE');
  rawJsx = rawJsx.replace(/Dispatched via Amravati Rd/gi, 'Dispatched across Nagpur express corridor');
  rawJsx = rawJsx.replace(/Tailored/g, 'Packed');
  rawJsx = rawJsx.replace(/TAILORED/g, 'PACKED');
  fs.writeFileSync(stitchRawJsxPath, rawJsx, 'utf8');
  console.log('✓ Successfully sanitized stitchRawJsx.json');
}

console.log('🎉 All updates applied cleanly!');
