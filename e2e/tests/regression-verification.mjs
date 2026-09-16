import { chromium } from 'playwright';
import path from 'path';

const SCRATCH_DIR = '/Users/devdhapodkar/.gemini/antigravity-cli/brain/5fa5b47b-e067-4e85-8d82-c522b67d624e/scratch';

async function verifyRegression() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 ApolloQA/1.0',
  });

  const page = await context.newPage();

  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error(`[Browser Page Error] ${err.message}`);
  });

  console.log('=== REGRESSION TEST: NAVIGATING TO LIVE APP ===');
  await page.goto('https://www.kyapehnu.shop/app', { waitUntil: 'networkidle' });

  // 1. Check Push Notification console warning (Fix 4)
  const hasPushWarning = consoleLogs.some((l) => l.includes('[expo-notifications] Listening to push token changes'));
  console.log('\n--- CHECK 1: Push Notification Warning Guarded (Fix 4) ---');
  console.log('Has expo-notifications warning:', hasPushWarning);

  // Enter as guest
  const guestBtn = page.getByRole('button', { name: /(Explore Storefront as Guest|Browse Catalog as guest)/i }).first();
  await guestBtn.click();
  await page.waitForTimeout(2000);

  // 2. Check Empty Bag Courier Dispatch (Fix 3)
  console.log('\n--- CHECK 2: Empty Bag Courier Dispatch Display (Fix 3) ---');
  const bagLink = page.locator('[data-path*="bag"]:visible, nav a:has-text("Bag"):visible').first();
  await bagLink.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'regression_01_empty_bag.png') });

  const emptyBagText = await page.textContent('body');
  const emptyHas90 = emptyBagText.includes('Courier Dispatch') && emptyBagText.includes('₹90');
  const emptyHas0 = emptyBagText.includes('₹0') || emptyBagText.includes('Free') || emptyBagText.includes('Complimentary');
  console.log('Empty Bag has ₹90 courier dispatch:', emptyHas90);
  console.log('Empty Bag displays ₹0 / Free courier dispatch:', emptyHas0);

  // Return to Storefront
  const exploreBtn = page.locator('button:has-text("Explore Nagpur Collection"):visible, nav a:has-text("Storefront"):visible').first();
  await exploreBtn.click();
  await page.waitForTimeout(1500);

  // 3. Check PDP Price Consistency (Fix 1)
  console.log('\n--- CHECK 3: PDP Price Consistency (Fix 1) ---');
  const firstCard = page.locator('[aria-label*="₹"]:visible').first();
  const cardLabel = await firstCard.getAttribute('aria-label');
  console.log('Opening card:', cardLabel);
  await firstCard.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'regression_02_pdp.png') });

  const pdpText = await page.textContent('body');
  const hasOld4800 = pdpText.includes('₹4,800') || pdpText.includes('4,800');
  const hasOld6499 = pdpText.includes('₹6,499') || pdpText.includes('6,499');
  console.log('PDP contains outdated static ₹4,800:', hasOld4800);
  console.log('PDP contains outdated static ₹6,499:', hasOld6499);

  // Add to Bag
  const addBtn = page.locator('button:has-text("Add to Bag"):visible, button:has-text("Add to Atelier Bag"):visible').first();
  await addBtn.click();
  await page.waitForTimeout(1500);

  // 4. Check Bag with Item Courier Dispatch & handleCheckout error (Fix 2 & 3)
  console.log('\n--- CHECK 4: Bag with Item Courier Dispatch & handleCheckout (Fix 2 & 3) ---');
  await bagLink.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'regression_03_bag_with_item.png') });

  const bagItemText = await page.textContent('body');
  const bagItemHas90 = bagItemText.includes('₹90');
  const bagItemHasComplimentary = bagItemText.includes('Complimentary') || bagItemText.includes('FREE');
  console.log('Bag with Item (>= ₹1999) has ₹90 charge:', bagItemHas90);
  console.log('Bag with Item displays Complimentary/FREE for courier dispatch:', bagItemHasComplimentary);

  // Click Proceed to Delivery and check for handleCheckout error
  const checkoutBtn = page.locator('button:has-text("Proceed to Delivery"):visible, button:has-text("Add Delivery Address"):visible, button:has-text("Proceed to Checkout"):visible').first();
  const errorsBeforeClick = pageErrors.length;
  await checkoutBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'regression_04_address.png') });

  const errorsAfterClick = pageErrors.length;
  const newErrors = pageErrors.slice(errorsBeforeClick);
  console.log('New page errors on checkout click:', newErrors);
  console.log('handleCheckout ReferenceError thrown:', newErrors.some((e) => e.includes('handleCheckout')));

  // Check Address screen loaded successfully
  const nameInput = page.locator('#recipientName:visible, input[placeholder*="Name" i]:visible').first();
  console.log('Address screen reached successfully:', await nameInput.isVisible());

  await browser.close();
  console.log('\n=== REGRESSION TEST COMPLETE ===');
}

verifyRegression().catch((err) => {
  console.error('Regression Test Error:', err);
  process.exit(1);
});
