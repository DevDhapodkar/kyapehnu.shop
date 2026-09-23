import puppeteer from 'puppeteer-core';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:4173/app/';
const ARTIFACTS_DIR = '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runAudit() {
  console.log('🚀 Launching automated Critic verification suite on', BASE_URL);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = {};

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.__NAV__ && window.__NAV__.isReady && window.__NAV__.isReady()), { timeout: 15000 });
    console.log('✓ App and Navigation system initialized.');

    // ==========================================
    // 1. AUTH SCREEN
    // ==========================================
    console.log('\n--- 1. Testing Auth Screen ---');
    await page.evaluate(() => {
      window.__NAV__.navigate('Auth');
    });
    await sleep(1000);

    const authMetrics = await page.evaluate(() => {
      const input = document.querySelector('#signin-identifier') || document.querySelector('input[type="text"]');
      const placeholder = input ? input.getAttribute('placeholder') : '';
      const oneTap = document.querySelector('#btn-fast-demo-signin');
      const oneTapText = oneTap ? oneTap.innerText.replace(/\s+/g, ' ').trim() : '';
      const rememberMe = document.querySelector('#remember-me');
      const divider = Array.from(document.querySelectorAll('span')).find(s => (s.textContent || '').toLowerCase().includes('or continue with'));
      
      let collision = false;
      if (rememberMe && divider) {
        const rRect = rememberMe.getBoundingClientRect();
        const dRect = divider.getBoundingClientRect();
        collision = dRect.top < rRect.bottom;
      }

      return {
        placeholder,
        oneTapText,
        collision,
      };
    });
    console.log('  Auth metrics:', authMetrics);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'critic_final_auth.png') });
    results.auth = {
      placeholderValid: authMetrics.placeholder === 'Mobile number or email',
      noCollision: !authMetrics.collision,
      oneTapClean: !authMetrics.oneTapText.includes('lag'),
    };

    // ==========================================
    // 2. STOREFRONT HOME SCREEN
    // ==========================================
    console.log('\n--- 2. Testing Storefront Screen ---');
    await page.evaluate(() => {
      window.__NAV__.navigate('Home');
    });
    await sleep(1200);

    const storefrontMetrics = await page.evaluate(() => {
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
      const searchPlaceholder = searchInput ? searchInput.getAttribute('placeholder') : '';
      
      // Category rail buttons
      const pills = Array.from(document.querySelectorAll('button, a, span'))
        .map(el => el.innerText.trim())
        .filter(t => ['All Fits', 'Tees & Hoodies', 'Denims & Cargos', 'Streetwear'].includes(t));

      const bodyText = document.body.innerText;
      const hasOldSareeOnly = bodyText.includes('Handcrafted silken drapes & designer outfits from Sitabuldi & Dharampeth');
      const hasSitabuldiOnly = bodyText.includes('across Sitabuldi & Dharampeth') || bodyText.includes('across Sitabuldi, Dharampeth');

      return {
        searchPlaceholder,
        pills: [...new Set(pills)],
        hasOldSareeOnly,
        hasSitabuldiOnly,
      };
    });
    console.log('  Storefront metrics:', storefrontMetrics);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'critic_final_storefront.png') });
    results.storefront = {
      searchPlaceholderShort: storefrontMetrics.searchPlaceholder === 'Search tees, hoodies, denims...',
      streetwearCategoriesPresent: storefrontMetrics.pills.length >= 2,
      noSitabuldiOnlyRestriction: !storefrontMetrics.hasSitabuldiOnly,
    };

    // ==========================================
    // 3. PRODUCT DETAIL (PDP)
    // ==========================================
    console.log('\n--- 3. Testing Product Detail Page ---');
    await page.evaluate(() => {
      window.__NAV__.navigate('ProductDetail', {
        product: {
          id: 'kp-tee-oversized-noir',
          title: 'Heavyweight Boxy Graphic Tee',
          brand: 'Thread & Bone',
          price: 1890,
          originalPrice: 2490,
          discount: '24% OFF',
          storeArea: 'NAGPUR CENTRAL',
          sizes: ['M', 'L', 'XL'],
          colors: ['Vintage Washed Black', 'Off-White'],
          primaryImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=900'
        }
      });
    });
    await sleep(1200);

    const pdpMetrics = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const btns = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
      const hasInstantCheckout = btns.some(t => t.includes('Instant Checkout') || t.includes('Add to Bag'));
      const hasOldAcquireNow = btns.some(t => t.includes('Acquire Now'));
      const hasDharampethHeritage = bodyText.includes('Anamika\'s studio has revitalized traditional Vidarbha handloom');

      return {
        hasInstantCheckout,
        hasOldAcquireNow,
        hasDharampethHeritage,
      };
    });
    console.log('  PDP metrics:', pdpMetrics);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'critic_final_pdp.png') });
    results.pdp = {
      hasInstantCheckout: pdpMetrics.hasInstantCheckout,
      noOldAcquireNow: !pdpMetrics.hasOldAcquireNow,
      modernCopy: !pdpMetrics.hasDharampethHeritage,
    };

    // ==========================================
    // 4. SHOPPING BAG / CART
    // ==========================================
    console.log('\n--- 4. Testing Shopping Bag Screen ---');
    await page.evaluate(() => {
      window.__NAV__.navigate('Cart');
    });
    await sleep(1200);

    const cartMetrics = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPromoCoupon: text.includes('TRY60') || text.includes('₹150 OFF'),
        hasExpressPickup: text.includes('Express pickup from verified Nagpur boutiques'),
        hasOldMultiBoutique: text.includes('Dharampeth & Gandhibagh'),
        hasOldSitabuldiVault: text.includes('Sitabuldi Luxury Vault'),
      };
    });
    console.log('  Cart metrics:', cartMetrics);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'critic_final_cart.png') });
    results.cart = {
      hasPromoCoupon: cartMetrics.hasPromoCoupon,
      hasExpressPickup: cartMetrics.hasExpressPickup,
      noOldMultiBoutique: !cartMetrics.hasOldMultiBoutique,
      noOldSitabuldiVault: !cartMetrics.hasOldSitabuldiVault,
    };

    // ==========================================
    // 5. LIVE TRACKING / ORDERS
    // ==========================================
    console.log('\n--- 5. Testing Live Tracking Screen ---');
    await page.evaluate(() => {
      window.__NAV__.navigate('LiveTracking');
    });
    await sleep(1200);

    const trackingMetrics = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPackedStep: text.includes('Packed') || text.includes('PACKED'),
        hasNagpurHomeLive: text.includes('Nagpur Home') || text.includes('NAGPUR'),
        hasOldTailoredStep: text.includes('>Tailored<') || (text.includes('Tailored') && !text.includes('fit profile')),
        hasOldSitabuldiBadge: text.includes('Home · Sitabuldi') || text.includes('HOME · SITABULDI'),
        hasOldAmravatiRd: text.includes('Dispatched via Amravati Rd'),
      };
    });
    console.log('  Live tracking metrics:', trackingMetrics);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'critic_final_tracking.png') });
    results.tracking = {
      hasPackedStep: trackingMetrics.hasPackedStep,
      noOldSitabuldiBadge: !trackingMetrics.hasOldSitabuldiBadge,
      noOldAmravatiRd: !trackingMetrics.hasOldAmravatiRd,
    };

    // ==========================================
    // 6. PROFILE SCREEN
    // ==========================================
    console.log('\n--- 6. Testing Profile Screen ---');
    await page.evaluate(() => {
      window.__NAV__.navigate('Profile');
    });
    await sleep(1200);

    const profileMetrics = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasNagpurAddress: text.includes('Home (Nagpur Central), Office (Civil Lines)') || text.includes('Nagpur'),
        hasOldSitabuldiProfile: text.includes('Home (Sitabuldi), Studio (Dharampeth)'),
      };
    });
    console.log('  Profile metrics:', profileMetrics);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'critic_final_profile.png') });
    results.profile = {
      hasNagpurAddress: profileMetrics.hasNagpurAddress,
      noOldSitabuldiProfile: !profileMetrics.hasOldSitabuldiProfile,
    };

    // ==========================================
    // 7. VENDOR REGISTRATION
    // ==========================================
    console.log('\n--- 7. Testing Vendor Registration Screen ---');
    await page.evaluate(() => {
      window.__NAV__.navigate('VendorRegister');
    });
    await sleep(1200);

    const vendorMetrics = await page.evaluate(() => {
      const shopInput = document.querySelector('#shop-name') || document.querySelector('input[placeholder*="Urban"]');
      const placeholder = shopInput ? shopInput.getAttribute('placeholder') : '';
      const text = document.body.innerText;
      return {
        placeholder,
        hasSymbiMerch: text.includes('Symbi Merch') || placeholder.includes('Symbi Merch'),
        hasDevD: text.includes('Dev D'),
        hasWhiteGloveHanging: text.includes('45-min White Glove Porter:'),
      };
    });
    console.log('  Vendor metrics:', vendorMetrics);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'critic_final_vendor.png') });
    results.vendor = {
      placeholderClean: vendorMetrics.placeholder === 'e.g. Urban Thread Co.',
      noSymbiMerch: !vendorMetrics.hasSymbiMerch,
      noDevD: !vendorMetrics.hasDevD,
      noHangingWhiteGlove: !vendorMetrics.hasWhiteGloveHanging,
    };

    console.log('\n======================================================');
    console.log('⭐ COMPLETE VERIFICATION AUDIT RESULTS:');
    console.log(JSON.stringify(results, null, 2));
    console.log('======================================================');

  } catch (err) {
    console.error('Audit suite error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
