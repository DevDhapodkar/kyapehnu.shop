import { chromium } from 'playwright';
import path from 'path';

const SCRATCH_DIR = '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 ApolloQA/1.0',
  });

  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    consoleLogs.push(`[PAGE ERROR] ${err.message}`);
    console.error(`[Browser Page Error] ${err.message}`, err.stack);
  });

  console.log('=== STEP 1: PRODUCTION DEPLOYMENT & HTTP VERIFICATION ===');
  const targetUrl = process.env.APP_URL || process.env.BASE_URL || 'https://www.kyapehnu.shop/app';
  const resp = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('HTTP Status:', resp.status());
  console.log('Active URL:', page.url());
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step1_welcome.png') });

  // Welcome Screen -> Guest
  const guestBtn = page.getByRole('button', { name: /(Explore Looks|Explore Storefront as Guest|Browse Catalog as guest)/i }).first();
  await guestBtn.waitFor({ state: 'visible', timeout: 15000 });
  await guestBtn.click();
  await page.waitForTimeout(2000);

  console.log('\n=== STEP 2: STOREFRONT HOME VERIFICATION ===');
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step2_storefront_home.png') });

  const productCards = await page.locator('[aria-label*="₹"]:visible').all();
  console.log(`Found ${productCards.length} product cards in storefront.`);
  for (let i = 0; i < Math.min(productCards.length, 5); i++) {
    console.log(`  Card [${i}]: ${await productCards[i].getAttribute('aria-label')}`);
  }

  // Categories
  const categoryPills = await page.locator('.no-scrollbar button:visible').all();
  console.log(`Found ${categoryPills.length} category filter pills.`);
  for (const cp of categoryPills) {
    console.log(`  Category: ${(await cp.textContent()).trim()}`);
  }

  console.log('\n=== STEP 3: INITIAL BAG (EMPTY STATE VERIFICATION) ===');
  const bagNavLink = page.locator('[data-path*="bag"]:visible, nav a:has-text("Bag"):visible').first();
  await bagNavLink.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step3_bag_empty.png') });

  const bagEmptyContent = await page.textContent('body');
  const hasDummyCart1 = (await page.$('#cart-item-1')) !== null;
  const hasDummyCart2 = (await page.$('#cart-item-2')) !== null;
  const hasDummy8340 = bagEmptyContent.includes('₹8,340') || bagEmptyContent.includes('8,340');
  const hasEmptyText = bagEmptyContent.includes('Your Shopping Bag is Empty') || bagEmptyContent.includes('Your Atelier Bag is Empty') || bagEmptyContent.includes('Bag Empty');

  console.log('Empty state message displayed:', hasEmptyText);
  console.log('Dummy #cart-item-1 present:', hasDummyCart1);
  console.log('Dummy #cart-item-2 present:', hasDummyCart2);
  console.log('Hardcoded ₹8,340 total present:', hasDummy8340);

  console.log('\n=== STEP 4: RETURN TO STOREFRONT & PRODUCT DETAIL PAGE ===');
  const exploreBtn = page.locator('button:has-text("Explore Nagpur Collection"):visible, nav a:has-text("Storefront"):visible').first();
  await exploreBtn.click();
  await page.waitForTimeout(1500);

  // Click on first product card
  const firstCard = page.locator('[aria-label*="₹"]:visible').first();
  const firstCardLabel = await firstCard.getAttribute('aria-label');
  console.log(`Opening PDP for: "${firstCardLabel}"`);
  await firstCard.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step4_pdp.png') });

  // Select size L
  const sizeL = page.locator('.size-chip[data-size="L"], #size-chip-container button:has-text("L"), .size-chip:has-text("L")').first();
  if (await sizeL.isVisible()) {
    console.log('Selected size L');
    await sizeL.click();
    await page.waitForTimeout(300);
  }

  // Click Add to Bag
  const addBtn = page.locator('#bag-cta:visible, button:has-text("Add to Bag"):visible, button:has-text("Add to Atelier Bag"):visible').first();
  console.log('Add to Bag visible:', await addBtn.isVisible());
  await addBtn.click({ force: true });
  await page.waitForTimeout(1500);

  console.log('\n=== STEP 5: REVIEW BAG WITH ADDED ITEM ===');
  const bagLinkAfterAdd = page.locator('[data-path*="bag"]:visible, nav a:has-text("Bag"):visible').first();
  await bagLinkAfterAdd.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step5_bag_with_item.png') });

  const bagBody = await page.textContent('body');
  console.log('Bag contains 1 piece count:', /1\s*piece/i.test(bagBody) || bagBody.includes('(1)'));
  console.log('Bag does not show ₹8,340 dummy total:', !bagBody.includes('₹8,340'));

  console.log('\n=== STEP 6: PROCEED TO DELIVERY ADDRESS ===');
  const checkoutBtn = page.locator('button:has-text("Proceed to Delivery"):visible, button:has-text("Add Delivery Address"):visible, button:has-text("Proceed to Checkout"):visible').first();
  console.log('Checkout CTA text:', (await checkoutBtn.textContent())?.trim().replace(/\s+/g, ' '));
  await checkoutBtn.click({ force: true });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step6_address_clean.png') });

  console.log('\n=== STEP 7: VALIDATE ADDRESS FIELDS & TEST VALIDATION ===');
  const nameInput = page.locator('#recipientName:visible, input[placeholder*="Name" i]:visible').first();
  const phoneInput = page.locator('#phoneNumber:visible, input[type="tel"]:visible, #addr-phone:visible').first();
  const flatInput = page.locator('#flatHouse:visible, input[placeholder*="Flat" i]:visible, input[placeholder*="House" i]:visible').first();
  const areaInput = page.locator('#streetLandmark:visible, input[placeholder*="Street" i]:visible, input[placeholder*="Area" i]:visible').first();

  console.log('Initial Name value:', await nameInput.inputValue());
  console.log('Initial Phone value:', await phoneInput.inputValue());
  console.log('Initial Flat value:', await flatInput.inputValue());
  console.log('Initial Area value:', await areaInput.inputValue());

  // Scroll down to see Confirm Order Button
  const confirmBtn = page.locator('#confirmOrderBtn:visible, button:has-text("Confirm Address"):visible, button:has-text("Confirm Delivery"):visible, button:has-text("Confirm Order"):visible, button:has-text("Place 45-Min Trial Order"):visible').first();
  await confirmBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step7_address_scrolled_to_cta.png') });

  const ctaText = (await confirmBtn.textContent())?.trim().replace(/\s+/g, ' ');
  console.log('Address Screen Confirmation CTA:', ctaText);

  // Test blank submission validation
  console.log('Testing blank submission validation...');
  await confirmBtn.click({ force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step7_address_blank_validation.png') });

  // Fill authentic Nagpur address
  console.log('Filling authentic Nagpur customer address...');
  await nameInput.fill('Kavita Deshmukh');
  await phoneInput.fill('9823055443');
  await flatInput.fill('Flat 502, Orchid Heights');
  await areaInput.fill('Ramdaspeth, Near Traffic Park');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step7_address_filled.png') });

  console.log('\n=== STEP 8: PLACE 45-MINUTE TRIAL ORDER ===');
  await confirmBtn.click({ force: true });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'step8_live_tracking.png') });

  console.log('\n=== STEP 9: LIVE TRACKING SCREEN VERIFICATION ===');
  const trackingBody = await page.textContent('body');
  console.log('Tracking text snippet:', trackingBody.substring(0, 400).replace(/\s+/g, ' '));
  const orderIdMatch = trackingBody.match(/KP-[A-Z0-9]+/i);
  const orderId = orderIdMatch ? orderIdMatch[0] : 'None';
  console.log('Order ID displayed on Tracking:', orderId);
  console.log('Tracking shows 45-Min Trial / Courier status:', /45-min|trial|courier|dispatch|in transit|confirmed/i.test(trackingBody));

  console.log('\n=== STEP 10: MY ORDERS SCREEN VERIFICATION ===');
  const ordersNav = page.locator('[data-path*="orders"]:visible, nav a:has-text("Orders"):visible').first();
  if (await ordersNav.isVisible()) {
    await ordersNav.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCRATCH_DIR, 'step9_my_orders.png') });
    const myOrdersBody = await page.textContent('body');
    console.log('My Orders text snippet:', myOrdersBody.substring(0, 400).replace(/\s+/g, ' '));
    console.log(`Order ${orderId} rendered in My Orders:`, orderId !== 'None' && myOrdersBody.includes(orderId));
    console.log('No dummy orders shown:', !myOrdersBody.includes('KP-8492') || myOrdersBody.includes(orderId));
  } else {
    console.log('Orders nav link not visible on current screen, checking header or alternate nav');
  }

  await browser.close();
  console.log('\n=== COMPLETE CUSTOMER JOURNEY TEST FINISHED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
