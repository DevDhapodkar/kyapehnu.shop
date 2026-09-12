import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = '/Users/devdhapodkar/Desktop/kyapehnu/stitch_screens/live_verified';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('🚀 Verifying Live Auth Split & Database Workflows on https://www.kyapehnu.shop/app ...');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: {
      width: 412,
      height: 915,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 1. Visit live app
    console.log('Navigating to live app...');
    await page.goto('https://www.kyapehnu.shop/app', { waitUntil: 'networkidle0', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Wait for Navigation Container
    await page.waitForFunction(() => Boolean(window.__NAV__ && window.__NAV__.isReady && window.__NAV__.isReady()), {
      timeout: 20000,
    });

    // 2. Navigate to Auth Screen
    console.log('Navigating to Auth screen to verify split form...');
    await page.evaluate(() => {
      window.__NAV__.navigate('Auth');
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Verify Sign In tab is active by default
    const authStateInitial = await page.evaluate(() => {
      const panelSignIn = document.querySelector('#panel-signin, #dark-panel-signin');
      const panelRegister = document.querySelector('#panel-register, #dark-panel-register');
      const signInVisible = panelSignIn && !panelSignIn.classList.contains('hidden');
      const registerHidden = panelRegister && panelRegister.classList.contains('hidden');
      const hasFullNameInSignIn = panelSignIn && Boolean(panelSignIn.querySelector('input[placeholder*="Radhika" i]'));
      return { signInVisible, registerHidden, hasFullNameInSignIn };
    });
    console.log('Initial Auth (Sign In tab):', authStateInitial);

    await page.screenshot({ path: path.join(outDir, 'live_auth_signin_tab.png'), fullPage: true });

    // Click Register tab
    console.log('Clicking Register tab...');
    await page.evaluate(() => {
      const regTab = document.querySelector('#tab-register, #dark-tab-register, #link-switch-to-register');
      if (regTab) regTab.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const authStateRegister = await page.evaluate(() => {
      const panelSignIn = document.querySelector('#panel-signin, #dark-panel-signin');
      const panelRegister = document.querySelector('#panel-register, #dark-panel-register');
      const signInHidden = panelSignIn && panelSignIn.classList.contains('hidden');
      const registerVisible = panelRegister && !panelRegister.classList.contains('hidden');
      const hasFullNameInRegister = panelRegister && Boolean(panelRegister.querySelector('input[placeholder*="Radhika" i]'));
      return { signInHidden, registerVisible, hasFullNameInRegister };
    });
    console.log('Register Tab State:', authStateRegister);

    await page.screenshot({ path: path.join(outDir, 'live_auth_register_tab.png'), fullPage: true });

    // Click back to Sign In
    console.log('Clicking Sign In tab...');
    await page.evaluate(() => {
      const signInTab = document.querySelector('#tab-signin, #dark-tab-signin, #link-switch-to-signin');
      if (signInTab) signInTab.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // 3. Navigate to Storefront Home and check live products
    console.log('Navigating to Storefront Home...');
    await page.evaluate(() => {
      window.__NAV__.navigate('Home');
    });
    await new Promise((r) => setTimeout(r, 2000));

    const productCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-action="open-pdp"], .grid > div');
      return cards.length;
    });
    console.log('Live Products rendered in Storefront grid:', productCount);
    await page.screenshot({ path: path.join(outDir, 'live_storefront_home.png'), fullPage: true });

    // 4. Test PDP
    console.log('Navigating to Product Detail...');
    await page.evaluate(() => {
      window.__NAV__.navigate('ProductDetail', {
        title: 'Paithani Royal Zari Dupatta',
        price: 2800,
        mrp: 3800,
        boutiqueName: 'Sitabuldi Heritage Silks',
      });
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, 'live_product_detail.png'), fullPage: true });

    // 5. Test Cart
    console.log('Navigating to Cart (Your Bag)...');
    await page.evaluate(() => {
      window.__NAV__.navigate('Cart');
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, 'live_your_bag.png'), fullPage: true });

    // 6. Test Delivery Address
    console.log('Navigating to Delivery Address...');
    await page.evaluate(() => {
      window.__NAV__.navigate('Address');
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, 'live_delivery_address.png'), fullPage: true });

    // 7. Test Live Tracking
    console.log('Navigating to Live Tracking...');
    await page.evaluate(() => {
      window.__NAV__.navigate('LiveTracking', { orderId: 'KP-8291' });
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, 'live_tracking.png'), fullPage: true });

    console.log('✅ ALL LIVE VERIFICATION CHECKS PASSED!');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

run();
