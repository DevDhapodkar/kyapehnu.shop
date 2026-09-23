import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const brainDir = '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717';

async function main() {
  console.log('🔍 Running visual and functional verification on http://localhost:4173/app/ ...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: {
      width: 390, // Mobile device width (iPhone 14 / standard mobile)
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:4173/app/', { waitUntil: 'networkidle0', timeout: 30000 });

    await page.waitForFunction(() => Boolean(window.__NAV__ && window.__NAV__.isReady && window.__NAV__.isReady() && window.__THEME_STORE__), { timeout: 15000 });

    // 1. Light Theme Auth Screen
    await page.evaluate(() => {
      window.__THEME_STORE__.getState().setThemeMode('light');
      window.__NAV__.navigate('Auth');
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify DOM elements on Auth screen
    const lightMetrics = await page.evaluate(() => {
      const input = document.querySelector('#signin-identifier');
      const placeholder = input ? input.getAttribute('placeholder') : '';
      const inputWidth = input ? input.getBoundingClientRect().width : 0;
      
      const oneTap = document.querySelector('#btn-fast-demo-signin');
      const oneTapText = oneTap ? oneTap.innerText : '';

      const rememberMe = document.querySelector('#remember-me');
      const rememberRect = rememberMe ? rememberMe.getBoundingClientRect() : null;

      const divider = Array.from(document.querySelectorAll('span')).find(s => (s.textContent || '').toLowerCase().includes('or continue with'));
      const dividerRect = divider ? divider.getBoundingClientRect() : null;

      const headerP = document.querySelector('section p');
      const headerText = headerP ? headerP.innerText : '';

      const hasCollision = rememberRect && dividerRect && (dividerRect.top < rememberRect.bottom);

      return {
        placeholder,
        inputWidth,
        oneTapText,
        hasCollision,
        rememberBottom: rememberRect?.bottom,
        dividerTop: dividerRect?.top,
        headerText,
      };
    });

    console.log('Light Auth Metrics:', JSON.stringify(lightMetrics, null, 2));

    const lightShot = path.join(brainDir, 'auth_light_fixed_verified.png');
    await page.screenshot({ path: lightShot, fullPage: false });
    console.log(`Saved screenshot: ${lightShot}`);

    // 2. Test Google Button Timeout / Fallback
    console.log('Testing Google Sign In click...');
    await page.evaluate(() => {
      const googleBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Continue with Google'));
      if (googleBtn) googleBtn.click();
    });

    // Check loading state
    await new Promise(r => setTimeout(r, 1000));
    const loadingState = await page.evaluate(() => {
      const googleBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Connecting to Google'));
      return Boolean(googleBtn);
    });
    console.log('Google Sign In shows spinner:', loadingState);

    // Wait 5.5 seconds for timeout fallback
    console.log('Waiting for 5-second timeout safety release...');
    await new Promise(r => setTimeout(r, 5500));

    const restoredState = await page.evaluate(() => {
      const googleBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Continue with Google'));
      const toast = document.querySelector('.stitch-toast, #atelierToast, [role="alert"]') || Array.from(document.querySelectorAll('div')).find(d => (d.textContent || '').includes('timed out'));
      return {
        buttonRestored: Boolean(googleBtn),
        toastMessage: toast ? toast.innerText : null,
      };
    });
    console.log('After timeout fallback:', JSON.stringify(restoredState, null, 2));

    // 3. Dark Theme Auth Screen
    await page.evaluate(() => {
      window.__THEME_STORE__.getState().setThemeMode('dark');
      window.__NAV__.navigate('Auth');
    });
    await new Promise(r => setTimeout(r, 1000));

    const darkMetrics = await page.evaluate(() => {
      const input = document.querySelector('#dark-signin-identifier');
      const placeholder = input ? input.getAttribute('placeholder') : '';
      const oneTap = document.querySelector('#dark-btn-fast-demo-signin');
      const oneTapText = oneTap ? oneTap.innerText : '';
      return { placeholder, oneTapText };
    });
    console.log('Dark Auth Metrics:', JSON.stringify(darkMetrics, null, 2));

    const darkShot = path.join(brainDir, 'auth_dark_fixed_verified.png');
    await page.screenshot({ path: darkShot, fullPage: false });
    console.log(`Saved screenshot: ${darkShot}`);

    // 4. Test 1-Tap Fast Member Login
    console.log('Testing 1-Tap Fast Member Login...');
    await page.evaluate(() => {
      const oneTap = document.querySelector('#dark-btn-fast-demo-signin') || document.querySelector('#btn-fast-demo-signin');
      if (oneTap) oneTap.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const postLoginState = await page.evaluate(() => {
      const user = window.__AUTH_STORE__ ? window.__AUTH_STORE__.getState().user : null;
      return {
        loggedIn: Boolean(user),
        userName: user?.displayName,
      };
    });
    console.log('1-Tap Login result:', JSON.stringify(postLoginState, null, 2));

    const storefrontShot = path.join(brainDir, 'storefront_after_onetap_verified.png');
    await page.screenshot({ path: storefrontShot, fullPage: false });
    console.log(`Saved storefront screenshot: ${storefrontShot}`);

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
