import puppeteer from 'puppeteer-core';
import path from 'node:path';

const scratchDir = process.env.SCRATCH_DIR || '/Users/devdhapodkar/.gemini/antigravity-cli/brain/85ea5b49-6a64-4346-96aa-87e81f977bd1/scratch';

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

  console.log('Navigating from Welcome screen to Storefront/Auth...');
  const exploreBtn = await page.$('text/Explore Looks');
  if (exploreBtn) {
    console.log('Found Explore Looks button. Clicking...');
    await exploreBtn.click();
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Check if we are on Auth screen with Guest button
  const guestBtn = await page.$('text/Guest');
  if (guestBtn) {
    console.log('Found Guest button. Clicking to enter Storefront Home...');
    await guestBtn.click();
    await new Promise((r) => setTimeout(r, 2500));
  }

  await page.screenshot({ path: path.join(scratchDir, 'screenshot-home-live.png') });
  console.log('📸 Saved Storefront screenshot to scratch/screenshot-home-live.png');

  console.log('Testing PDP navigation: clicking product card...');
  const productTitle = await page.$('text/Chanderi Silk Angrakha') || await page.$('text/Studio Anamika') || await page.$('[data-testid="product-card"]');
  if (productTitle) {
    await productTitle.click();
    await new Promise((r) => setTimeout(r, 2000));
    console.log('Clicked product! Checking PDP page...');
    await page.screenshot({ path: path.join(scratchDir, 'screenshot-pdp.png') });
    console.log('📸 Saved PDP screenshot to scratch/screenshot-pdp.png');
  } else {
    // Try finding any text element inside the products list
    const anyProduct = await page.$('div[role="button"]');
    if (anyProduct) {
      await anyProduct.click();
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(scratchDir, 'screenshot-pdp.png') });
      console.log('📸 Saved PDP screenshot via fallback button to scratch/screenshot-pdp.png');
    } else {
      console.log('No clickable product element found');
    }
  }

  await browser.close();
  console.log('✅ Flow test complete!');
}

testInteraction().catch(console.error);
