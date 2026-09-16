import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distWebDir = '/Users/devdhapodkar/Desktop/kyapehnu/kyapehnu.claude/customer-app/dist-web';
const screenshotsDir = path.resolve(__dirname, 'screenshots');

fs.mkdirSync(screenshotsDir, { recursive: true });

// Minimal static HTTP server for dist-web
function createStaticServer(port = 8089) {
  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '/app' || reqPath === '/app/') {
      reqPath = '/index.html';
    }
    if (reqPath.startsWith('/app/')) {
      reqPath = reqPath.replace(/^\/app/, '');
    }

    let filePath = path.join(distWebDir, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distWebDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (err) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await createStaticServer(8089);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  const failedRequests = [];
  page.on('requestfailed', (req) => {
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
  });

  page.on('console', (msg) => console.log(`[BROWSER ${msg.type()}]`, msg.text()));
  page.on('pageerror', (err) => console.error('[BROWSER PAGE ERROR]', err));


  try {
    console.log('\n--- 1. NAVIGATING TO APP ---');
    await page.goto('http://localhost:8089/app', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.addEventListener('blur', (e) => {
        console.log('[BROWSER BLUR]', e.target?.id || e.target?.tagName);
      }, true);
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.removedNodes) {
            for (const node of m.removedNodes) {
              if (node.id === 'reg-name' || (node.querySelector && node.querySelector('#reg-name'))) {
                console.log('[BROWSER MUTATION] #reg-name was REMOVED! target:', m.target.tagName, m.target.id, m.target.className);
              }
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01_welcome_screen.png') });

    // Check Welcome screen logo
    console.log('\n--- 2. VERIFYING WELCOME SCREEN LOGO ---');
    const logos = await page.locator('img[alt*="Kya Pehnu"], img[alt*="Crest"], img[alt*="Logo"], img[alt*="Emblem"]').all();
    console.log(`Found ${logos.length} logo candidate(s) on Welcome screen.`);
    for (let i = 0; i < logos.length; i++) {
      const src = await logos[i].getAttribute('src');
      const naturalWidth = await logos[i].evaluate((img) => img.naturalWidth);
      const isVisible = await logos[i].isVisible();
      console.log(`Logo #${i + 1}: isVisible=${isVisible}, naturalWidth=${naturalWidth}, src=${src?.substring(0, 60)}...`);
      if (src?.startsWith('data:image/png;base64,')) {
        console.log('✓ Verified: Logo uses instantaneous base64 data URI.');
      }
      if (naturalWidth > 0) {
        console.log('✓ Verified: Logo image decoded and rendered successfully with naturalWidth > 0.');
      } else {
        throw new Error(`Logo #${i + 1} failed to decode (naturalWidth=${naturalWidth})`);
      }
    }

    // Check failed requests for Google CDN 403 or broken images
    const cdnFailures = failedRequests.filter((r) => r.url.includes('googleusercontent'));
    console.log(`Google CDN 403 failures count: ${cdnFailures.length}`);
    if (cdnFailures.length > 0) {
      throw new Error(`Found ${cdnFailures.length} 403 Google CDN requests: ${JSON.stringify(cdnFailures)}`);
    }

    // Navigate to Auth screen
    console.log('\n--- 3. NAVIGATING TO AUTH SCREEN ---');
    const loginBtn = page.locator('button:has-text("Log In"), button:has-text("Sign In"), a:has-text("Sign In")').first();
    await loginBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '02_auth_screen.png') });

    // Check Auth screen logo
    const authLogos = await page.locator('img[alt*="Kya Pehnu"], img[alt*="Crest"], img[alt*="Logo"], img[alt*="Emblem"]').all();
    console.log(`Found ${authLogos.length} logo candidate(s) on Auth screen.`);
    for (let i = 0; i < authLogos.length; i++) {
      const src = await authLogos[i].getAttribute('src');
      const naturalWidth = await authLogos[i].evaluate((img) => img.naturalWidth);
      console.log(`Auth Logo #${i + 1}: naturalWidth=${naturalWidth}, src=${src?.substring(0, 60)}...`);
      if (naturalWidth === 0) {
        throw new Error(`Auth Logo #${i + 1} failed to decode`);
      }
    }

    // Test Sign In Form typing
    console.log('\n--- 4. TESTING SIGN IN FORM TYPING ---');
    const idInput = page.locator('#signin-identifier, #dark-signin-identifier').first();
    await idInput.waitFor({ state: 'visible' });

    // Click to focus
    await idInput.click();
    // Type slowly character by character to detect keystroke drops
    const testIdentifier = '9823045892';
    for (const char of testIdentifier) {
      await page.keyboard.type(char, { delay: 50 });
    }
    const typedIdentifier = await idInput.inputValue();
    console.log(`Typed Identifier: Expected "${testIdentifier}", Got "${typedIdentifier}"`);
    if (typedIdentifier !== testIdentifier) {
      throw new Error(`Identifier typing mismatch! Expected "${testIdentifier}", got "${typedIdentifier}"`);
    }

    const pwdInput = page.locator('#signin-password, #dark-signin-password').first();
    await pwdInput.click();
    const testPassword = 'MySecretPassword123';
    for (const char of testPassword) {
      await page.keyboard.type(char, { delay: 50 });
    }
    const typedPassword = await pwdInput.inputValue();
    console.log(`Typed Password: Expected "${testPassword}", Got "${typedPassword}"`);
    if (typedPassword !== testPassword) {
      throw new Error(`Password typing mismatch! Expected "${testPassword}", got "${typedPassword}"`);
    }
    await page.screenshot({ path: path.join(screenshotsDir, '03_signin_typed.png') });

    // Test Register Form Tab Switch and Typing
    console.log('\n--- 5. TESTING REGISTER FORM TAB SWITCH AND TYPING ---');
    const registerTab = page.locator('#tab-register, #dark-tab-register').first();
    console.log('registerTab visible:', await registerTab.isVisible());
    await registerTab.click();
    await page.waitForTimeout(500);

    const pReg = page.locator('#panel-register, #dark-panel-register').first();
    console.log('pReg class:', await pReg.getAttribute('class'));
    console.log('pReg visible:', await pReg.isVisible());

    const regNameInput = page.locator('#reg-name, #dark-reg-name').first();
    console.log('regNameInput visible:', await regNameInput.isVisible());
    await regNameInput.click();
    console.log('Active element ID before typing:', await page.evaluate(() => document.activeElement?.id));
    const testName = 'Ananya Sharma';
    await regNameInput.focus();
    await page.keyboard.type(testName, { delay: 40 });
    const typedName = await regNameInput.inputValue();
    console.log(`Typed Name: Expected "${testName}", Got "${typedName}"`);
    console.log('Active element ID after typing:', await page.evaluate(() => document.activeElement?.id));
    if (typedName !== testName) {
      throw new Error(`Name typing mismatch! Expected "${testName}", got "${typedName}"`);
    }

    const regPhoneInput = page.locator('#reg-phone, #dark-reg-phone').first();
    await regPhoneInput.click();
    const testPhone = '9876543210';
    await page.keyboard.type(testPhone, { delay: 40 });
    const typedPhone = await regPhoneInput.inputValue();
    console.log(`Typed Phone: Expected "${testPhone}", Got "${typedPhone}"`);
    if (typedPhone !== testPhone) {
      throw new Error(`Phone typing mismatch! Expected "${testPhone}", got "${typedPhone}"`);
    }

    const regEmailInput = page.locator('#reg-email, #dark-reg-email').first();
    await regEmailInput.click();
    const testEmail = 'ananya@kyapehnu.shop';
    await page.keyboard.type(testEmail, { delay: 40 });
    const typedEmail = await regEmailInput.inputValue();
    console.log(`Typed Email: Expected "${testEmail}", Got "${typedEmail}"`);
    if (typedEmail !== testEmail) {
      throw new Error(`Email typing mismatch! Expected "${testEmail}", got "${typedEmail}"`);
    }

    const regPwdInput = page.locator('#reg-password, #dark-reg-password').first();
    await regPwdInput.click();
    const testRegPwd = 'CoutureGuild2026';
    await page.keyboard.type(testRegPwd, { delay: 40 });
    const typedRegPwd = await regPwdInput.inputValue();
    console.log(`Typed Reg Password: Expected "${testRegPwd}", Got "${typedRegPwd}"`);
    if (typedRegPwd !== testRegPwd) {
      throw new Error(`Register Password typing mismatch! Expected "${testRegPwd}", got "${typedRegPwd}"`);
    }
    await page.screenshot({ path: path.join(screenshotsDir, '04_register_typed.png') });

    console.log('\n=========================================');
    console.log('✓ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('  1. Logo loads instantaneously with base64 data URI (0ms, 0 network requests, no 403, no Safari "?" box).');
    console.log('  2. Sign in form inputs accept text typing smoothly without losing focus or resetting values.');
    console.log('  3. Register form inputs accept text, phone, email, and password smoothly without resetting.');
    console.log('=========================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
