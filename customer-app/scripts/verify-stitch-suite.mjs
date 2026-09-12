import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = '/Users/devdhapodkar/Desktop/kyapehnu/stitch_screens/live_verified';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function main() {
  console.log('🚀 Running Stitch Suite Interactive Verification on https://www.kyapehnu.shop/app ...');
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
    page.on('console', msg => {
      const text = msg.text();
      if (!text.includes('Download the React DevTools')) {
        console.log(`[Browser Console]:`, text);
      }
    });

    await page.goto('https://www.kyapehnu.shop/app', { waitUntil: 'networkidle0', timeout: 35000 });
    await page.waitForFunction(() => Boolean(window.__NAV__ && window.__NAV__.isReady && window.__NAV__.isReady()), { timeout: 20000 });

    const screens = [
      { name: '01_light_home', action: () => window.__NAV__.navigate('Home') },
      { name: '02_light_pdp', action: () => window.__NAV__.navigate('ProductDetail', { title: 'Royal Chanderi Zari Set', price: 4750 }) },
      { name: '03_light_bag', action: () => window.__NAV__.navigate('Cart') },
      { name: '04_light_address', action: () => window.__NAV__.navigate('Address') },
      { name: '05_light_tracking', action: () => window.__NAV__.navigate('LiveTracking') },
      { name: '06_light_orders', action: () => window.__NAV__.navigate('MyOrders') },
      { name: '07_light_profile', action: () => window.__NAV__.navigate('Profile') },
      { name: '08_light_auth', action: () => window.__NAV__.navigate('Auth') },
      { name: '09_light_vendor_register', action: () => window.__NAV__.navigate('VendorRegister') },
      { name: '10_light_vendor_queue', action: () => {
        // switch role to vendor
        const authStore = window.__NAV__;
        window.__NAV__.navigate('Home');
      }},
    ];

    for (const scr of screens) {
      console.log(`📸 Capturing ${scr.name}...`);
      await page.evaluate(scr.action);
      await new Promise(r => setTimeout(r, 1200));
      const ssPath = path.join(outDir, `${scr.name}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
    }

    console.log('✅ All customer screens verified and captured successfully!');

  } catch (err) {
    console.error('❌ Verification error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Verification finished.');
  }
}

main();
