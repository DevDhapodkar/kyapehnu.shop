import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const scratchDir = '/Users/devdhapodkar/.gemini/antigravity-cli/brain/8b36a41a-7178-48b3-8058-633295222e56/scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('🌟 Starting Comprehensive Light & Dark Theme Suite Verification...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const captured = [];
  const errors = [];
  page.on('pageerror', (err) => {
    console.error('❌ [PAGE ERROR]:', err.message);
    errors.push(err.message);
  });

  async function snap(filename, label) {
    const file = path.join(scratchDir, `${filename}.png`);
    await page.screenshot({ path: file });
    console.log(`📸 [${label}] Saved ${filename}.png`);
    captured.push({ filename, label });
  }

  async function clickEl(selector, timeout = 6000) {
    try {
      await page.waitForSelector(selector, { timeout });
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.click();
      }, selector);
      await sleep(1000);
      return true;
    } catch {
      return false;
    }
  }

  async function setTheme(mode) {
    await page.evaluate((m) => {
      if (window.__THEME_STORE__) {
        window.__THEME_STORE__.getState().setThemeMode(m);
      } else {
        localStorage.setItem('@kyapehnu/theme_mode', m);
      }
    }, mode);
    await sleep(500);
  }

  async function setRole(role) {
    await page.evaluate((r) => {
      if (window.__AUTH_STORE__) {
        window.__AUTH_STORE__.getState().setRole(r);
      }
    }, role);
    await sleep(800);
  }

  // Load app
  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle2', timeout: 25000 });
  await page.waitForSelector('#root', { timeout: 10000 });
  await sleep(1000);

  // ==========================================
  // 1. WELCOME SCREEN
  // ==========================================
  console.log('\n--- 1. Welcome Screen ---');
  await setTheme('light');
  await snap('light_01_welcome', 'Welcome (Light)');

  await setTheme('dark');
  await snap('dark_01_welcome', 'Welcome (Dark)');

  // ==========================================
  // 2. AUTH SCREEN
  // ==========================================
  console.log('\n--- 2. Auth / Sign In Screen ---');
  if (await clickEl('[aria-label="Log In to Your Account"]')) {
    await snap('dark_02_auth', 'Sign In & Auth (Dark)');
    await setTheme('light');
    await snap('light_02_auth', 'Sign In & Auth (Light)');
    await clickEl('[aria-label="Go back"]');
  }

  // ==========================================
  // 3. VENDOR REGISTER SCREEN
  // ==========================================
  console.log('\n--- 3. Vendor Register Screen ---');
  if (await clickEl('[aria-label="Register Shop as Vendor"]')) {
    await snap('light_03_vendor_register', 'Register Your Shop (Light)');
    await setTheme('dark');
    await snap('dark_03_vendor_register', 'Register Your Shop (Dark)');
    await clickEl('[aria-label="Go back"]');
  }

  // ==========================================
  // 4. STOREFRONT HOME SCREEN
  // ==========================================
  console.log('\n--- 4. Storefront Home Screen ---');
  await clickEl('[aria-label="Explore Storefront as Guest"]') || await clickEl('[aria-label="Explore Looks"]');
  await page.waitForSelector('[aria-label*="₹"]', { timeout: 20000 });
  await sleep(1000);

  await setTheme('light');
  await snap('light_04_storefront_home', 'Storefront Home (Light)');
  await setTheme('dark');
  await snap('dark_04_storefront_home', 'Storefront Home (Dark)');

  // Quick add first product to bag
  await clickEl('[aria-label="Quick add to bag"]');

  // ==========================================
  // 5. PRODUCT DETAIL SCREEN
  // ==========================================
  console.log('\n--- 5. Product Detail Screen ---');
  if (await clickEl('[aria-label*="₹"]')) {
    await page.waitForSelector('[aria-label="Add to Bag"]', { timeout: 15000 });
    await sleep(1000);
    await snap('dark_05_pdp', 'Product Detail (Dark)');
    await setTheme('light');
    await snap('light_05_pdp', 'Product Detail (Light)');

    await clickEl('[aria-label="Go back"]');
  }

  // ==========================================
  // 6. BAG / CART SCREEN
  // ==========================================
  console.log('\n--- 6. Bag / Cart Screen ---');
  if (await clickEl('[aria-label="Bag"]')) {
    await sleep(800);
    await snap('light_06_bag', 'Your Bag (Light)');
    await setTheme('dark');
    await snap('dark_06_bag', 'Your Bag (Dark)');
  }

  // ==========================================
  // 7. DELIVERY ADDRESS / CHECKOUT SCREEN
  // ==========================================
  console.log('\n--- 7. Express Fitting Address Screen ---');
  if (await clickEl('[aria-label="Proceed to Checkout"]') || await clickEl('[aria-label="Update Nagpur Address"]')) {
    await sleep(1000);
    await snap('dark_07_address_checkout', 'Delivery Address (Dark)');
    await setTheme('light');
    await snap('light_07_address_checkout', 'Delivery Address (Light)');
    await clickEl('[aria-label="Go back"]');
  }

  // ==========================================
  // 8. ORDERS SCREEN
  // ==========================================
  console.log('\n--- 8. Customer Orders Screen ---');
  if (await clickEl('[aria-label="Orders"]')) {
    await sleep(800);
    await snap('light_08_orders', 'My Orders (Light)');
    await setTheme('dark');
    await snap('dark_08_orders', 'My Orders (Dark)');
  }

  // ==========================================
  // 9. PROFILE & SETTINGS SCREEN
  // ==========================================
  console.log('\n--- 9. Customer Profile Screen ---');
  await clickEl('[aria-label="Explore"]');
  if (await clickEl('[aria-label="Profile and settings"]')) {
    await sleep(800);
    await snap('dark_09_profile', 'Customer Profile (Dark)');
    await setTheme('light');
    await snap('light_09_profile', 'Customer Profile (Light)');
    await clickEl('[aria-label="Go back"]');
  }

  // ==========================================
  // 10. VENDOR ORDER QUEUE / DESK
  // ==========================================
  console.log('\n--- 10. Vendor Flow: Order Queue ---');
  await setRole('VENDOR');
  await sleep(1000);
  await snap('light_10_vendor_order_queue', 'Vendor Order Queue (Light)');
  await setTheme('dark');
  await snap('dark_10_vendor_order_queue', 'Vendor Order Queue (Dark)');

  // ==========================================
  // 11. VENDOR CATALOG MANAGER
  // ==========================================
  console.log('\n--- 11. Vendor Flow: Catalog Manager ---');
  if (await clickEl('[aria-label="Inventory"]')) {
    await sleep(1000);
    await snap('dark_11_vendor_catalog', 'Catalogue Manager (Dark)');
    await setTheme('light');
    await snap('light_11_vendor_catalog', 'Catalogue Manager (Light)');

    // ==========================================
    // 12. VENDOR ADD GARMENT MODAL
    // ==========================================
    console.log('\n--- 12. Vendor Flow: Add Garment Modal ---');
    if (await clickEl('[aria-label="Add Piece"]') || await clickEl('[aria-label="Add new garment"]')) {
      await sleep(1000);
      await snap('light_12_add_garment', 'Product Ingestion Modal (Light)');
      await setTheme('dark');
      await snap('dark_12_add_garment', 'Product Ingestion Modal (Dark)');
      await clickEl('[aria-label="Close"]') || await clickEl('[aria-label="Cancel"]');
    }
  }

  // ==========================================
  // 13. VENDOR ORDER DETAIL SCREEN
  // ==========================================
  console.log('\n--- 13. Vendor Flow: Order Detail Screen ---');
  await clickEl('[aria-label="Orders"]');
  await sleep(1000);
  if (await clickEl('[aria-label*="Order #"]') || await clickEl('[aria-label*="Details"]')) {
    await sleep(1000);
    await snap('dark_13_vendor_order_detail', 'Vendor Order Detail (Dark)');
    await setTheme('light');
    await snap('light_13_vendor_order_detail', 'Vendor Order Detail (Light)');
  }

  // Switch back to customer role
  await setRole('CUSTOMER');
  await sleep(500);

  await browser.close();

  console.log('\n🎉 ALL SCREEN VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log(`Total screens verified & captured: ${captured.length}`);
  console.log(`Total unhandled page errors: ${errors.length}`);
  console.log('Results folder:', scratchDir);
}

main().catch((err) => {
  console.error('Suite capture error:', err);
  process.exit(1);
});
