import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensPath = path.resolve(__dirname, '../src/data/stitchScreens.json');
const rawScreens = JSON.parse(fs.readFileSync(screensPath, 'utf8'));

console.log('Loaded stitchScreens.json with', Object.keys(rawScreens).length, 'screens');

// 1. Vendor Register Screens: Update specialties chips and placeholders
const lightSpecialties = `
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 shadow-sm flex items-center gap-1.5 bg-accent-crimson text-white shadow-crimson-glow/30 active:scale-95 cursor-pointer" data-active="true" type="button">
          <span class="material-symbols-outlined text-[14px]">check</span>
          Oversized &amp; Graphic Tees
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 shadow-sm flex items-center gap-1.5 bg-accent-crimson text-white shadow-crimson-glow/30 active:scale-95 cursor-pointer" data-active="true" type="button">
          <span class="material-symbols-outlined text-[14px]">check</span>
          Streetwear &amp; Hoodies
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-black/10 bg-white/70 hover:bg-white text-text-obsidian active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-text-ash">add</span>
          Denims &amp; Cargos
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-black/10 bg-white/70 hover:bg-white text-text-obsidian active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-text-ash">add</span>
          Casual Shirts &amp; Polos
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-black/10 bg-white/70 hover:bg-white text-text-obsidian active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-text-ash">add</span>
          Co-ords &amp; Dresses
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-black/10 bg-white/70 hover:bg-white text-text-obsidian active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-text-ash">add</span>
          Athleisure &amp; Gymwear
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-black/10 bg-white/70 hover:bg-white text-text-obsidian active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-text-ash">add</span>
          College &amp; Everyday Fits
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-black/10 bg-white/70 hover:bg-white text-text-obsidian active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-text-ash">add</span>
          Ethnic &amp; Festive (Secondary)
        </button>
`;

const darkSpecialties = `
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 shadow-sm flex items-center gap-1.5 bg-crimson text-white shadow-crimson/30 active:scale-95 cursor-pointer" data-active="true" type="button">
          <span class="material-symbols-outlined text-[14px]">check</span>
          Oversized &amp; Graphic Tees
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-200 shadow-sm flex items-center gap-1.5 bg-crimson text-white shadow-crimson/30 active:scale-95 cursor-pointer" data-active="true" type="button">
          <span class="material-symbols-outlined text-[14px]">check</span>
          Streetwear &amp; Hoodies
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-white/10 bg-noir-card/80 hover:bg-noir-elevated text-stone-200 active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-stone-400">add</span>
          Denims &amp; Cargos
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-white/10 bg-noir-card/80 hover:bg-noir-elevated text-stone-200 active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-stone-400">add</span>
          Casual Shirts &amp; Polos
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-white/10 bg-noir-card/80 hover:bg-noir-elevated text-stone-200 active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-stone-400">add</span>
          Co-ords &amp; Dresses
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-white/10 bg-noir-card/80 hover:bg-noir-elevated text-stone-200 active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-stone-400">add</span>
          Athleisure &amp; Gymwear
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-white/10 bg-noir-card/80 hover:bg-noir-elevated text-stone-200 active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-stone-400">add</span>
          College &amp; Everyday Fits
        </button>
        <button class="spec-chip px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border border-white/10 bg-noir-card/80 hover:bg-noir-elevated text-stone-200 active:scale-95 cursor-pointer" data-active="false" type="button">
          <span class="material-symbols-outlined text-[14px] text-stone-400">add</span>
          Ethnic &amp; Festive (Secondary)
        </button>
`;

['final_light_theme_Register_Your_Shop__Remastered_', 'Register_Your_Shop___Vendor_Desk'].forEach(key => {
  if (rawScreens[key]) {
    let h = rawScreens[key].html;
    h = h.replace(/<div class="flex flex-wrap gap-2 pt-1" id="specialties-container">[\s\S]*?<\/div>/i, `<div class="flex flex-wrap gap-2 pt-1" id="specialties-container">${lightSpecialties}</div>`);
    h = h.replace(/<div class="flex flex-wrap gap-2" id="specialties-container">[\s\S]*?<\/div>/i, `<div class="flex flex-wrap gap-2" id="specialties-container">${lightSpecialties}</div>`);
    h = h.replace(/placeholder="e\.g\.\s*Studio Anamika Handlooms"/g, 'placeholder="e.g. Urban Thread Co. / Symbi Merch"');
    h = h.replace(/placeholder="e\.g\.\s*Anamika Joshi"/g, 'placeholder="e.g. Aryan Sharma / Dev D"');
    h = h.replace(/Garment lines available for 45-min doorstep delivery/g, 'Everyday &amp; streetwear lines available for 45-min doorstep delivery');
    rawScreens[key].html = h;
    console.log('Updated', key);
  }
});

if (rawScreens['final_theme_dark_Register_Your_Shop']) {
  let h = rawScreens['final_theme_dark_Register_Your_Shop'].html;
  h = h.replace(/<div class="flex flex-wrap gap-2" id="specialties-container">[\s\S]*?<\/div>/i, `<div class="flex flex-wrap gap-2" id="specialties-container">${darkSpecialties}</div>`);
  h = h.replace(/placeholder="e\.g\.\s*Studio Anamika Handlooms"/g, 'placeholder="e.g. Urban Thread Co. / Symbi Merch"');
  h = h.replace(/placeholder="e\.g\.\s*Anamika Joshi"/g, 'placeholder="e.g. Aryan Sharma / Dev D"');
  h = h.replace(/Garment lines available for 45-min doorstep delivery/g, 'Everyday &amp; streetwear lines available for 45-min doorstep delivery');
  rawScreens['final_theme_dark_Register_Your_Shop'].html = h;
  console.log('Updated final_theme_dark_Register_Your_Shop');
}

// 2. Storefront Home Screens: Categories, hero banner, boutiques, outfits
const lightCategoryPills = `
      <button class="px-4 py-2 rounded-full bg-accent-crimson text-surface-porcelain font-eyebrow text-eyebrow uppercase tracking-wider font-semibold whitespace-nowrap shadow-sm">
        All Fits
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors">
        Tees &amp; Hoodies
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors">
        Denims &amp; Cargos
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors">
        Casual Shirts
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors">
        Co-ords &amp; Dresses
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors">
        Streetwear
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors">
        Athleisure
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-porcelain text-text-obsidian font-eyebrow text-eyebrow uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-ground-subtle transition-colors">
        Ethnic &amp; Festive
      </button>
`;

const darkCategoryPills = `
      <button class="px-4 py-2 rounded-full bg-secondary text-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold whitespace-nowrap shadow-sm">
        All Fits
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-surface-container transition-colors">
        Tees &amp; Hoodies
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-surface-container transition-colors">
        Denims &amp; Cargos
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-surface-container transition-colors">
        Casual Shirts
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-surface-container transition-colors">
        Co-ords &amp; Dresses
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-surface-container transition-colors">
        Streetwear
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-surface-container transition-colors">
        Athleisure
      </button>
      <button class="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-medium whitespace-nowrap shadow-sm hover:bg-surface-container transition-colors">
        Ethnic &amp; Festive
      </button>
`;

if (rawScreens['final_light_theme_Storefront_Home']) {
  let h = rawScreens['final_light_theme_Storefront_Home'].html;
  h = h.replace(/placeholder="Search (?:shirts, dresses, streetwear, kurtas, denim|designer prêt|designer wear|silk sarees)[^"]*"/gi, 'placeholder="Search oversized tees, hoodies, baggy denims, cargos, shirts..."');
  h = h.replace(/(<div class="flex items-center gap-2 overflow-x-auto px-gutter-md no-scrollbar">)[\s\S]*?(<\/div>\s*<\/section>)/i, `$1\n${lightCategoryPills}\n$2`);
  h = h.replace(/Royal Chanderi Zari Set/g, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/aria-label="Royal Chanderi Zari Set, ₹4,750"/g, 'aria-label="Heavyweight Boxy Graphic Tee, ₹1,299"');
  h = h.replace(/₹4,750/g, '₹1,299');
  h = h.replace(/₹6,400/g, '₹1,800');
  h = h.replace(/Dharampeth Boutique/g, 'Thread &amp; Bone · Sitabuldi');
  h = h.replace(/Nagpur Handloom District/g, 'Nagpur Fashion Hubs');
  h = h.replace(/Pankh Boutique/g, 'Urban Drift Co.');
  h = h.replace(/Sitabuldi · Paithani &amp; Organza/g, 'Dharampeth · Baggy Denims &amp; Flannels');
  h = h.replace(/Sadar · Menswear &amp; Royal Bandhgalas/g, 'Sadar · Co-ords &amp; Athleisure');
  h = h.replace(/Studio Anamika/g, 'Thread &amp; Bone');
  h = h.replace(/Dharampeth · Pure Zari &amp; Tussar Silk/g, 'Sitabuldi · Graphic Tees &amp; Hoodies');
  h = h.replace(/Paithani Silk Kurta/g, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/₹3,400/g, '₹1,299');
  h = h.replace(/₹4,200/g, '₹1,800');
  rawScreens['final_light_theme_Storefront_Home'].html = h;
  console.log('Updated final_light_theme_Storefront_Home');
}

if (rawScreens['final_theme_dark_Storefront_Home']) {
  let h = rawScreens['final_theme_dark_Storefront_Home'].html;
  h = h.replace(/placeholder="Search (?:shirts, dresses, streetwear, kurtas, denim|designer prêt|designer wear|silk sarees)[^"]*"/gi, 'placeholder="Search oversized tees, hoodies, baggy denims, cargos, shirts..."');
  h = h.replace(/(<div class="flex items-center gap-space-xs overflow-x-auto px-gutter no-scrollbar">)[\s\S]*?(<\/div>\s*<\/section>)/i, `$1\n${darkCategoryPills}\n$2`);
  h = h.replace(/Chanderi Silk Angrakha/g, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/Royal Chanderi Zari Set/g, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/aria-label="Chanderi Silk Angrakha, ₹4,800"/g, 'aria-label="Heavyweight Boxy Graphic Tee, ₹1,299"');
  h = h.replace(/₹4,800/g, '₹1,299');
  h = h.replace(/₹6,400/g, '₹1,800');
  h = h.replace(/Dharampeth Boutique/g, 'Thread &amp; Bone · Sitabuldi');
  h = h.replace(/Nagpur Handloom District/g, 'Nagpur Fashion Hubs');
  h = h.replace(/Pankh Boutique/g, 'Urban Drift Co.');
  h = h.replace(/Sitabuldi · Paithani &amp; Organza/g, 'Dharampeth · Baggy Denims &amp; Flannels');
  h = h.replace(/Sadar · Menswear &amp; Royal Bandhgalas/g, 'Sadar · Co-ords &amp; Athleisure');
  h = h.replace(/Studio Anamika/g, 'Thread &amp; Bone');
  h = h.replace(/Dharampeth · Pure Zari &amp; Tussar Silk/g, 'Sitabuldi · Graphic Tees &amp; Hoodies');
  h = h.replace(/Paithani Silk Kurta/g, 'Heavyweight Boxy Graphic Tee');
  h = h.replace(/₹3,400/g, '₹1,299');
  h = h.replace(/₹4,200/g, '₹1,800');
  rawScreens['final_theme_dark_Storefront_Home'].html = h;
  console.log('Updated final_theme_dark_Storefront_Home');
}

// 3. Product Detail Screens
['final_light_theme_Product_Detail', 'final_theme_dark_Product_Detail'].forEach(key => {
  if (rawScreens[key]) {
    let h = rawScreens[key].html;
    h = h.replace(/Chanderi Silk Angrakha/g, 'Heavyweight Boxy Graphic Tee');
    h = h.replace(/Chanderi Zari Silk Angrakha/g, 'Heavyweight Boxy Graphic Tee');
    h = h.replace(/₹4,800/g, '₹1,299');
    h = h.replace(/₹6,400/g, '₹1,800');
    h = h.replace(/₹6,499/g, '₹1,800');
    h = h.replace(/Studio Anamika/g, 'Thread &amp; Bone');
    h = h.replace(/Dharampeth Boutique/g, 'Sitabuldi Fashion Hub');
    h = h.replace(/Royal crimson cross-over tunic with intricate hand-loomed gold zari patti\./g, '240 GSM heavy combed cotton with drop shoulders and relaxed boxy drape.');
    h = h.replace(/Authentic Chanderi Silk Blend/g, '100% Combed Heavyweight Cotton');
    h = h.replace(/Woven with sheer gossamer texture, lightweight drape, and opulent golden luster\./g, 'Dense 240 GSM combed jersey with pre-shrunk vintage wash and soft hand feel.');
    h = h.replace(/Pure Metallic Zari Needlework/g, 'High-Density Screen Print');
    h = h.replace(/Artisan hand-applied bullion cord stitches along cuffs and the asymmetrical angrakha placket\./g, 'Durable cracked vintage graphic print with reinforced twin-needle stitching.');
    h = h.replace(/Specialist dry clean only\. Store draped inside the complimentary breathable muslin garment sleeve\./g, 'Machine wash cold with like colors. Tumble dry low. Do not iron directly on graphic print.');
    rawScreens[key].html = h;
    console.log('Updated', key);
  }
});

// 4. Product Ingestion Screens
['final_light_theme_Product_Ingestion___Catalog_Listing_Form', 'final_theme_dark_Product_Ingestion___Catalog_Listing_Form'].forEach(key => {
  if (rawScreens[key]) {
    let h = rawScreens[key].html;
    h = h.replace(/value="Chanderi Zari Silk Angrakha Set"/g, 'value="Heavyweight Boxy Graphic Tee"');
    h = h.replace(/placeholder="e\.g\.\s*Handwoven Organza Dupatta Kurta"/g, 'placeholder="e.g. Oversized Graphic Tee, Baggy Cargos"');
    h = h.replace(/Chanderi Silk/g, '240 GSM Combed Cotton');
    h = h.replace(/Pure Paithani Handloom/g, 'French Terry Fleece');
    h = h.replace(/Tussar Raw Silk/g, 'Rigid Washed Denim');
    h = h.replace(/Organza Tissue/g, 'Cotton Twill');
    h = h.replace(/Mulmul Cotton/g, 'Breezy Pure Linen');
    h = h.replace(/Modal Satin/g, 'Modal Rib Knit');
    h = h.replace(/Handloom Sarees/g, 'Denims &amp; Cargos');
    h = h.replace(/Men's Kurta &amp; Bandhgala/g, 'Casual Shirts &amp; Polos');
    h = h.replace(/Bridal &amp; Wedding Wear/g, 'Everyday Streetwear');
    rawScreens[key].html = h;
    console.log('Updated', key);
  }
});

// 5. Your Bag Screens
['final_light_theme_Your_Bag', 'final_theme_dark_Your_Bag'].forEach(key => {
  if (rawScreens[key]) {
    let h = rawScreens[key].html;
    h = h.replace(/Chanderi Silk Angrakha/g, 'Heavyweight Boxy Graphic Tee');
    h = h.replace(/Chanderi Zari Silk Angrakha/g, 'Heavyweight Boxy Graphic Tee');
    h = h.replace(/₹4,800/g, '₹1,299');
    h = h.replace(/₹6,400/g, '₹1,800');
    h = h.replace(/₹6,300/g, '₹1,299');
    h = h.replace(/₹8,340/g, '₹2,598');
    h = h.replace(/Studio Anamika/g, 'Thread &amp; Bone');
    rawScreens[key].html = h;
    console.log('Updated', key);
  }
});

// 6. My Orders Screens
['final_light_theme_My_Orders__Atelier_Edition_', 'My_Orders___Frosted_Glass___Ambient_Blobs', 'final_theme_dark_My_Orders'].forEach(key => {
  if (rawScreens[key]) {
    let h = rawScreens[key].html;
    h = h.replace(/Chanderi Zari Silk Angrakha/g, 'Heavyweight Boxy Graphic Tee');
    h = h.replace(/Chanderi Silk/g, 'Heavyweight Cotton');
    h = h.replace(/Hand-woven Raw Silk Dupatta/g, 'Vintage Baggy Skater Jeans');
    h = h.replace(/Paithani Border Silk Kurta/g, 'Vintage Drop-Shoulder Fleece Hoodie');
    h = h.replace(/Studio Anamika Handlooms/g, 'Thread &amp; Bone');
    h = h.replace(/Studio Anamika/g, 'Thread &amp; Bone');
    h = h.replace(/Pankh Boutique/g, 'Urban Drift Co.');
    h = h.replace(/₹4,750/g, '₹1,299');
    h = h.replace(/₹1,500/g, '₹2,199');
    h = h.replace(/₹3,400/g, '₹1,999');
    h = h.replace(/₹6,250/g, '₹3,498');
    rawScreens[key].html = h;
    console.log('Updated', key);
  }
});

fs.writeFileSync(screensPath, JSON.stringify(rawScreens, null, 2), 'utf8');
console.log('Successfully written updated stitchScreens.json!');
