import puppeteer from 'puppeteer-core';
import path from 'node:path';

const scratchDir = '/Users/devdhapodkar/.gemini/antigravity/brain/e64d8bd6-6a33-4c24-bb6e-2d0d4b88e4e2/scratch';

async function testInteraction() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle2', timeout: 15000 });

  await page.waitForSelector('#root', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Testing PDP navigation: clicking product card...');
  // Find clickable elements
  const productTitle = await page.$('text/Sitabuldi Handloom Zari Kurta');
  if (productTitle) {
    await productTitle.click();
    await new Promise((r) => setTimeout(r, 1500));
    console.log('Clicked product! Checking current page...');
    await page.screenshot({ path: path.join(scratchDir, 'screenshot-pdp.png') });
    console.log('📸 Saved PDP screenshot to scratch/screenshot-pdp.png');
  } else {
    console.log('Product card text not found directly for click');
  }

  await browser.close();
}

testInteraction().catch(console.error);
