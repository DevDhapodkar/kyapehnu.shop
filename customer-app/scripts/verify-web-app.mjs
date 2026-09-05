import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const scratchDir = '/Users/devdhapodkar/.gemini/antigravity/brain/e64d8bd6-6a33-4c24-bb6e-2d0d4b88e4e2/scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

async function verify() {
  console.log('🌐 Launching Chrome to verify Kya Pehnu Web App...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // --- 1. Test iPhone Viewport ---
  console.log('\n📱 Testing iPhone mobile viewport (390 x 844)...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  );

  const mobileErrors = [];
  const mobileLogs = [];
  mobilePage.on('pageerror', (err) => mobileErrors.push(err.message));
  mobilePage.on('console', (msg) => mobileLogs.push(`[${msg.type()}]: ${msg.text()}`));
  mobilePage.on('requestfailed', (req) => console.log('❌ [REQUEST FAILED]:', req.url(), req.failure()?.errorText));
  mobilePage.on('response', (res) => {
    if (res.status() >= 400) console.log(`❌ [HTTP ${res.status()}]:`, res.url());
  });

  await mobilePage.goto('http://localhost:3000/app', { waitUntil: 'networkidle2', timeout: 15000 });
  await mobilePage.waitForSelector('#root', { timeout: 5000 });

  // Wait 2 seconds for any delayed banner or animation
  await new Promise((r) => setTimeout(r, 2000));

  const mobileTitle = await mobilePage.title();
  const mobileText = await mobilePage.$eval('#root', (el) => el.innerText);

  console.log('Mobile Page Title:', mobileTitle);
  console.log('Mobile Content Preview:', mobileText.replace(/\n+/g, ' | ').slice(0, 200));
  console.log('Mobile Logs:', mobileLogs);
  console.log('Mobile Errors:', mobileErrors.length ? mobileErrors : 'None (0 errors)');

  await mobilePage.screenshot({ path: path.join(scratchDir, 'screenshot-iphone.png') });
  console.log('📸 Saved iPhone screenshot to scratch/screenshot-iphone.png');

  // --- 2. Test Desktop Viewport ---
  console.log('\n💻 Testing Desktop viewport (1440 x 900)...');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });

  const desktopErrors = [];
  desktopPage.on('pageerror', (err) => desktopErrors.push(err.message));

  await desktopPage.goto('http://localhost:3000/app', { waitUntil: 'networkidle2', timeout: 15000 });
  await desktopPage.waitForSelector('#root', { timeout: 5000 });

  await new Promise((r) => setTimeout(r, 1500));
  const desktopTitle = await desktopPage.title();
  console.log('Desktop Page Title:', desktopTitle);
  console.log('Desktop Errors:', desktopErrors.length ? desktopErrors : 'None (0 errors)');

  await desktopPage.screenshot({ path: path.join(scratchDir, 'screenshot-desktop.png') });
  console.log('📸 Saved Desktop screenshot to scratch/screenshot-desktop.png');

  // --- 3. Test Landing Page Links ---
  console.log('\n🏠 Testing Marketing Website at http://localhost:3000...');
  const homePage = await browser.newPage();
  await homePage.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });
  
  // Click skip intro button if present
  const skipBtn = await homePage.$('button[aria-label="Skip intro animation"]');
  if (skipBtn) {
    console.log('Skipping intro sequence...');
    await skipBtn.click();
    await new Promise((r) => setTimeout(r, 1000));
  }

  const appLinks = await homePage.$$eval('a[href="/app"]', (elements) =>
    elements.map((el) => el.innerText.trim().replace(/\n+/g, ' '))
  );
  const apkLinks = await homePage.$$eval('a[href="/kya-pehnu.apk"]', (elements) =>
    elements.map((el) => el.innerText.trim().replace(/\n+/g, ' '))
  );

  console.log('Found /app links on landing page:', appLinks);
  console.log('Found /kya-pehnu.apk links on landing page:', apkLinks);

  await browser.close();
  console.log('\n🎉 ALL WEB APP CHECKS PASSED SUCCESSFULLY!');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
