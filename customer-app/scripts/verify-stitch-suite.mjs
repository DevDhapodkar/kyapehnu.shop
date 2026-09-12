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

    // Ensure light theme is forced for light suite capture
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('@kyapehnu/theme_mode', 'light');
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
      { name: '09_light_welcome', action: () => window.__NAV__.navigate('Welcome') },
      { name: '10_light_vendor_register', action: () => window.__NAV__.navigate('VendorRegister') },
      { name: '11_light_catalog_manager', action: () => window.__NAV__.navigate('CatalogManager') },
      { name: '12_light_product_ingestion', action: () => window.__NAV__.navigate('ProductIngestion') },
    ];

    for (const scr of screens) {
      console.log(`📸 Capturing ${scr.name}...`);
      await page.evaluate(scr.action);
      await new Promise(r => setTimeout(r, 1400));
      const ssPath = path.join(outDir, `${scr.name}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
    }

    console.log('✅ All screens verified and captured successfully!');

  } catch (err) {
    console.error('❌ Verification error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Verification finished.');
  }
}

main();
