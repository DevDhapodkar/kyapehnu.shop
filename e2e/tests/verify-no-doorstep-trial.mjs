import { chromium } from 'playwright';
import path from 'path';

const bannedPatterns = [
  /doorstep trial/i,
  /try-on/i,
  /try-at-doorstep/i,
  /try at doorstep/i,
  /try before you buy/i,
  /doorstep fitting/i,
  /trial fitting/i,
  /trial mirrors/i,
  /15-minute fitting/i,
  /15-min trial/i,
  /trial fee/i,
  /trial network/i,
  /trial order/i,
  /trial-toggle/i,
  /concierge-try-on/i,
  /\btrial\b/i
];

function checkContent(name, text) {
  const violations = [];
  for (const pattern of bannedPatterns) {
    if (pattern.test(text)) {
      // Find match and snippet
      const match = text.match(pattern);
      const index = text.indexOf(match[0]);
      const snippet = text.substring(Math.max(0, index - 40), Math.min(text.length, index + 60));
      violations.push({ pattern: pattern.toString(), snippet });
    }
  }
  if (violations.length > 0) {
    console.error(`[FAIL] ${name} contained banned doorstep trial / try-on copy:`, violations);
    return false;
  }
  console.log(`[PASS] ${name}: 0 doorstep trial / try-on occurrences found.`);
  return true;
}

async function run() {
  console.log('=== Starting Verification: No Doorstep Trial / Try-On Across App ===\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();
  const baseUrl = 'http://localhost:4173/app';
  let allPassed = true;

  try {
    // 1. Welcome Screen
    console.log('1. Checking Welcome Screen...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const welcomeHtml = await page.content();
    if (!checkContent('Welcome Screen', welcomeHtml)) allPassed = false;
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/verify_no_trial_welcome.png' });

    // 2. Navigate to Storefront / Home
    console.log('\n2. Checking Storefront / Home Screen...');
    const exploreBtn = page.getByRole('button', { name: /(Explore Looks|Explore Storefront as Guest|Browse Catalog as guest)/i }).first();
    if (await exploreBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await exploreBtn.click();
      await page.waitForTimeout(2000);
    }
    const storefrontHtml = await page.content();
    if (!checkContent('Storefront Screen', storefrontHtml)) allPassed = false;
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/verify_no_trial_storefront.png' });

    // 3. Product Detail Screen (PDP)
    console.log('\n3. Checking Product Detail Screen (PDP)...');
    const firstProduct = page.locator('article, [class*="product-card"], a[href*="product"], div[onclick*="product"]').first();
    if (await firstProduct.isVisible({ timeout: 4000 }).catch(() => false)) {
      await firstProduct.click();
      await page.waitForTimeout(2000);
    } else {
      await page.evaluate(() => {
        if (window.__kyapehnu?.navigationRef?.current) {
          window.__kyapehnu.navigationRef.current.navigate('ProductDetail', { productId: 'prod_paithani_01' });
        }
      });
      await page.waitForTimeout(2000);
    }
    const pdpHtml = await page.content();
    if (!checkContent('Product Detail Screen', pdpHtml)) allPassed = false;
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/verify_no_trial_pdp.png' });

    // 4. Shopping Bag / Cart Screen
    console.log('\n4. Checking Shopping Bag Screen...');
    const bagNav = page.locator('button[aria-label*="Bag"], a[data-path="shopping-bag"], nav a[data-path*="bag"], [data-path="shopping-bag"]').first();
    if (await bagNav.isVisible({ timeout: 4000 }).catch(() => false)) {
      await bagNav.click();
      await page.waitForTimeout(2000);
    } else {
      await page.evaluate(() => {
        if (window.__kyapehnu?.navigationRef?.current) {
          window.__kyapehnu.navigationRef.current.navigate('Cart');
        }
      });
      await page.waitForTimeout(2000);
    }
    const bagHtml = await page.content();
    if (!checkContent('Shopping Bag Screen', bagHtml)) allPassed = false;
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/verify_no_trial_bag.png' });

    // 5. Orders Screen
    console.log('\n5. Checking Orders Screen...');
    const ordersNav = page.locator('nav a[data-path="orders-track"], nav a:has-text("Orders"), nav button:has-text("Orders")').first();
    if (await ordersNav.isVisible({ timeout: 4000 }).catch(() => false)) {
      await ordersNav.click();
      await page.waitForTimeout(2000);
    } else {
      await page.evaluate(() => {
        if (window.__kyapehnu?.navigationRef?.current) {
          window.__kyapehnu.navigationRef.current.navigate('MyOrders');
        }
      });
      await page.waitForTimeout(2000);
    }
    const ordersHtml = await page.content();
    if (!checkContent('Orders Screen', ordersHtml)) allPassed = false;
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/verify_no_trial_orders.png' });

    // 6. Profile & Settings Screen
    console.log('\n6. Checking Profile & Settings Screen...');
    const profileNav = page.locator('nav a[data-path="client-account"], nav a:has-text("Account"), nav button:has-text("Account")').first();
    if (await profileNav.isVisible({ timeout: 4000 }).catch(() => false)) {
      await profileNav.click();
      await page.waitForTimeout(2000);
    } else {
      await page.evaluate(() => {
        if (window.__kyapehnu?.navigationRef?.current) {
          window.__kyapehnu.navigationRef.current.navigate('Profile');
        }
      });
      await page.waitForTimeout(2000);
    }
    const profileHtml = await page.content();
    if (!checkContent('Profile Screen', profileHtml)) allPassed = false;
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/verify_no_trial_profile.png' });

    // 7. Live Tracking Screen
    console.log('\n7. Checking Live Tracking Screen...');
    await page.evaluate(() => {
      if (window.__kyapehnu?.navigationRef?.current) {
        window.__kyapehnu.navigationRef.current.navigate('LiveTracking');
      }
    });
    await page.waitForTimeout(2000);
    const trackingHtml = await page.content();
    if (!checkContent('Live Tracking Screen', trackingHtml)) allPassed = false;
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/verify_no_trial_tracking.png' });

    if (allPassed) {
      console.log('\n ALL SCREENS PASSED: Zero doorstep trial or try-on references found!');
    } else {
      console.error('\n❌ SOME SCREENS FAILED: Doorstep trial references were found.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
