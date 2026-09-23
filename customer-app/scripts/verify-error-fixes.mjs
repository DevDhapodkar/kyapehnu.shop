// scripts/verify-error-fixes.mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:4173/app/';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('[Verify] Starting automated E2E verification of all error fixes...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=430,932'],
    defaultViewport: {
      width: 412,
      height: 915,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  });

  const page = await browser.newPage();
  const results = {};

  try {
    // -------------------------------------------------------------
    // Screen 1: Vendor Register
    // -------------------------------------------------------------
    console.log('[Verify] Testing Vendor Register...');
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle2' });
    await delay(1500);

    await page.evaluate(() => {
      if (window.__NAV__) {
        window.__NAV__.navigate('VendorRegister');
      }
    });
    await delay(1500);

    const regStep1Path = path.join(ARTIFACTS_DIR, 'verify_vendor_reg_step1.png');
    await page.screenshot({ path: regStep1Path, fullPage: false });
    console.log('[Verify] Saved verify_vendor_reg_step1.png');

    const regHtml = await page.content();
    results.regNoTraditional = !/paithani|angrakha|chanderi|handloom saree/i.test(regHtml);
    results.regHasStreetwear = /graphic tees|hoodies|denim|cargos|streetwear/i.test(regHtml);

    // -------------------------------------------------------------
    // Screen 2: Vendor Order Queue
    // -------------------------------------------------------------
    console.log('[Verify] Testing Vendor Order Queue...');
    await page.evaluate(() => {
      if (window.__NAV__) {
        window.__NAV__.navigate('VendorOrderList');
      }
    });
    await delay(1200);

    const orderQueuePath = path.join(ARTIFACTS_DIR, 'verify_vendor_order_queue.png');
    await page.screenshot({ path: orderQueuePath, fullPage: false });
    console.log('[Verify] Saved verify_vendor_order_queue.png');

    const orderQueueHtml = await page.content();
    results.queueNoTailoring = !/Tailoring\s*\/\s*Packing/i.test(orderQueueHtml);
    results.queueHasPacking = /Packing\s*(?:&|&amp;)\s*Dispatch/i.test(orderQueueHtml);

    // -------------------------------------------------------------
    // Screen 3: Vendor Catalogue Manager
    // -------------------------------------------------------------
    console.log('[Verify] Testing Vendor Catalogue Manager...');
    await page.evaluate(() => {
      if (window.__NAV__) {
        window.__NAV__.navigate('CatalogManager');
      }
    });
    await delay(1200);

    const catalogPath = path.join(ARTIFACTS_DIR, 'verify_vendor_catalog_manager.png');
    await page.screenshot({ path: catalogPath, fullPage: false });
    console.log('[Verify] Saved verify_vendor_catalog_manager.png');

    const catalogHtml = await page.content();
    results.catalogNoWeaves = !/All\s+Weaves|Angrakhas\s*&|Sarees\s*&/i.test(catalogHtml);
    results.catalogHasStreetwearTabs = /All Fits|Tees & Hoodies|Denims & Cargos/i.test(catalogHtml);

    // -------------------------------------------------------------
    // Screen 4: Product Ingestion (Light Mode)
    // -------------------------------------------------------------
    console.log('[Verify] Testing Product Ingestion (Light)...');
    await page.evaluate(() => {
      if (window.__THEME_STORE__) {
        window.__THEME_STORE__.getState().setThemeMode('light');
      }
      if (window.__NAV__) {
        window.__NAV__.navigate('ProductIngestion');
      }
    });
    await delay(1500);

    // Check publish button in light mode
    const publishBtnInfo = await page.evaluate(() => {
      const btn = document.getElementById('publishBtn');
      if (!btn) return { found: false };
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return {
        found: true,
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility,
        backgroundColor: style.backgroundColor,
        color: style.color,
        text: btn.textContent.trim(),
      };
    });
    console.log('[Verify] Publish button info (Light):', publishBtnInfo);
    results.publishBtnLight = publishBtnInfo;

    const ingestionLightPath = path.join(ARTIFACTS_DIR, 'verify_product_ingestion_light.png');
    await page.screenshot({ path: ingestionLightPath, fullPage: false });
    console.log('[Verify] Saved verify_product_ingestion_light.png');

    // Scroll down to test sticky header opacity & no bleed-through
    await page.evaluate(() => window.scrollBy(0, 500));
    await delay(600);
    const ingestionScrollPath = path.join(ARTIFACTS_DIR, 'verify_product_ingestion_scroll.png');
    await page.screenshot({ path: ingestionScrollPath, fullPage: false });
    console.log('[Verify] Saved verify_product_ingestion_scroll.png');

    // Scroll to bottom to view publish button in footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(600);
    const ingestionBottomPath = path.join(ARTIFACTS_DIR, 'verify_product_ingestion_bottom.png');
    await page.screenshot({ path: ingestionBottomPath, fullPage: false });
    console.log('[Verify] Saved verify_product_ingestion_bottom.png');

    // -------------------------------------------------------------
    // Screen 5: Product Ingestion (Dark Mode)
    // -------------------------------------------------------------
    console.log('[Verify] Testing Product Ingestion (Dark)...');
    await page.evaluate(() => {
      if (window.__THEME_STORE__) {
        window.__THEME_STORE__.getState().setThemeMode('dark');
      }
    });
    await delay(800);

    const ingestionDarkPath = path.join(ARTIFACTS_DIR, 'verify_product_ingestion_dark.png');
    await page.screenshot({ path: ingestionDarkPath, fullPage: false });
    console.log('[Verify] Saved verify_product_ingestion_dark.png');

    // -------------------------------------------------------------
    // Screen 6: Vendor Profile Screen (Light & Dark)
    // -------------------------------------------------------------
    console.log('[Verify] Testing Vendor Profile (Dark)...');
    await page.evaluate(() => {
      if (window.__NAV__) {
        window.__NAV__.navigate('VendorProfile');
      }
    });
    await delay(1200);

    // Scroll down to check bottom clearance
    await page.evaluate(() => window.scrollBy(0, 400));
    await delay(500);

    const profileDarkPath = path.join(ARTIFACTS_DIR, 'verify_vendor_profile_dark.png');
    await page.screenshot({ path: profileDarkPath, fullPage: false });
    console.log('[Verify] Saved verify_vendor_profile_dark.png');

    console.log('[Verify] Testing Vendor Profile (Light)...');
    await page.evaluate(() => {
      if (window.__THEME_STORE__) {
        window.__THEME_STORE__.getState().setThemeMode('light');
      }
    });
    await delay(800);

    const profileLightPath = path.join(ARTIFACTS_DIR, 'verify_vendor_profile_light.png');
    await page.screenshot({ path: profileLightPath, fullPage: false });
    console.log('[Verify] Saved verify_vendor_profile_light.png');

  } catch (err) {
    console.error('[Verify] Error during verification:', err);
  } finally {
    await browser.close();
    console.log('[Verify] Final verification results:', JSON.stringify(results, null, 2));
  }
}

run();
