import puppeteer from 'puppeteer-core';
import path from 'node:path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = '/Users/devdhapodkar/Desktop/kyapehnu/stitch_screens';

async function main() {
  console.log('🚀 Verifying live deployment on https://www.kyapehnu.shop/app ...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: {
      width: 412,
      height: 1050,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.kyapehnu.shop/app', { waitUntil: 'networkidle0', timeout: 30000 });

    await page.waitForFunction(() => Boolean(window.__NAV__ && window.__NAV__.isReady && window.__NAV__.isReady()), { timeout: 15000 });

    // Navigate to Auth screen
    await page.evaluate(() => {
      window.__NAV__.navigate('Auth');
    });
    await new Promise(r => setTimeout(r, 2000));

    const liveScreenshotPath = path.join(outDir, 'live_production_auth.png');
    await page.screenshot({ path: liveScreenshotPath, fullPage: false });
    console.log(`✅ Saved Live Production screenshot: ${liveScreenshotPath}`);

  } catch (err) {
    console.error('❌ Error verifying live production:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Finished.');
  }
}

main();
