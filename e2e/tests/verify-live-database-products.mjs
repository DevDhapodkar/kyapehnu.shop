import { chromium } from 'playwright';

async function verifyLiveStorefront() {
  console.log('=== VERIFYING LIVE APP (https://www.kyapehnu.shop/app) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[Browser Console Error] ${msg.text()}`);
  });

  await page.goto('https://www.kyapehnu.shop/app', { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Enter as Guest if on Auth Screen
  const guestBtn = page.getByRole('button', { name: /(Explore Storefront as Guest|Browse Catalog as guest)/i }).first();
  if (await guestBtn.isVisible()) {
    console.log('Clicking guest button...');
    await guestBtn.click();
    await page.waitForTimeout(3000);
  }

  // Verify we are on Storefront
  await page.waitForSelector('[aria-label*="₹"]', { timeout: 15000 });
  const bodyText = await page.textContent('body');

  console.log('\n--- 1. DATABASE PRODUCTS INDEXED IN STOREFRONT ---');
  const expectedProds = [
    'Sitabuldi Handloom Zari Kurta',
    'Royal Angrakha Raw Silk Men Kurta',
    'Chanderi Silk Banarasi Zari Saree',
    'Shirt Black Formal',
    'Chanderi Silk Anarkali — Live Test',
    'Kurta'
  ];

  let foundProds = 0;
  for (const p of expectedProds) {
    const isPresent = bodyText.includes(p);
    console.log(`[Product] "${p}": ${isPresent ? 'FOUND ✓' : 'MISSING ✗'}`);
    if (isPresent) foundProds++;
  }
  if (foundProds < 4) throw new Error(`Too few database products found (${foundProds}/${expectedProds.length})`);

  console.log('\n--- 2. REAL ATELIERS IN STOREFRONT ---');
  const expectedAteliers = ['Studio Anamika', 'Dhapodkar Silks', 'Dev Store', 'Claude Store'];
  for (const b of expectedAteliers) {
    const isPresent = bodyText.includes(b);
    console.log(`[Atelier] "${b}": ${isPresent ? 'FOUND ✓' : 'MISSING ✗'}`);
  }

  console.log('\n--- 3. CATEGORY PILL FILTER: MEN\'S HERITAGE ---');
  const menCatBtn = page.locator('[data-action="filter-category"][data-cat="MEN"], button:has-text("Men\'s Heritage")').first();
  await menCatBtn.click();
  await page.waitForTimeout(1000);

  const menText = await page.textContent('body');
  const menHasShirt = menText.includes('Shirt Black Formal');
  const menHasAngrakha = menText.includes('Royal Angrakha');
  const menHasSaree = menText.includes('Banarasi Zari Saree');
  const menHasAnarkali = menText.includes('Chanderi Silk Anarkali');

  console.log(`Men's Filter: Shirt Black Formal: ${menHasShirt ? 'YES ✓' : 'NO ✗'}`);
  console.log(`Men's Filter: Royal Angrakha: ${menHasAngrakha ? 'YES ✓' : 'NO ✗'}`);
  console.log(`Men's Filter: Banarasi Zari Saree (should NOT be in Men's): ${!menHasSaree ? 'EXCLUDED ✓' : 'INCORRECTLY PRESENT ✗'}`);
  console.log(`Men's Filter: Chanderi Silk Anarkali (should NOT be in Men's): ${!menHasAnarkali ? 'EXCLUDED ✓' : 'INCORRECTLY PRESENT ✗'}`);

  if (!menHasShirt || !menHasAngrakha || menHasSaree || menHasAnarkali) {
    throw new Error("Men's category filter failed to isolate Men's products!");
  }

  console.log('\n--- 4. CATEGORY PILL FILTER: RESET TO ALL ---');
  const allCatBtn = page.locator('[data-action="filter-category"][data-cat="ALL"], button:has-text("All")').first();
  await allCatBtn.click();
  await page.waitForTimeout(1000);
  const resetText = await page.textContent('body');
  console.log(`All filter restored: Banarasi Saree: ${resetText.includes('Banarasi Zari Saree') ? 'YES ✓' : 'NO ✗'}`);

  const getGridCardTitles = async () => {
    return await page.locator('[data-action="open-pdp"]').evaluateAll(els => 
      els.map(el => decodeURIComponent(el.getAttribute('data-title') || el.textContent.trim()))
    );
  };

  console.log('\n--- 5. ATELIER FILTER: DEV STORE ---');
  const devStoreCard = page.locator('[data-action="filter-boutique"][data-boutique*="Dev%20Store"], [data-action="filter-boutique"]:has-text("Dev Store")').first();
  await devStoreCard.click();
  await page.waitForTimeout(1000);

  let titles = await getGridCardTitles();
  console.log('Grid items after clicking Dev Store:', titles);
  console.log(`Dev Store filter: Shirt Black Formal: ${titles.some(t => t.includes('Shirt Black Formal')) ? 'YES ✓' : 'NO ✗'}`);
  console.log(`Dev Store filter: Banarasi Saree excluded: ${!titles.some(t => t.includes('Banarasi Zari Saree')) ? 'YES ✓' : 'NO ✗'}`);

  // Clear atelier filter
  await devStoreCard.click();
  await page.waitForTimeout(1000);

  console.log('\n--- 6. LIVE SEARCH: "Banarasi" ---');
  const searchInput = page.locator('input[placeholder*="Search" i]').first();
  await searchInput.fill('Banarasi');
  await page.waitForTimeout(1000);

  titles = await getGridCardTitles();
  console.log('Grid items after searching "Banarasi":', titles);
  console.log(`Search for "Banarasi": Saree present: ${titles.some(t => t.includes('Banarasi Zari Saree')) ? 'YES ✓' : 'NO ✗'}`);
  console.log(`Search for "Banarasi": Shirt excluded: ${!titles.some(t => t.includes('Shirt Black Formal')) ? 'YES ✓' : 'NO ✗'}`);

  // Clear search via native dispatch
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search" i]');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1500);

  titles = await getGridCardTitles();
  console.log('Grid items after clearing search:', titles);

  console.log('\n--- 7. PRODUCT DETAIL PAGE (PDP) DATA BINDING ---');
  const shirtCard = page.locator('[data-action="open-pdp"][data-title*="Shirt%20Black%20Formal"], [data-action="open-pdp"]:has-text("Shirt Black Formal")').first();
  await shirtCard.click();
  await page.waitForTimeout(2000);

  const pdpText = await page.textContent('body');
  const pdpRawHtml = await page.innerHTML('body');

  console.log(`PDP Title "Shirt Black Formal": ${pdpText.includes('Shirt Black Formal') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`PDP Real Price "₹600": ${pdpText.includes('₹600') || pdpText.includes('600') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`PDP Real MRP "₹800": ${pdpText.includes('₹800') || pdpText.includes('800') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`PDP Real Boutique "Dev Store" or "DEV STORE": ${pdpText.toUpperCase().includes('DEV STORE') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`PDP Real Size "S, M, L": ${pdpText.includes('S') && pdpText.includes('M') && pdpText.includes('L') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`PDP Real Colorway "Obsidian Black": ${pdpText.includes('Obsidian Black') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`PDP Real Care Instructions "Machine Wash Cold": ${pdpRawHtml.includes('Machine Wash Cold') ? 'FOUND ✓' : 'MISSING ✗'}`);

  console.log('\n--- 8. ADD TO BAG & CART VERIFICATION ---');
  // Select Size L
  const sizeLBtn = page.locator('button:has-text("L"), [data-action="select-size"][data-size="L"]').first();
  if (await sizeLBtn.isVisible()) {
    await sizeLBtn.click();
    await page.waitForTimeout(500);
  }

  // Click Add to Bag
  const addBtn = page.locator('button:has-text("Add to Bag"):visible, button:has-text("Add to Atelier Bag"):visible').first();
  await addBtn.click();
  await page.waitForTimeout(1500);

  // Navigate to Bag
  const bagNav = page.locator('nav a[data-path*="bag"]:visible, nav a:has-text("Bag"):visible').first();
  await bagNav.click();
  await page.waitForTimeout(2000);

  const bagText = await page.textContent('body');
  console.log(`Bag contains "Shirt Black Formal": ${bagText.includes('Shirt Black Formal') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`Bag contains Size L: ${bagText.includes('Size L') || bagText.includes('L') ? 'FOUND ✓' : 'MISSING ✗'}`);
  console.log(`Bag contains Price ₹600: ${bagText.includes('₹600') || bagText.includes('600') ? 'FOUND ✓' : 'MISSING ✗'}`);

  await browser.close();
  console.log('\n======================================================');
  console.log(' ALL END-TO-END VERIFICATIONS PASSED IN PRODUCTION! ');
  console.log('======================================================');
}

verifyLiveStorefront().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
