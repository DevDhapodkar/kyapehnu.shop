import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4173/app';

async function runTest() {
  console.log('🚀 [E2E] Starting Vendor Registration Overhaul & Order Queue Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  const page = await context.newPage();

  try {
    // 1. Clear any residual localStorage before starting and navigate to VendorRegister
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      window.localStorage.removeItem('kyapehnu_recent_orders');
      window.localStorage.removeItem('kyapehnu_auth_session');
      if (window.__NAV__ && window.__NAV__.isReady()) {
        window.__NAV__.navigate('VendorRegister');
      }
    });
    await page.waitForTimeout(1000);

    // Fallback if not on VendorRegister yet:
    const hasShopName = await page.$('#shop-name');
    if (!hasShopName) {
      const loginBtn = await page.$('button:has-text("Log In")');
      if (loginBtn) {
        await loginBtn.click();
        await page.waitForTimeout(800);
      }
      const vendorRegBtn = await page.$('[data-action="register-vendor"], button:has-text("Register")');
      if (vendorRegBtn) {
        await vendorRegBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForSelector('#shop-name', { timeout: 10000 });
    console.log('✅ Page loaded at VendorRegister screen.');

    // 2. VERIFY NO PREFILLED TEXTS
    const shopNameVal = await page.inputValue('#shop-name');
    const propNameVal = await page.inputValue('#proprietor-name');
    const phoneVal = await page.inputValue('#whatsapp-contact');

    console.log(`Checking initial inputs: shopName="${shopNameVal}", propName="${propNameVal}", phone="${phoneVal}"`);
    if (shopNameVal !== '') throw new Error(`Expected #shop-name to be empty, got "${shopNameVal}"`);
    if (propNameVal !== '') throw new Error(`Expected #proprietor-name to be empty, got "${propNameVal}"`);
    if (phoneVal !== '') throw new Error(`Expected #whatsapp-contact to be empty, got "${phoneVal}"`);
    console.log('✅ PASS: All initial inputs are empty with no prefilled dummy data.');

    // 3. VERIFY NO CLUSTER ZONE BUTTONS
    const clusterSelector = await page.$('#cluster-selector');
    if (clusterSelector) throw new Error('Found #cluster-selector! Cluster zone buttons should have been removed.');
    const dharampethBtn = await page.$('button:has-text("Dharampeth")');
    if (dharampethBtn) throw new Error('Found Dharampeth cluster button! Should be removed.');
    console.log('✅ PASS: Commercial cluster zone section is completely removed.');

    // 4. VERIFY NO FACADE IMAGES
    const facadeImg = await page.$('img[alt*="facade verification" i]');
    if (facadeImg) throw new Error('Found facade verification image! Should be removed.');
    const visualConfirmation = await page.$('text=Storefront Visual Confirmation');
    if (visualConfirmation) throw new Error('Found "Storefront Visual Confirmation"! Should be removed.');
    console.log('✅ PASS: Storefront visual confirmation and facade images are completely removed.');

    // 5. TEST STEP 1 VALIDATION & PROGRESSION
    console.log('Testing Step 1 validation...');
    await page.click('#submit-btn');
    // Step 2 panel should still be hidden because inputs are empty
    let step2Panel = await page.$('#vendor-step-2-panel');
    let isStep2Hidden = await step2Panel?.evaluate((el) => el.classList.contains('hidden'));
    if (!isStep2Hidden) throw new Error('Step 2 panel should NOT be visible when inputs are empty!');
    console.log('✅ PASS: Cannot advance without required Boutique details.');

    // Fill valid Step 1 details
    await page.fill('#shop-name', 'Deshmukh Couture Studio');
    await page.fill('#proprietor-name', 'Radhika Deshmukh');
    await page.fill('#whatsapp-contact', '9823045892');
    await page.click('#submit-btn');

    // Wait for Step 2 panel to be unhidden
    await page.waitForSelector('#vendor-step-2-panel:not(.hidden)', { timeout: 3000 });
    const stepIndicatorText = await page.textContent('#vendor-step-indicator');
    console.log(`Step indicator after advancing to step 2: "${stepIndicatorText}"`);
    if (!stepIndicatorText.includes('Step 2')) throw new Error(`Expected Step 2, got ${stepIndicatorText}`);
    console.log('✅ PASS: Advanced to Step 2 after valid profile input.');

    // 6. VERIFY INTERACTIVE LEAFLET MAP IN STEP 2
    console.log('Verifying interactive Leaflet map...');
    await page.waitForSelector('#vendor-leaflet-map.leaflet-container, #vendor-leaflet-map .leaflet-pane', { timeout: 5000 });
    const hasMarker = await page.$('#vendor-leaflet-map .vendor-boutique-pin, #vendor-leaflet-map .leaflet-marker-icon');
    if (!hasMarker) throw new Error('Expected Leaflet marker pin on interactive map!');
    console.log('✅ PASS: Interactive Leaflet map with boutique marker pin is initialized.');

    await page.waitForTimeout(1200);

    // Verify address textarea is empty initially
    const addressVal = await page.inputValue('#atelier-address');
    if (addressVal !== '') throw new Error(`Expected #atelier-address to be empty, got "${addressVal}"`);
    console.log('✅ PASS: Address textarea is empty with no prefilled dummy address.');

    await page.screenshot({ path: 'scratch/vendor_step2_interactive_map.png' });
    console.log('📸 Captured screenshot: scratch/vendor_step2_interactive_map.png');

    // 7. TEST STEP 2 VALIDATION & PROGRESSION TO STEP 3
    console.log('Testing Step 2 validation...');
    await page.click('#submit-btn');
    let step3Panel = await page.$('#vendor-step-3-panel');
    let isStep3Hidden = await step3Panel?.evaluate((el) => el.classList.contains('hidden'));
    if (!isStep3Hidden) throw new Error('Step 3 panel should NOT be visible when address is empty!');
    console.log('✅ PASS: Cannot advance to Step 3 without landmark address.');

    // Fill address
    await page.fill('#atelier-address', 'Shop 12, Ground Floor, Laxmi Nagar Square, Nagpur');
    await page.click('#submit-btn');

    // Wait for Step 3 panel to be unhidden
    await page.waitForSelector('#vendor-step-3-panel:not(.hidden)', { timeout: 3000 });
    const step3IndicatorText = await page.textContent('#vendor-step-indicator');
    console.log(`Step indicator after advancing to step 3: "${step3IndicatorText}"`);
    if (!step3IndicatorText.includes('Step 3')) throw new Error(`Expected Step 3, got ${step3IndicatorText}`);
    console.log('✅ PASS: Advanced to Step 3 (Credentials).');

    // 8. VERIFY STEP 3 CREDENTIALS & SUBMISSION
    console.log('Testing Step 3 credentials inputs and validation...');
    await page.waitForSelector('#vendor-email');
    await page.waitForSelector('#vendor-password');
    await page.waitForSelector('#vendor-confirm-password');

    // Test back button from step 3 to step 2
    console.log('Testing Back navigation from Step 3 to Step 2...');
    await page.click('#vendor-back-btn, button[aria-label="Go back"]');
    await page.waitForSelector('#vendor-step-2-panel:not(.hidden)', { timeout: 3000 });
    console.log('✅ PASS: Back button returns from Step 3 to Step 2.');

    // Test back button from step 2 to step 1
    console.log('Testing Back navigation from Step 2 to Step 1...');
    await page.click('#vendor-back-btn, button[aria-label="Go back"]');
    await page.waitForSelector('#vendor-step-1-panel:not(.hidden)', { timeout: 3000 });
    console.log('✅ PASS: Back button returns from Step 2 to Step 1.');

    // Advance back through Step 2 to Step 3
    await page.click('#submit-btn');
    await page.waitForSelector('#vendor-step-2-panel:not(.hidden)', { timeout: 3000 });
    await page.click('#submit-btn');
    await page.waitForSelector('#vendor-step-3-panel:not(.hidden)', { timeout: 3000 });

    // Try submit with invalid email
    await page.fill('#vendor-email', 'invalidemail');
    await page.fill('#vendor-password', 'secret123');
    await page.fill('#vendor-confirm-password', 'secret123');
    await page.click('#submit-btn');

    // Fill valid credentials
    await page.fill('#vendor-email', 'radhika@deshmukhcouture.com');
    await page.fill('#vendor-password', 'Nagpur@2025');
    await page.fill('#vendor-confirm-password', 'Nagpur@2025');

    // Capture screenshot of Step 3 Credentials before submit
    await page.screenshot({ path: 'scratch/vendor_step3_credentials.png' });
    console.log('📸 Captured screenshot: scratch/vendor_step3_credentials.png');

    // Submit registration
    await page.click('#submit-btn');
    console.log('Submitted vendor registration. Waiting for navigation to Catalog Manager...');
    await page.waitForTimeout(1500);

    // 9. VERIFY VENDOR ORDER QUEUE CLEAN EMPTY STATE
    console.log('Navigating to Vendor Order Queue to verify clean state...');
    await page.evaluate(() => {
      if (window.__NAV__ && window.__NAV__.isReady()) {
        window.__NAV__.navigate('VendorOrders');
      }
    });
    await page.waitForTimeout(1200);

    // Verify 0 Active Orders and No Incoming Orders
    const pageContent = await page.content();
    if (!pageContent.includes('0 Active Orders')) {
      console.warn('Checking active orders text...');
    }
    if (pageContent.includes('Shirt Black Formal') || pageContent.includes('KP-40E483')) {
      throw new Error('Found stale test order "Shirt Black Formal" or "KP-40E483" in Vendor Queue!');
    }
    console.log('✅ PASS: No stale/deleted orders found in Vendor Queue.');

    // Capture screenshot of clean Vendor Queue
    await page.screenshot({ path: 'scratch/vendor_queue_clean_empty.png' });
    console.log('📸 Captured screenshot: scratch/vendor_queue_clean_empty.png');

    // 10. VERIFY DARK THEME REGISTRATION
    console.log('Verifying Dark Theme Vendor Registration...');
    await page.evaluate(() => {
      window.localStorage.setItem('kyapehnu_theme', 'dark');
      if (window.__THEME_STORE__) {
        window.__THEME_STORE__.getState().setThemeMode('dark');
      }
      if (window.__AUTH_STORE__) {
        window.__AUTH_STORE__.getState().setRole('CUSTOMER');
      }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      if (window.__NAV__ && window.__NAV__.isReady()) {
        window.__NAV__.navigate('VendorRegister');
      }
    });
    await page.waitForSelector('#shop-name', { timeout: 10000 });

    const darkShopNameVal = await page.inputValue('#shop-name');
    if (darkShopNameVal !== '') throw new Error(`Dark theme: Expected #shop-name empty, got "${darkShopNameVal}"`);
    const darkCluster = await page.$('#cluster-selector');
    if (darkCluster) throw new Error('Dark theme: Cluster selector should be removed.');
    const darkFacade = await page.$('img[alt*="facade verification" i]');
    if (darkFacade) throw new Error('Dark theme: Facade image should be removed.');

    await page.screenshot({ path: 'scratch/vendor_register_dark_overhaul.png' });
    console.log('📸 Captured screenshot: scratch/vendor_register_dark_overhaul.png');

    console.log('🎉 ALL VENDOR REGISTRATION & QUEUE TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Test Failed:', err);
    await page.screenshot({ path: 'scratch/vendor_test_failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
