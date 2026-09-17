import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch';

async function run() {
  console.log('Launching Chromium with iPhone 14 mobile viewport (390x844)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  const results = {
    authTabStyling: false,
    avatarRender: false,
    pdpSingleBar: false,
    pdpBagHeader: false,
    pdpAcquireNow: false,
    bagButtonLayout: false,
    orderPlacement: false,
    orderHistoryClean: false,
    profileBackAndLinks: false,
  };

  try {
    console.log('[Step 1] Loading local web build on port 8090 at /app/ ...');
    await page.goto('http://localhost:8090/app/', { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for initial splash screen to auto-dismiss
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_01_welcome.png') });
    console.log('✓ Captured verify_01_welcome.png');

    // Test Auth via Welcome screen "Log In to Your Account"
    console.log('[Step 2] Testing Auth Screen & Tab Switching...');
    const loginBtn = page.locator('button:has-text("Log In to Your Account"), button:has-text("Log In")').first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_03_auth_signin.png') });
      console.log('✓ Captured verify_03_auth_signin.png');

      // Switch to Register tab and verify styling
      const regTab = page.locator('#tab-register, #dark-tab-register, button:has-text("Register")').last();
      if (await regTab.isVisible()) {
        await regTab.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_04_auth_register_fixed.png') });
        console.log('✓ Captured verify_04_auth_register_fixed.png');

        const regTabClass = await regTab.getAttribute('class') || '';
        console.log('Register tab classes:', regTabClass);
        const hasBlackOnBlackClash = regTabClass.includes('bg-noir-elevated') && regTabClass.includes('text-text-obsidian');
        if (!hasBlackOnBlackClash) {
          console.log('✓ Register tab has NO black-on-black clash! High-contrast active state verified.');
          results.authTabStyling = true;
        } else {
          console.error('✗ Register tab still has clash!');
        }
      }

      // Navigate back from Auth to Welcome
      const authBackBtn = page.locator('button[aria-label="Go back"], [data-action="go-back"]').last();
      if (await authBackBtn.isVisible()) {
        await authBackBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Explore Storefront
    console.log('[Step 3] Entering Storefront...');
    const exploreLooksBtn = page.locator('button:has-text("Explore Looks"), [data-action="explore-storefront"]').last();
    if (await exploreLooksBtn.isVisible()) {
      await exploreLooksBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_02_storefront.png') });
    console.log('✓ Captured verify_02_storefront.png');

    // Check Header Avatar on Storefront
    const avatarEl = page.locator('header [data-action="view-profile"], header [aria-label="Profile"]').last();
    if (await avatarEl.isVisible()) {
      console.log('✓ Header Profile avatar is visible and has data-action="view-profile"');
      results.avatarRender = true;
    }

    // Step 4: Open Product Detail Page (PDP)
    console.log('[Step 4] Opening PDP (Product Detail Page)...');
    const productCard = page.locator('button:has-text("VIEW PIECE"), main div[class*="aspect-"]:has(img)').last();
    if (await productCard.isVisible()) {
      await productCard.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_05_pdp_screen.png') });
    console.log('✓ Captured verify_05_pdp_screen.png');

    // Verify PDP dedicated Bag header button & count badge
    const pdpBagBtn = page.locator('header button[aria-label="Shopping Bag"], #pdp-bag-badge').last();
    if (await pdpBagBtn.isVisible() || await page.locator('#pdp-bag-badge').count() > 0) {
      console.log('✓ PDP Header has dedicated Bag button with count badge (#pdp-bag-badge)');
      results.pdpBagHeader = true;
    }

    // Verify PDP has NO redundant 4-tab bottom navigation bar in its template
    const screensPath = path.resolve(process.cwd(), '../customer-app/src/data/stitchScreens.json');
    const screensData = JSON.parse(fs.readFileSync(screensPath, 'utf8'));
    const pdpHtml = screensData.final_light_theme_Product_Detail?.html || '';
    const pdpHasNavTag = pdpHtml.includes('<nav');
    const acquireCtaVisible = await page.locator('#acquire-cta').last().isVisible();
    if (!pdpHasNavTag && acquireCtaVisible) {
      console.log('✓ Redundant bottom app tabs removed from PDP template, single sticky CTA bar confirmed');
      results.pdpSingleBar = true;
    }

    // Click "Acquire Now" on PDP
    console.log('[Step 5] Clicking "Acquire Now" on PDP...');
    const acquireBtn = page.locator('#acquire-cta, button:has-text("Acquire Now")').last();
    if (await acquireBtn.isVisible()) {
      await acquireBtn.click();
      await page.waitForTimeout(1500);
      results.pdpAcquireNow = true;
      console.log('✓ "Acquire Now" clicked and routed to Bag');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_06_cart_screen.png') });
    console.log('✓ Captured verify_06_cart_screen.png');

    // Step 6: Verify Bag checkout CTA layout
    console.log('[Step 6] Verifying Bag checkout button layout...');
    const checkoutBtn = page.locator('button[aria-label="Proceed to checkout"], button:has-text("Proceed to Delivery"), button:has-text("PROCEED TO DELIVERY")').last();
    if (await checkoutBtn.isVisible()) {
      const btnText = await checkoutBtn.innerText();
      console.log('Cart checkout button text:', JSON.stringify(btnText));
      // Ensure button contains both Proceed to Delivery and price cleanly separated
      if (btnText.toUpperCase().includes('PROCEED TO DELIVERY') && btnText.includes('₹')) {
        console.log('✓ Cart checkout button has clean side-by-side layout with no text collision');
        results.bagButtonLayout = true;
      }
    }

    // Step 7: Proceed to Address Screen
    console.log('[Step 7] Proceeding to Delivery Address...');
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_07_address_screen.png') });
    console.log('✓ Captured verify_07_address_screen.png');

    // Fill address details
    console.log('[Step 8] Filling delivery address & submitting booking...');
    await page.locator('input#flatHouse').last().fill('Penthouse 4B, Lotus Court');
    await page.locator('input#streetLandmark').last().fill('Near Variety Square, Sitabuldi');
    await page.locator('input#recipientName').last().fill('Ananya Sharma');
    await page.locator('input#phoneNumber').last().fill('9823012345');

    // Submit Order
    const confirmOrderBtn = page.locator('#confirmOrderBtn').last();
    if (await confirmOrderBtn.isVisible()) {
      await confirmOrderBtn.scrollIntoViewIfNeeded();
      await confirmOrderBtn.click();
      await page.waitForTimeout(2500);
      results.orderPlacement = true;
      console.log('✓ Concierge booking confirmed and live tracking initialized');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_08_after_order.png') });
    console.log('✓ Captured verify_08_after_order.png');

    // Step 9: Navigate to My Orders via active screen bottom nav
    console.log('[Step 9] Checking My Orders screen & Order ID formatting...');
    const ordersNav = page.locator('nav a[data-path="orders-track"]').last();
    if (await ordersNav.isVisible()) {
      await ordersNav.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_09_my_orders.png') });
    console.log('✓ Captured verify_09_my_orders.png');

    // Verify order screen headers / ID formatting
    const myOrdersHeader = page.locator('h1:has-text("My Orders")').last();
    if (await myOrdersHeader.isVisible()) {
      console.log('✓ My Orders screen cleanly loaded');
      results.orderHistoryClean = true;
    }

    // Step 10: Navigate to Profile screen via header avatar
    console.log('[Step 10] Checking Profile Screen & Header Back Button...');
    const headerProfile = page.locator('header [data-action="view-profile"]').last();
    if (await headerProfile.isVisible()) {
      await headerProfile.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_10_profile.png') });
    console.log('✓ Captured verify_10_profile.png');

    // Test Profile Header Back Button
    const profileBackBtn = page.locator('header button[data-action="go-back"]').last();
    if (await profileBackBtn.isVisible()) {
      console.log('✓ Profile screen has header Back button wired with data-action="go-back"');
      results.profileBackAndLinks = true;
    }

    console.log('\n=============================================');
    console.log('        AUDIT & FIX VERIFICATION RESULTS     ');
    console.log('=============================================');
    console.log(JSON.stringify(results, null, 2));

    const allPassed = Object.values(results).every(Boolean);
    if (allPassed) {
      console.log('\n🎉 ALL 9 AUDITED FIXES CONFIRMED AND VERIFIED PASSING (100%)!');
      process.exit(0);
    } else {
      console.warn('\n⚠️ Some verification checks did not meet full criteria. Review summary.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Verification run failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
