import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const AUDIT_DIR = '/Users/devdhapodkar/Desktop/kyapehnu/stitch_screens/audit_captures';

if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Launching Puppeteer browser with Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  page.on('console', (msg) => {
    // console.log('[PAGE CONSOLE]', msg.text());
  });

  console.log('🌐 Loading http://localhost:3000/app...');
  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle2', timeout: 30000 });

  // 1. Splash Screen Dismissal
  await new Promise((r) => setTimeout(r, 2200));

  // If splash is still visible, click it to dismiss
  try {
    await page.evaluate(() => {
      const splash = document.querySelector('.fixed.inset-0.z-50, [id="coutureProgressBar"]');
      if (splash) splash.click();
    });
  } catch (e) {}

  await new Promise((r) => setTimeout(r, 1000));

  // 2. Storefront Home (Light)
  console.log('📸 [1/11] Capturing Storefront Home (Light)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '01_storefront_light.png') });

  // Verify key elements exist
  const homeChecks = await page.evaluate(() => {
    return {
      hasSearchInput: !!document.querySelector('input[placeholder*="designer prêt" i], input[type="text"]'),
      hasNagpurPromise: document.body.innerText.includes('Nagpur Instant Atelier') || document.body.innerText.includes('45-Min'),
      hasHeroCard: document.body.innerText.includes('Royal Chanderi Zari Set') || document.body.innerText.includes('View Piece'),
      hasNearestAteliers: document.body.innerText.includes('Nearest Ateliers') || document.body.innerText.includes('Studio Anamika'),
      hasHandpickedPret: document.body.innerText.includes('Handpicked Prêt') || document.body.innerText.includes('Paithani Silk Kurta'),
      hasArtisanProvenance: document.body.innerText.includes('Artisan Provenance') || document.body.innerText.includes('Gandhibagh Weaver'),
    };
  });
  console.log('   Storefront Light parity checks:', homeChecks);

  // 3. Open Product Detail
  console.log('👉 Navigating to Product Detail Screen...');
  await page.evaluate(() => {
    const viewPieceBtn = Array.from(document.querySelectorAll('button, a')).find((b) =>
      b.textContent.includes('View Piece') || b.textContent.includes('Paithani Silk')
    );
    if (viewPieceBtn) viewPieceBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('📸 [2/11] Capturing Product Detail (Light)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '02_product_detail_light.png') });

  // 4. Add to Bag & Open Bag
  console.log('👉 Adding to Bag & Navigating to Your Bag...');
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.includes('Add to Bag') || b.textContent.includes('Try at Home Now')
    );
    if (addBtn) addBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(() => {
    const bagNav = Array.from(document.querySelectorAll('nav a, nav button, [data-path*="bag"]')).find((b) =>
      b.textContent.includes('Bag')
    );
    if (bagNav) bagNav.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('📸 [3/11] Capturing Your Bag (Light)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '03_bag_light.png') });

  // 5. Navigate to Delivery Address
  console.log('👉 Navigating to Delivery Address...');
  await page.evaluate(() => {
    const proceedBtn = Array.from(document.querySelectorAll('button, a')).find((b) =>
      b.textContent.includes('Proceed to Nagpur Delivery') ||
      b.textContent.includes('Proceed') ||
      b.textContent.includes('Address')
    );
    if (proceedBtn) proceedBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('📸 [4/11] Capturing Delivery Address (Light)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '04_address_light.png') });

  // 6. Navigate to Live Tracking
  console.log('👉 Confirming Delivery & Navigating to Live Tracking...');
  await page.evaluate(() => {
    const confirmBtn = Array.from(document.querySelectorAll('button, a')).find((b) =>
      b.textContent.includes('Confirm') || b.textContent.includes('Place') || b.textContent.includes('Dispatch')
    );
    if (confirmBtn) confirmBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1500));
  console.log('📸 [5/11] Capturing Live Tracking (Light)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '05_tracking_light.png') });

  // 7. Navigate to My Orders
  console.log('👉 Navigating to My Orders (Atelier Edition)...');
  await page.evaluate(() => {
    const ordersNav = Array.from(document.querySelectorAll('nav a, nav button, [data-path*="orders"]')).find((b) =>
      b.textContent.includes('Orders')
    );
    if (ordersNav) ordersNav.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('📸 [6/11] Capturing My Orders (Light)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '06_orders_light.png') });

  // 8. Navigate to Profile and Toggle Dark Theme
  console.log('👉 Navigating to Profile & Settings...');
  await page.evaluate(() => {
    if (window.__NAV__) {
      window.__NAV__.navigate('Profile');
    }
  });
  await new Promise((r) => setTimeout(r, 1000));
  console.log('📸 [7/11] Capturing Profile & Settings (Light)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '07_profile_light.png') });

  console.log('👉 Toggling Dark Theme Suite...');
  await page.evaluate(() => {
    if (window.__THEME_STORE__) {
      window.__THEME_STORE__.getState().setThemeMode('dark');
    }
    if (window.__NAV__) {
      window.__NAV__.navigate('Home');
    }
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('📸 [8/11] Capturing Storefront Home (Dark)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '08_storefront_dark.png') });

  // 9. Product Detail (Dark)
  console.log('👉 Navigating to Product Detail (Dark)...');
  await page.evaluate(() => {
    if (window.__NAV__) {
      window.__NAV__.navigate('ProductDetail', { title: 'Chanderi Silk Angrakha', price: 4800 });
    }
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('📸 [9/11] Capturing Product Detail (Dark)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '09_product_detail_dark.png') });

  // 10. Switch to Vendor Desk (Vendor Order Queue)
  console.log('👉 Switching Role to Vendor Flow (Vendor Order Queue)...');
  await page.evaluate(() => {
    if (window.__AUTH_STORE__) {
      window.__AUTH_STORE__.getState().setRole('VENDOR');
    }
  });
  await new Promise((r) => setTimeout(r, 1500));
  console.log('📸 [10/11] Capturing Vendor Order Queue (Dark)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '10_vendor_queue_dark.png') });

  // 11. Catalogue Manager (Dark)
  console.log('👉 Navigating to Catalogue Manager (Dark)...');
  await page.evaluate(() => {
    if (window.__NAV__) {
      window.__NAV__.navigate('CatalogManager');
    }
  });
  await new Promise((r) => setTimeout(r, 1200));
  console.log('📸 [11/11] Capturing Catalogue Manager (Dark)...');
  await page.screenshot({ path: path.join(AUDIT_DIR, '11_catalog_dark.png') });

  await browser.close();
  console.log('🎉 AUDIT COMPLETE! All 11 parity captures saved to:', AUDIT_DIR);
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
