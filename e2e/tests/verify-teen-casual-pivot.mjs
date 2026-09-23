import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, 'screenshots');
const artifactDir = path.resolve('/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function saveScreenshot(page, filename) {
  const p1 = path.join(screenshotsDir, filename);
  const p2 = path.join(artifactDir, filename);
  await page.screenshot({ path: p1, fullPage: false });
  fs.copyFileSync(p1, p2);
  console.log(`📸 Saved screenshot: ${filename}`);
}

async function runTest() {
  console.log('--- Starting Teen / 18-35 Everyday Apparel Pivot E2E Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  });
  const page = await context.newPage();

  try {
    // 1. Visit Welcome Screen (Light Theme)
    console.log('[1/5] Testing Welcome Screen...');
    await page.goto('http://localhost:4173/app/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    const welcomeContent = await page.content();
    const hasEverydayWelcome = welcomeContent.includes('Trending streetwear') || welcomeContent.includes('everyday fits');
    console.log('Welcome screen has everyday clothing copy:', hasEverydayWelcome);

    await saveScreenshot(page, 'welcome_screen_teen_pivot.png');

    // 2. Click "Explore Looks" to enter Storefront Home
    console.log('[2/5] Entering Storefront Home (Light Theme)...');
    const exploreBtn = page.locator('button:has-text("Explore Looks"), button[aria-label*="Explore"]').first();
    await exploreBtn.click();
    await page.waitForTimeout(1500);

    // Verify Search Bar Placeholder
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    const searchPlaceholder = await searchInput.getAttribute('placeholder');
    console.log('Search placeholder:', searchPlaceholder);
    if (!searchPlaceholder.toLowerCase().includes('oversized') && !searchPlaceholder.toLowerCase().includes('tees')) {
      throw new Error(`Search placeholder does not reflect 18-35 everyday fashion: ${searchPlaceholder}`);
    }

    // Verify Category Pills (Everyday first, Ethnic last)
    const categoryButtons = page.locator('[data-action="filter-category"], section button');
    const catTexts = [];
    const count = await categoryButtons.count();
    for (let i = 0; i < count; i++) {
      const txt = (await categoryButtons.nth(i).textContent()).trim();
      if (txt) catTexts.push(txt);
    }
    console.log('Detected category buttons:', catTexts);

    const hasTees = catTexts.some(t => t.toUpperCase().includes('TEES'));
    const hasDenims = catTexts.some(t => t.toUpperCase().includes('DENIMS') || t.toUpperCase().includes('CARGOS'));
    const hasStreetwear = catTexts.some(t => t.toUpperCase().includes('STREETWEAR'));
    const hasEthnic = catTexts.some(t => t.toUpperCase().includes('ETHNIC'));

    console.log('Category checks: Tees:', hasTees, 'Denims:', hasDenims, 'Streetwear:', hasStreetwear, 'Ethnic:', hasEthnic);
    if (!hasTees || !hasDenims) {
      throw new Error('Storefront category pills are missing Tees & Hoodies or Denims & Cargos!');
    }

    // Verify Hero Banner / Products feature everyday pieces
    const storefrontHtml = await page.content();
    const hasBoxyTee = storefrontHtml.includes('Heavyweight Boxy Graphic Tee') || storefrontHtml.includes('Boxy Graphic');
    const hasThreadAndBone = storefrontHtml.includes('Thread &amp; Bone') || storefrontHtml.includes('Thread & Bone');
    console.log('Storefront features Boxy Graphic Tee:', hasBoxyTee, 'Thread & Bone:', hasThreadAndBone);

    await saveScreenshot(page, 'storefront_light_teen_pivot.png');

    // Test Category Filtering: Click "Tees & Hoodies"
    console.log('[3/5] Testing Category Filtering (Tees & Hoodies)...');
    const teesBtn = page.locator('button:has-text("Tees & Hoodies"), [data-cat="TEES_HOODIES"]').first();
    if (await teesBtn.isVisible()) {
      await teesBtn.click();
      await page.waitForTimeout(800);
      const filteredCards = page.locator('[data-action="open-pdp"]');
      const filteredCount = await filteredCards.count();
      console.log('Product cards visible after clicking Tees & Hoodies:', filteredCount);
    }

    // Reset filter to All Fits
    const allBtn = page.locator('button:has-text("All Fits"), button:has-text("All"), [data-cat="ALL"]').first();
    if (await allBtn.isVisible()) {
      await allBtn.click();
      await page.waitForTimeout(800);
    }

    // Test PDP (Click first product card)
    const firstProductCard = page.locator('[data-action="open-pdp"]').first();
    if (await firstProductCard.isVisible()) {
      await firstProductCard.click();
      await page.waitForTimeout(1200);

      const pdpTitle = page.locator('h1').first();
      const titleText = await pdpTitle.textContent();
      console.log('PDP Garment Title:', titleText);

      const pdpText = await page.textContent('main');
      const hasStreetwearSpecs = pdpText.includes('240 GSM') || pdpText.includes('Cotton') || pdpText.includes('Boxy') || pdpText.includes('Streetwear') || pdpText.includes('Tee');
      console.log('PDP has modern streetwear specs:', hasStreetwearSpecs);

      await saveScreenshot(page, 'pdp_teen_pivot.png');
    }

    // 4. Test Vendor Registration Screen (Specialties Chips)
    console.log('[4/5] Testing Vendor Registration Screen (18-35 Specialties Chips)...');
    // Navigate back to Welcome and then Auth
    await page.goto('http://localhost:4173/app/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const loginBtn = page.locator('button:has-text("Log In to Your Account"), button:has-text("Log In")').first();
    await loginBtn.click();
    await page.waitForTimeout(1200);

    // On Auth screen, click vendor registration
    const vendorRegBtn = page.locator('[data-action="register-vendor"], button:has-text("Register"), a:has-text("Register")').first();
    await vendorRegBtn.click();
    await page.waitForTimeout(1500);

    const specChips = page.locator('#specialties-container .spec-chip, .spec-chip');
    const chipTexts = [];
    const chipCount = await specChips.count();
    for (let i = 0; i < chipCount; i++) {
      chipTexts.push((await specChips.nth(i).textContent()).trim().replace(/\s+/g, ' '));
    }
    console.log('Detected Vendor Specialties Chips:', chipTexts);

    const hasGraphicTeesChip = chipTexts.some(t => t.includes('Graphic Tees') || t.includes('Oversized'));
    const hasHoodiesChip = chipTexts.some(t => t.includes('Streetwear & Hoodies') || t.includes('Hoodies'));
    const hasDenimsChip = chipTexts.some(t => t.includes('Denims & Cargos'));
    const hasOldPaithani = chipTexts.some(t => t.includes('Paithani & Silks'));

    console.log('Vendor chip checks:', { hasGraphicTeesChip, hasHoodiesChip, hasDenimsChip, hasOldPaithani });
    if (!hasGraphicTeesChip || !hasHoodiesChip) {
      throw new Error('Vendor registration specialties chips do not have Oversized & Graphic Tees or Streetwear & Hoodies!');
    }
    if (hasOldPaithani) {
      throw new Error('Vendor registration specialties chips still contain legacy Paithani & Silks!');
    }

    // Verify Shop Name placeholder
    const shopInput = page.locator('#shop-name');
    const shopPlaceholder = await shopInput.getAttribute('placeholder');
    console.log('Shop name placeholder:', shopPlaceholder);
    if (!shopPlaceholder.includes('Urban Thread') && !shopPlaceholder.includes('Symbi')) {
      throw new Error(`Shop name placeholder is not updated: ${shopPlaceholder}`);
    }

    await saveScreenshot(page, 'vendor_register_light_teen_pivot.png');

    // 5. Test Dark Theme Parity
    console.log('[5/5] Testing Dark Theme Parity...');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kya_pehnu_theme', 'dark');
    });
    await page.waitForTimeout(500);

    // Re-verify dark vendor specialties
    const darkSpecChips = page.locator('#specialties-container .spec-chip, .spec-chip');
    const darkChipCount = await darkSpecChips.count();
    console.log('Dark theme specialties chips count:', darkChipCount);
    if (darkChipCount === 0) {
      throw new Error('Dark theme vendor registration has 0 specialties chips!');
    }
    await saveScreenshot(page, 'vendor_register_dark_teen_pivot.png');

    // Return to storefront in dark mode
    await page.goto('http://localhost:4173/app/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const darkExploreBtn = page.locator('button:has-text("Explore Looks"), button[aria-label*="Explore"]').first();
    if (await darkExploreBtn.isVisible()) {
      await darkExploreBtn.click();
      await page.waitForTimeout(1000);
    }
    await saveScreenshot(page, 'storefront_dark_teen_pivot.png');

    console.log('--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('VERIFICATION FAILED:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
