// scripts/verify-vendor-profile.mjs
import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:4173/app/';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('[Verify] Testing Vendor Profile Screen (Light & Dark)...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: {
      width: 412,
      height: 915,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  });

  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
    await delay(1200);

    // Switch to VENDOR role and navigate to VendorProfile
    await page.evaluate(() => {
      if (window.__AUTH_STORE__) {
        window.__AUTH_STORE__.getState().setRole('VENDOR');
      }
      if (window.__THEME_STORE__) {
        window.__THEME_STORE__.getState().setThemeMode('light');
      }
      if (window.__NAV__) {
        window.__NAV__.navigate('VendorProfile');
      }
    });
    await delay(1500);

    // Capture Light Mode top
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_vendor_profile_light_top.png') });
    console.log('[Verify] Saved verify_vendor_profile_light_top.png');

    // Scroll to bottom to verify WhatsApp card, sign out card, and bottom clearance
    await page.evaluate(() => {
      const scrollable = document.querySelector('div[style*="overflow"]') || window;
      scrollable.scrollBy(0, 1000);
    });
    await delay(800);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_vendor_profile_light_bottom.png') });
    console.log('[Verify] Saved verify_vendor_profile_light_bottom.png');

    // Switch to Dark Mode
    await page.evaluate(() => {
      if (window.__THEME_STORE__) {
        window.__THEME_STORE__.getState().setThemeMode('dark');
      }
    });
    await delay(1000);

    // Capture Dark Mode bottom
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_vendor_profile_dark_bottom.png') });
    console.log('[Verify] Saved verify_vendor_profile_dark_bottom.png');

    // Scroll back to top to capture Dark Mode top
    await page.evaluate(() => {
      const scrollable = document.querySelector('div[style*="overflow"]') || window;
      scrollable.scrollTo(0, 0);
    });
    await delay(800);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_vendor_profile_dark_top.png') });
    console.log('[Verify] Saved verify_vendor_profile_dark_top.png');

  } catch (err) {
    console.error('[Verify] Error:', err);
  } finally {
    await browser.close();
    console.log('[Verify] Vendor profile verification complete.');
  }
}

run();
