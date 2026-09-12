import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = '/Users/devdhapodkar/Desktop/kyapehnu/stitch_screens';

async function main() {
  console.log('🚀 Launching Chrome to capture full-page Auth screen...');
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
    await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle0', timeout: 30000 });

    await page.waitForFunction(() => Boolean(window.__NAV__ && window.__NAV__.isReady && window.__NAV__.isReady() && window.__THEME_STORE__), { timeout: 15000 });

    // 1. Light Mode Full Page
    await page.evaluate(() => {
      window.__THEME_STORE__.getState().setThemeMode('light');
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      window.__NAV__.navigate('Auth');
    });
    await new Promise(r => setTimeout(r, 1200));

    const lightScreenshotPath = path.join(outDir, 'verified_light_auth_full.png');
    await page.screenshot({ path: lightScreenshotPath, fullPage: false });
    console.log(`✅ Saved Light Mode full height screenshot: ${lightScreenshotPath}`);

    // 2. Dark Mode Full Page
    await page.evaluate(() => {
      window.__THEME_STORE__.getState().setThemeMode('dark');
    });
    await new Promise(r => setTimeout(r, 600));

    await page.evaluate(() => {
      window.__NAV__.navigate('Auth');
    });
    await new Promise(r => setTimeout(r, 1200));

    const darkScreenshotPath = path.join(outDir, 'verified_dark_auth_full.png');
    await page.screenshot({ path: darkScreenshotPath, fullPage: false });
    console.log(`✅ Saved Dark Mode full height screenshot: ${darkScreenshotPath}`);

  } catch (err) {
    console.error('❌ Verification error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Verification finished.');
  }
}

main();
