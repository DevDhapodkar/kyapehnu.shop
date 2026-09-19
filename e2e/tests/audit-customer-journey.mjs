import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch';
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

async function audit() {
  const issues = [];
  const consoleLogs = [];
  const networkErrors = [];

  const browser = await chromium.launch({ headless: true });
  // Mobile device: iPhone 14 / Pixel 7 aspect ratio (393 x 852 or 412 x 915)
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 KyaPehnuAudit/1.0',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    geolocation: { latitude: 21.1458, longitude: 79.0882 }, // Nagpur coordinates
    permissions: ['geolocation'],
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });
    if (type === 'error') {
      console.log(`[Browser Console Error] ${text}`);
      issues.push({ category: 'CONSOLE_ERROR', detail: text });
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[Browser Page Error] ${err.message}`);
    issues.push({ category: 'PAGE_CRASH_OR_ERROR', detail: err.message });
  });

  page.on('requestfailed', (req) => {
    console.warn(`[Network Request Failed] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    networkErrors.push({ url: req.url(), error: req.failure()?.errorText });
  });

  console.log('>>> Navigating to https://www.kyapehnu.shop/app ...');
  const response = await page.goto('https://www.kyapehnu.shop/app', { waitUntil: 'networkidle', timeout: 45000 });
  console.log('HTTP Status:', response?.status());

  await page.screenshot({ path: path.join(SCRATCH_DIR, '01_initial_load.png'), fullPage: false });

  // Helper to record issue
  function report(category, title, detail) {
    issues.push({ category, title, detail });
    console.log(`[FOUND ISSUE] [${category}] ${title}: ${detail}`);
  }

  // 1. Audit Welcome Screen / Landing
  console.log('\n--- Auditing Welcome Screen ---');
  const title = await page.title();
  console.log('Page Title:', title);

  // Check dead buttons / links on current screen
  await auditDeadButtons(page, 'WelcomeScreen', report);

  // Check for broken images on welcome screen
  await auditBrokenImages(page, 'WelcomeScreen', report);

  // Check auth flow: switch to Register tab or Click Register
  const registerTab = page.locator('#tab-register, #dark-tab-register, button:has-text("Register"), button:has-text("Create an Account"), #link-switch-to-register, #dark-link-switch-to-register').first();
  if (await registerTab.isVisible()) {
    console.log('Clicking Register tab/link...');
    await registerTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '02_register_view.png') });

    // Try submitting empty register form to check validation
    const registerSubmit = page.locator('#btn-submit-register, #dark-btn-submit-register, button:has-text("Create Atelier Account")').first();
    if (await registerSubmit.isVisible()) {
      console.log('Testing empty register submission...');
      await registerSubmit.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCRATCH_DIR, '03_register_empty_submit.png') });

      // Now fill with test customer account
      const regNameInput = page.locator('#reg-name, #dark-reg-name, input[placeholder*="Radhika"]').first();
      const regPhoneInput = page.locator('#reg-phone, #dark-reg-phone, input[type="tel"]').first();
      const regEmailInput = page.locator('#reg-email, #dark-reg-email, input[type="email"]').first();
      const regPassInput = page.locator('#reg-password, #dark-reg-password, input[placeholder*="password" i]').first();

      const testPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
      const testEmail = `cust_${Date.now()}@nagpurfashion.in`;

      console.log(`Filling registration form: Name: Sameer Sharma, Phone: ${testPhone}, Email: ${testEmail}`);
      if (await regNameInput.isVisible()) await regNameInput.fill('Sameer Sharma');
      if (await regPhoneInput.isVisible()) await regPhoneInput.fill(testPhone);
      if (await regEmailInput.isVisible()) await regEmailInput.fill(testEmail);
      if (await regPassInput.isVisible()) await regPassInput.fill('Nagpur@2026!');

      await page.screenshot({ path: path.join(SCRATCH_DIR, '04_register_filled.png') });

      console.log('Submitting registration...');
      await registerSubmit.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: path.join(SCRATCH_DIR, '05_after_register_submit.png') });
    }
  } else {
    console.log('No register tab directly on landing, looking for guest or sign in...');
  }

  // If still on welcome screen or landing, explore storefront
  const guestBtn = page.getByRole('button', { name: /(Explore Storefront as Guest|Browse Catalog as guest|Explore Collection|Start Shopping)/i }).first();
  if (await guestBtn.isVisible()) {
    console.log('Clicking Explore Storefront as Guest...');
    await guestBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: path.join(SCRATCH_DIR, '06_storefront_home.png') });

  // 2. Audit Storefront Home
  console.log('\n--- Auditing Storefront Home ---');
  await auditDeadButtons(page, 'StorefrontHome', report);
  await auditBrokenImages(page, 'StorefrontHome', report);
  await auditVisualMisalignments(page, 'StorefrontHome', report);

  // Check Category filter pills
  const filterPills = await page.locator('button:visible').filter({ hasText: /All|Silk|Sherwani|Kurta|Bridal|Lehenga|Indo-Western|Menswear|Womenswear/i }).all();
  console.log(`Found ${filterPills.length} category filter pills.`);
  for (let i = 0; i < Math.min(filterPills.length, 4); i++) {
    const pillText = (await filterPills[i].textContent())?.trim();
    console.log(`Clicking category pill: "${pillText}"`);
    await filterPills[i].click();
    await page.waitForTimeout(800);
  }

  // Check product cards
  const productCards = await page.locator('[aria-label*="₹"]:visible, [data-product-id]:visible, .product-card:visible').all();
  console.log(`Found ${productCards.length} product cards in storefront.`);
  if (productCards.length === 0) {
    report('UI_EMPTY_STOREFRONT', 'No product cards found on storefront', 'Product cards locator returned 0 items');
  }

  // Click on first product to enter PDP
  console.log('\n--- Auditing Product Detail Page (PDP) ---');
  const firstCard = productCards[0] || page.locator('[aria-label*="₹"]:visible').first();
  if (await firstCard.isVisible()) {
    const cardLabel = await firstCard.getAttribute('aria-label');
    console.log('Clicking product card:', cardLabel);
    await firstCard.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '07_pdp_screen.png') });

    await auditDeadButtons(page, 'PDP', report);
    await auditBrokenImages(page, 'PDP', report);
    await auditVisualMisalignments(page, 'PDP', report);

    // Test size selectors
    const sizeButtons = await page.locator('button:visible').filter({ hasText: /^(S|M|L|XL|XXL|Free Size)$/i }).all();
    console.log(`Found ${sizeButtons.length} size buttons.`);
    if (sizeButtons.length > 0) {
      for (const sb of sizeButtons) {
        console.log('Testing size button:', (await sb.textContent())?.trim());
        await sb.click();
        await page.waitForTimeout(300);
      }
    }

    // Test "Add to Bag"
    const addToBagBtn = page.locator('button:has-text("Add to Bag"):visible, button:has-text("Add to Atelier Bag"):visible, #btn-add-to-bag:visible').first();
    if (await addToBagBtn.isVisible()) {
      console.log('Clicking Add to Bag CTA:', await addToBagBtn.textContent());
      await addToBagBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SCRATCH_DIR, '08_after_add_to_bag.png') });
    } else {
      report('PDP_MISSING_CTA', 'Add to Bag button missing on PDP', 'Could not locate Add to Bag button on PDP');
    }
  }

  // 3. Audit Atelier Bag (Cart Screen)
  console.log('\n--- Auditing Atelier Bag (Cart Screen) ---');
  const bagLink = page.locator('[data-path*="bag"]:visible, nav a:has-text("Bag"):visible, button:has-text("Bag"):visible, a[href*="bag"]:visible, [aria-label*="Bag"]:visible, [aria-label*="Cart"]:visible').first();
  if (await bagLink.isVisible()) {
    console.log('Navigating to Bag...');
    await bagLink.click();
    await page.waitForTimeout(2000);
  } else {
    const headerCart = page.locator('button:has(.material-symbols-outlined:has-text("shopping_bag")), button:has(.material-symbols-outlined:has-text("local_mall"))').first();
    if (await headerCart.isVisible()) {
      await headerCart.click();
      await page.waitForTimeout(2000);
    }
  }
  await page.screenshot({ path: path.join(SCRATCH_DIR, '09_bag_screen.png') });

  await auditDeadButtons(page, 'BagScreen', report);
  await auditBrokenImages(page, 'BagScreen', report);
  await auditVisualMisalignments(page, 'BagScreen', report);

  // Check quantity buttons (+ / - / delete)
  const plusBtns = await page.locator('button:has-text("+"):visible, [aria-label*="Increase"]:visible').all();
  console.log(`Found ${plusBtns.length} quantity increase buttons in Bag.`);
  if (plusBtns.length > 0) {
    console.log('Clicking quantity increase button...');
    await plusBtns[0].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '10_bag_quantity_increased.png') });
  }

  // Check Checkout CTA
  const checkoutBtn = page.locator('button:has-text("Proceed to Delivery"):visible, button:has-text("Proceed to Checkout"):visible, button:has-text("Add Delivery Address"):visible, #checkoutBtn:visible').first();
  if (await checkoutBtn.isVisible()) {
    console.log('Checkout CTA visible:', (await checkoutBtn.textContent())?.trim());
    await checkoutBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '11_delivery_address_screen.png') });
  } else {
    report('BAG_MISSING_CHECKOUT', 'Checkout button missing or disabled in Bag', 'Proceed to Delivery button was not found or visible');
  }

  // 4. Audit Delivery Address & Location Pin
  console.log('\n--- Auditing Address Screen & Location Pin ---');
  await auditDeadButtons(page, 'AddressScreen', report);
  await auditBrokenImages(page, 'AddressScreen', report);
  await auditVisualMisalignments(page, 'AddressScreen', report);

  // Check location detect button
  const gpsBtn = page.locator('button:has-text("Use Current Location"):visible, button:has-text("Locate Me"):visible, button:has-text("Fetch GPS"):visible, button:has(.material-symbols-outlined:has-text("my_location")):visible').first();
  if (await gpsBtn.isVisible()) {
    console.log('Clicking GPS / Auto-detect location button...');
    await gpsBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '12_after_gps_click.png') });
  }

  // Check address inputs
  const nameInput = page.locator('#recipientName:visible, #addr-name:visible, input[placeholder*="Name" i]:visible').first();
  const phoneInput = page.locator('#phoneNumber:visible, #addr-phone:visible, input[type="tel"]:visible').first();
  const flatInput = page.locator('#flatHouse:visible, #addr-flat:visible, input[placeholder*="Flat" i]:visible, input[placeholder*="House" i]:visible').first();
  const areaInput = page.locator('#streetLandmark:visible, #addr-street:visible, input[placeholder*="Street" i]:visible, input[placeholder*="Area" i]:visible').first();
  const pincodeInput = page.locator('#pincode:visible, #addr-pincode:visible, input[placeholder*="Pincode" i]:visible, input[placeholder*="PIN" i]:visible').first();

  console.log('Name Input visible:', await nameInput.isVisible());
  console.log('Phone Input visible:', await phoneInput.isVisible());
  console.log('Flat/House Input visible:', await flatInput.isVisible());
  console.log('Street/Area Input visible:', await areaInput.isVisible());
  console.log('Pincode Input visible:', await pincodeInput.isVisible());

  // Fill valid Nagpur address
  if (await nameInput.isVisible()) await nameInput.fill('Dr. Rajesh Verma');
  if (await phoneInput.isVisible()) await phoneInput.fill('9823198765');
  if (await flatInput.isVisible()) await flatInput.fill('Bungalow 14, Rose Villa');
  if (await areaInput.isVisible()) await areaInput.fill('Dharampeth Extension, West High Court Road');
  if (await pincodeInput.isVisible()) await pincodeInput.fill('440010');

  await page.screenshot({ path: path.join(SCRATCH_DIR, '13_address_filled.png') });

  // 5. Submit Order
  const placeOrderBtn = page.locator('#confirmOrderBtn:visible, button:has-text("Place 45-Min Express Order"):visible, button:has-text("Confirm Order"):visible, button:has-text("Confirm Address"):visible, button:has-text("Confirm Delivery"):visible').first();
  if (await placeOrderBtn.isVisible()) {
    console.log('Clicking Place Order CTA:', (await placeOrderBtn.textContent())?.trim());
    await placeOrderBtn.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '14_after_order_submit.png') });
  } else {
    report('ADDRESS_MISSING_SUBMIT', 'Place Order button missing on address screen', 'Could not locate confirmation button');
  }

  // 6. Audit Live Tracking Screen
  console.log('\n--- Auditing Live Tracking Screen ---');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCRATCH_DIR, '15_live_tracking_screen.png') });
  await auditDeadButtons(page, 'LiveTrackingScreen', report);
  await auditBrokenImages(page, 'LiveTrackingScreen', report);
  await auditVisualMisalignments(page, 'LiveTrackingScreen', report);

  const trackingText = await page.textContent('body');
  const hasOrderId = /KP-[A-Z0-9]+/i.test(trackingText);
  console.log('Order ID matched on screen:', hasOrderId);
  if (!hasOrderId) {
    report('TRACKING_NO_ORDER_ID', 'No valid Order ID shown on live tracking screen', 'Expected KP-XXXX format');
  }

  // 7. Audit My Orders Screen
  console.log('\n--- Auditing My Orders Screen ---');
  const myOrdersNav = page.locator('[data-path*="orders"]:visible, nav a:has-text("Orders"):visible, button:has-text("Orders"):visible, a[href*="orders"]:visible, [aria-label*="Orders"]:visible').first();
  if (await myOrdersNav.isVisible()) {
    console.log('Navigating to My Orders...');
    await myOrdersNav.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '16_my_orders_screen.png') });
    await auditDeadButtons(page, 'MyOrdersScreen', report);
    await auditBrokenImages(page, 'MyOrdersScreen', report);
  }

  // 8. Audit Profile Screen & Settings
  console.log('\n--- Auditing Profile Screen ---');
  const profileNav = page.locator('[data-path*="profile"]:visible, nav a:has-text("Profile"):visible, button:has-text("Profile"):visible, a[href*="profile"]:visible, [aria-label*="Profile"]:visible').first();
  if (await profileNav.isVisible()) {
    console.log('Navigating to Profile...');
    await profileNav.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCRATCH_DIR, '17_profile_screen.png') });
    await auditDeadButtons(page, 'ProfileScreen', report);
    await auditBrokenImages(page, 'ProfileScreen', report);

    // Test Theme toggle (dark/light) if present
    const themeToggle = page.locator('button:has-text("Dark"), button:has-text("Light"), [aria-label*="theme" i], #theme-toggle').first();
    if (await themeToggle.isVisible()) {
      console.log('Testing theme toggle...');
      await themeToggle.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCRATCH_DIR, '18_theme_toggled.png') });
    }
  }

  await browser.close();

  // Write report to scratch
  const reportPath = path.join(SCRATCH_DIR, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ issues, consoleLogs, networkErrors }, null, 2));
  console.log(`\nAudit complete! Found ${issues.length} potential issues. Report saved to ${reportPath}`);
}

async function auditDeadButtons(page, screenName, report) {
  const clickableElements = await page.locator('button:visible, a:visible').all();
  for (const el of clickableElements) {
    try {
      const tagName = await el.evaluate(e => e.tagName.toLowerCase());
      const href = await el.getAttribute('href');
      const text = (await el.textContent())?.trim().replace(/\s+/g, ' ');
      const ariaLabel = await el.getAttribute('aria-label');
      const id = await el.getAttribute('id');

      // Check dummy hrefs
      if (tagName === 'a' && (href === '#' || href === 'javascript:void(0)' || href === '')) {
        const hasClickLogic = await el.evaluate(e => {
          return e.onclick !== null || e.__reactFiber !== undefined || e.getAttribute('role') === 'button' || e.hasAttribute('data-action');
        });
        if (!hasClickLogic && (!text || text.length > 0)) {
          report('DUMMY_LINK', `Dummy anchor on ${screenName}`, `Text: "${text || ariaLabel || id}" with href="${href}"`);
        }
      }

      if (text && /lorem|sample|placeholder/i.test(text)) {
        report('PLACEHOLDER_TEXT', `Placeholder button on ${screenName}`, `Text: "${text}"`);
      }
    } catch (e) {}
  }
}

async function auditBrokenImages(page, screenName, report) {
  const images = await page.locator('img:visible').all();
  for (const img of images) {
    try {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const naturalWidth = await img.evaluate(e => e.naturalWidth);
      if (naturalWidth === 0 && src && !src.startsWith('data:')) {
        report('BROKEN_IMAGE', `Broken image on ${screenName}`, `src="${src}", alt="${alt}"`);
      }
    } catch (e) {}
  }
}

async function auditVisualMisalignments(page, screenName, report) {
  const overflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
    };
  });
  if (overflow.scrollWidth > overflow.clientWidth + 2) {
    report('HORIZONTAL_OVERFLOW', `Horizontal overflow on ${screenName}`, `scrollWidth: ${overflow.scrollWidth} > clientWidth: ${overflow.clientWidth}`);
  }
}

audit().catch((err) => {
  console.error('Audit Script Fatal Error:', err);
  process.exit(1);
});
