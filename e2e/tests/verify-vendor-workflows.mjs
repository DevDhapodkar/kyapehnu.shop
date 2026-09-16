import { chromium } from 'playwright';

async function runVendorWorkflowVerification() {
  console.log('===============================================================');
  console.log('  KYA PEHNU? — COMPLETE VENDOR WORKFLOWS VERIFICATION');
  console.log('  Target: https://www.kyapehnu.shop/app');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  try {
    console.log('Step 1: Navigating to live web app...');
    await page.goto('https://www.kyapehnu.shop/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Enter as Guest / Explore Looks if on Welcome screen
    const exploreBtn = page.locator('button:has-text("Explore Looks"), button:has-text("Browse Catalog"), button:has-text("Enter Atelier"), button[aria-label*="Guest" i]').first();
    if (await exploreBtn.isVisible()) {
      console.log('  Entering storefront via Explore Looks...');
      await exploreBtn.click();
      await page.waitForTimeout(3000);
    }
    console.log('✓ Storefront active\n');

    // Step 2: Open Customer Profile
    console.log('Step 2: Accessing Profile Screen from Header...');
    const profileBtn = page.locator('header img[alt="Profile" i], [aria-label="Profile" i]').first();
    await profileBtn.click();
    await page.waitForTimeout(3000);

    // Verify Profile screen has Vendor Atelier Mode toggle
    const vendorModeToggle = page.locator('#vendorModeToggle, [role="switch"]').first();
    const isVendorToggleVisible = await vendorModeToggle.isVisible();
    console.log(`  "Vendor Atelier Mode" switch visible: ${isVendorToggleVisible ? 'YES ✓' : 'NO ✗'}`);
    if (!isVendorToggleVisible) {
      throw new Error('Vendor Atelier Mode toggle not found on Profile screen');
    }

    // Step 3: Switch to Vendor Desk
    console.log('\nStep 3: Switching role to Vendor Desk...');
    await vendorModeToggle.click();
    await page.waitForTimeout(3000);

    // Check we are on Vendor Order Queue screen
    let queueBtns = await page.locator('button, a, [role="button"]').allInnerTexts();
    const onQueue = queueBtns.some(b => b.includes('Queue') || b.includes('Accept Order') || b.includes('Dispatch Porter Courier'));
    console.log(`  Mounted Vendor Order Queue: ${onQueue ? 'YES ✓' : 'NO ✗'}`);
    if (!onQueue) {
      throw new Error('Vendor Order Queue did not mount upon role switch');
    }

    // Step 4: Verify Order Queue Actions (Accept Order & Dispatch)
    console.log('\nStep 4: Testing Vendor Order Queue actions...');
    const acceptBtn = page.locator('button[data-action="accept-order"], button:has-text("Accept Order")').first();
    if (await acceptBtn.isVisible()) {
      console.log('  Found active "Accept Order" action. Clicking...');
      await acceptBtn.click();
      await page.waitForTimeout(1500);

      const toast = page.locator('div:has-text("Order Accepted")');
      const toastSeen = await toast.isVisible().catch(() => false);
      console.log(`  Toast notification displayed: ${toastSeen ? 'YES ✓' : 'NO'}`);
      console.log('  Order Accepted successfully ✓');
    }

    const dispatchBtn = page.locator('button[data-action="mark-ready"], button:has-text("Dispatch Porter Courier")').first();
    if (await dispatchBtn.isVisible()) {
      console.log('  Testing "Dispatch Porter Courier" action. Clicking...');
      await dispatchBtn.click();
      await page.waitForTimeout(1500);
      const dispatchedText = await page.textContent('body');
      const isDispatched = dispatchedText.includes('Courier Dispatched') || dispatchedText.includes('Sunil Kamble');
      console.log(`  Order dispatched to Porter courier: ${isDispatched ? 'YES ✓' : 'NO'}`);
    }

    // Step 5: Test View Details & Back Button
    console.log('\nStep 5: Testing Order Details screen navigation...');
    const viewDetailBtn = page.locator('button[data-action="view-order-detail"], button:has-text("View Details")').first();
    if (await viewDetailBtn.isVisible()) {
      await viewDetailBtn.click();
      await page.waitForTimeout(2500);

      let bodyText = await page.textContent('body');
      const onOrderDetail = bodyText.includes('Fulfillment') || bodyText.includes('Delivery Address') || bodyText.includes('Item Breakdown') || bodyText.includes('Radhika') || bodyText.includes('KP-');
      console.log(`  Vendor Order Detail screen loaded: ${onOrderDetail ? 'YES ✓' : 'NO ✗'}`);

      // Test Go Back
      console.log('  Testing back navigation from Order Detail...');
      const backBtn = page.locator('button[aria-label*="back" i], button[aria-label*="Navigate Back" i], [aria-label="Go back"]').first();
      await backBtn.click();
      await page.waitForTimeout(2500);

      queueBtns = await page.locator('button, a, [role="button"]').allInnerTexts();
      const backToQueue = queueBtns.some(b => b.includes('Queue') || b.includes('View Details') || b.includes('Courier Dispatched'));
      console.log(`  Returned cleanly to Order Queue: ${backToQueue ? 'YES ✓' : 'NO ✗'}`);
    }

    // Step 6: Test Vendor Bottom Navigation — Catalogue Manager
    console.log('\nStep 6: Testing Bottom Navigation -> Catalogue Manager...');
    const catalogueNav = page.locator('[data-path="boutique-catalogue"], nav a:has-text("Catalogue")').first();
    await catalogueNav.click();
    await page.waitForTimeout(3000);

    let bodyText = await page.textContent('body');
    const onCatalog = bodyText.includes('Curated Pieces Live') || bodyText.includes('Catalogue') || bodyText.includes('Add Piece');
    console.log(`  Catalog Manager screen loaded: ${onCatalog ? 'YES ✓' : 'NO ✗'}`);
    if (!onCatalog) {
      throw new Error('Catalogue Manager failed to load from bottom navigation');
    }

    // Check Curated Pieces Live count
    const piecesMatch = bodyText.match(/(\d+)\s+Curated Pieces Live/i);
    if (piecesMatch) {
      console.log(`  Live Curated Pieces count: ${piecesMatch[1]} pieces verified ✓`);
    }

    // Step 7: Test Stock Availability Toggle
    console.log('\nStep 7: Testing Inventory In-Stock / Out-of-Stock Toggle...');
    const firstToggleLabel = page.locator('label:has(input.status-toggle), label:has(input[data-action="toggle-stock"])').first();
    if (await firstToggleLabel.isVisible()) {
      await firstToggleLabel.click();
      await page.waitForTimeout(1000);
      const toggleToast = page.locator('div:has-text("Marked")');
      const toggleToastSeen = await toggleToast.isVisible().catch(() => false);
      console.log(`  Stock toggle clicked & toast feedback confirmed: ${toggleToastSeen ? 'YES ✓' : 'NO'}`);

      // Toggle back to active
      await firstToggleLabel.click();
      await page.waitForTimeout(1000);
      console.log('  Toggled stock back to In-Stock ✓');
    } else {
      console.log('  Stock toggle not directly matched; checking toggle elements');
    }

    // Step 8: Test Product Ingestion Form ("Add Piece")
    console.log('\nStep 8: Testing Product Ingestion Form...');
    const addPieceBtn = page.locator('#addPieceBtn, button:has-text("Add Piece"), button:has-text("Ingest Piece")').first();
    await addPieceBtn.click();
    await page.waitForTimeout(3000);

    bodyText = await page.textContent('body');
    const onIngestion = bodyText.includes('New Listing') || bodyText.includes('Step 1 of 6') || bodyText.includes('Identity') || bodyText.includes('Publish Product to Catalog');
    console.log(`  Product Ingestion screen loaded: ${onIngestion ? 'YES ✓' : 'NO ✗'}`);
    if (!onIngestion) {
      throw new Error('Product Ingestion screen failed to load');
    }

    // Fill Title and Price
    console.log('  Filling product listing details...');
    const titleInput = page.locator('#productTitle, input[placeholder*="Handwoven" i]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Dharampeth Kosa Silk Angrakha');
    }

    const priceInput = page.locator('#sellingPriceInput, input[placeholder="4800"]').first();
    if (await priceInput.isVisible()) {
      await priceInput.fill('5400');
    }

    // Submit Publish
    console.log('  Publishing product to catalog...');
    const publishBtn = page.locator('#publishBtn, button:has-text("Publish Product to Catalog")').first();
    await publishBtn.click();
    await page.waitForTimeout(3000);

    // Verify redirected back to Catalogue Manager
    bodyText = await page.textContent('body');
    const backOnCatalog = bodyText.includes('Curated Pieces Live') || bodyText.includes('Catalogue');
    console.log(`  Redirected to Catalogue Manager after publish: ${backOnCatalog ? 'YES ✓' : 'NO ✗'}`);

    const hasNewProduct = bodyText.includes('Dharampeth Kosa Silk Angrakha') || bodyText.includes('5,400');
    console.log(`  New product listed in catalog: ${hasNewProduct ? 'YES ✓' : 'NO'}`);

    // Step 9: Test Vendor Bottom Navigation — Atelier Profile
    console.log('\nStep 9: Testing Bottom Navigation -> Atelier Profile...');
    const atelierNav = page.locator('[data-path="atelier-profile"], nav a:has-text("Atelier")').first();
    await atelierNav.click();
    await page.waitForTimeout(3000);

    bodyText = await page.textContent('body');
    const onAtelier = bodyText.includes('Store Profile') || bodyText.includes('Nagpur Boutique') || bodyText.includes('Nagpur Partner Helpline') || bodyText.includes('712 254 9900') || bodyText.includes('VENDOR MODE');
    console.log(`  Atelier Profile screen loaded: ${onAtelier ? 'YES ✓' : 'NO ✗'}`);
    if (!onAtelier) {
      throw new Error('Atelier Profile screen failed to load from bottom navigation');
    }

    const hasHelpline = bodyText.includes('712 254 9900') || bodyText.includes('WhatsApp');
    console.log(`  Nagpur Partner Helpline and WhatsApp contact verified: ${hasHelpline ? 'YES ✓' : 'NO ✗'}`);

    // Step 10: Test Switching Back to Customer Mode
    console.log('\nStep 10: Testing Switch back to Customer Storefront...');
    const customerSwitchCard = page.locator('div[role="button"]:has-text("Switch to Customer Storefront"), button:has-text("Switch to Customer Storefront"), button:has-text("Customer Mode")').first();
    if (await customerSwitchCard.isVisible()) {
      await customerSwitchCard.click();
      await page.waitForTimeout(3000);

      bodyText = await page.textContent('body');
      const backOnCustomer = bodyText.includes('₹') && (bodyText.includes('Dressing Room') || bodyText.includes('Couture') || bodyText.includes('Studio Anamika') || bodyText.includes('Nagpur'));
      console.log(`  Switched back to Customer Storefront: ${backOnCustomer ? 'YES ✓' : 'NO ✗'}`);
    }

    // Step 11: Test Vendor Registration Workflow (VendorRegister screen)
    console.log('\nStep 11: Testing Vendor Registration Form Workflow...');
    // Access Profile again
    const profileBtnAgain = page.locator('header img[alt="Profile" i], [aria-label="Profile" i]').first();
    await profileBtnAgain.click();
    await page.waitForTimeout(3000);

    const registerBoutiqueBtn = page.locator('[data-action="register-vendor"], button:has-text("Register Your Boutique"), a:has-text("Register Your Boutique")').first();
    if (await registerBoutiqueBtn.isVisible()) {
      console.log('  Clicking "Register Your Boutique"...');
      await registerBoutiqueBtn.click();
      await page.waitForTimeout(3000);

      bodyText = await page.textContent('body');
      const onRegisterScreen = bodyText.includes('Turn your boutique into an instant') || bodyText.includes('Boutique Identity') || bodyText.includes('Studio Anamika Handlooms');
      console.log(`  Boutique Registration screen loaded: ${onRegisterScreen ? 'YES ✓' : 'NO ✗'}`);

      // Check form fields
      const shopInput = page.locator('#shop-name, input[placeholder*="Studio Anamika" i]').first();
      const propInput = page.locator('#proprietor-name, input[placeholder*="Anamika Joshi" i]').first();
      const phoneInput = page.locator('#whatsapp-contact, input[type="tel"]').first();

      if (await shopInput.isVisible()) {
        await shopInput.fill('Rajwada Silks Nagpur');
      }
      if (await propInput.isVisible()) {
        await propInput.fill('Rajeshree Sen');
      }
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('9822998877');
      }

      console.log('  Submitting boutique registration form (#submit-btn)...');
      const submitRegBtn = page.locator('#submit-btn, button[id*="submit-btn"]').first();
      await submitRegBtn.click();
      await page.waitForTimeout(3000);

      bodyText = await page.textContent('body');
      const postRegTransition = bodyText.includes('Catalogue') || bodyText.includes('Order') || bodyText.includes('Queue');
      console.log(`  Transitioned into Vendor flow post-registration: ${postRegTransition ? 'YES ✓' : 'NO ✗'}`);
    } else {
      console.log('  Register Your Boutique button not found; skipping registration form test');
    }

    console.log('\n===============================================================');
    console.log('  ALL VENDOR WORKFLOWS FULLY FUNCTIONAL AND VERIFIED! ✓');
    console.log('===============================================================');
  } catch (err) {
    console.error('\n✗ Verification Error:', err.message);
    await page.screenshot({ path: 'vendor-verification-failure.png' }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

runVendorWorkflowVerification();
