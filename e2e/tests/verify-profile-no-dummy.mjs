import { chromium } from 'playwright';

async function testProfileNoDummy() {
  console.log('--- Starting Profile Screen Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // Mobile iPhone XR/11 viewport
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();
  const baseUrl = 'http://localhost:4173/app';

  try {
    console.log(`Navigating to ${baseUrl}...`);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // If on Welcome screen, click "Explore Looks" to enter storefront
    const guestBtn = page.getByRole('button', { name: /(Explore Looks|Explore Storefront as Guest|Browse Catalog as guest)/i }).first();
    if (await guestBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('Clicking Explore Looks on Welcome screen...');
      await guestBtn.click();
      await page.waitForTimeout(2000);
    }

    // Navigate to Profile & Settings screen via bottom nav
    console.log('Navigating to Profile...');
    const accountTab = page.locator('nav button:has-text("Account"), nav a[data-path="client-account"], nav a:has-text("Account")').first();
    if (await accountTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountTab.click();
    } else {
      await page.evaluate(() => {
        if (window.__kyapehnu?.navigationRef?.current) {
          window.__kyapehnu.navigationRef.current.navigate('Profile');
        }
      });
    }

    // Wait for Profile & Settings header
    await page.locator('text=Profile & Settings').first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Take screenshot of initial Profile
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/profile_initial.png' });
    console.log('Captured profile_initial.png');

    // 1. Assert NO dummy data strings in Profile container
    const profileContainer = page.locator('main').first();
    const content = await profileContainer.innerHTML();
    const dummyStrings = [
      'Radhika Deshmukh',
      'Studio Anamika',
      '4 Orders Completed',
      'Home (Sitabuldi), Studio (Dharampeth)',
      'Blouse 34", Angrakha 38", Kurta M',
      'AB6AXuBxfpv', // Stock photo fragment
      'AB6AXuAHnFy', // Stock thumbnail fragment
    ];

    let dummyFound = 0;
    for (const d of dummyStrings) {
      if (content.includes(d)) {
        console.error(`FAILED: Found dummy placeholder "${d}" in Profile screen!`);
        const idx = content.indexOf(d);
        console.error(`Snippet: ...${content.slice(Math.max(0, idx - 100), idx + 150)}...`);
        dummyFound++;
      } else {
        console.log(`PASSED: No occurrence of "${d}" in Profile screen`);
      }
    }

    if (dummyFound > 0) {
      throw new Error(`Found ${dummyFound} dummy placeholders in Profile screen!`);
    }

    // 2. Test Measurements Modal
    console.log('Testing Bespoke Measurements Modal...');
    const mainLinks = await page.$$eval('main a', (els) => els.map(e => e.outerHTML));
    console.log('Main links count:', mainLinks.length);
    console.log('Main links:', mainLinks);
    const measurementsRow = page.locator('[data-action="open-measurements"]').first();
    await measurementsRow.click();
    await page.waitForTimeout(600);
    const measurementsModal = page.locator('#measurementsModal');
    if (!(await measurementsModal.isVisible())) {
      throw new Error('Measurements modal did not open!');
    }
    console.log('Measurements modal opened successfully.');

    // Select XL and 38"
    await page.locator('#measurementsModal').getByRole('button', { name: 'XL', exact: true }).click();
    await page.locator('#measurementsModal').getByRole('button', { name: '38"', exact: true }).click();
    await page.locator('#saveMeasurementsBtn').click();
    await page.waitForTimeout(600);

    // Verify row updated
    const updatedContent = await page.content();
    if (!updatedContent.includes('Kurta XL') || !updatedContent.includes('Blouse 38"')) {
      throw new Error('Profile row did not update with new measurements!');
    }
    console.log('PASSED: Measurements updated dynamically to Kurta XL, Blouse 38"');

    // 3. Test Concierge Modal
    console.log('Testing Concierge Modal...');
    const conciergeRow = page.locator('[data-action="open-concierge"]').first();
    await conciergeRow.click();
    await page.waitForTimeout(600);
    const conciergeModal = page.locator('#conciergeModal');
    if (!(await conciergeModal.isVisible())) {
      throw new Error('Concierge modal did not open!');
    }
    console.log('Concierge modal opened successfully.');
    await conciergeModal.getByRole('button', { name: 'Close', exact: true }).click();
    await page.waitForTimeout(400);

    // 4. Test Silk Mark & Authenticity Modal
    console.log('Testing Authenticity Modal...');
    const authRow = page.locator('[data-action="open-authenticity"]').first();
    await authRow.click();
    await page.waitForTimeout(600);
    const authModal = page.locator('#authenticityModal');
    if (!(await authModal.isVisible())) {
      throw new Error('Authenticity modal did not open!');
    }
    console.log('Authenticity modal opened successfully.');
    await authModal.getByRole('button', { name: 'Close Dossier', exact: true }).click();
    await page.waitForTimeout(400);

    // 5. Test Edit Profile Modal
    console.log('Testing Edit Profile Modal...');
    const editProfileBtn = page.locator('[data-action="edit-profile"]').first();
    await editProfileBtn.click();
    await page.waitForTimeout(600);
    const editModal = page.locator('#editProfileModal');
    if (!(await editModal.isVisible())) {
      throw new Error('Edit Profile modal did not open!');
    }
    console.log('Edit Profile modal opened successfully.');
    await page.locator('#profileNameInput').fill('Meena Dhapodkar');
    await page.locator('#profilePhoneInput').fill('+91 98230 45892');
    await page.locator('#editProfileModal button:has-text("Dharampeth")').click();
    await page.locator('#saveProfileBtn').click();
    await page.waitForTimeout(600);

    // Take screenshot of final Profile
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/profile_final.png' });
    console.log('Captured profile_final.png');

    console.log('ALL PROFILE SCREEN CHECKS PASSED PERFECTLY!');
  } catch (err) {
    console.error('Test failed:', err);
    await page.screenshot({ path: '/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch/profile_error.png' });
    throw err;
  } finally {
    await browser.close();
  }
}

testProfileNoDummy();
