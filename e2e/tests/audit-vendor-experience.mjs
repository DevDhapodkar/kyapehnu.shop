import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = process.env.TARGET_URL || 'https://www.kyapehnu.shop/app';
const SCREENSHOT_DIR = path.resolve('tests/screenshots/vendor-audit');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVendorAudit() {
  console.log('===============================================================');
  console.log('  KYA PEHNU? — COMPREHENSIVE MOBILE VENDOR EXPERIENCE AUDIT');
  console.log(`  Target: ${TARGET_URL}`);
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  const auditReport = {
    networkErrors: [],
    consoleErrors: [],
    consoleWarnings: [],
    dummyButtons: [],
    brokenImages: [],
    visualIssues: [],
    flowResults: {},
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      auditReport.consoleErrors.push(msg.text());
      console.log(`  [Console Error]: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      auditReport.consoleWarnings.push(msg.text());
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      auditReport.networkErrors.push({
        url: res.url(),
        status: res.status(),
        statusText: res.statusText(),
      });
      console.log(`  [Network ${res.status()}]: ${res.url()}`);
    }
  });

  try {
    // -------------------------------------------------------------
    // 1. Initial Load & Welcome Screen
    // -------------------------------------------------------------
    console.log('--- 1. Testing Welcome Screen & Mobile Layout ---');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_welcome.png') });

    // Check broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    if (brokenImages.length > 0) {
      auditReport.brokenImages.push(...brokenImages);
      console.log(`  [Broken Images found]: ${brokenImages.length}`);
    }

    // -------------------------------------------------------------
    // 2. Account Creation / Auth Screen as Mobile User
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Mobile Account Creation / Auth ---');
    const authBtn = page.locator('a[href*="auth" i], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Account")').locator('visible=true').first();
    if (await authBtn.isVisible()) {
      await authBtn.click();
    } else {
      // Enter through Explore Looks then Profile
      const exploreBtn = page.locator('button:has-text("Explore Looks"), button:has-text("Explore Storefront"), button:has-text("Enter Atelier")').locator('visible=true').first();
      if (await exploreBtn.isVisible()) {
        await exploreBtn.click();
        await page.waitForTimeout(2000);
      }
      // Click profile avatar in header
      const prof = page.locator('header [aria-label*="Profile" i], header img[alt*="Profile" i]').locator('visible=true').first();
      if (await prof.isVisible()) {
        await prof.click();
        await page.waitForTimeout(2000);
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_storefront_or_auth.png') });

    // If on customer Profile, test Register Your Boutique or Vendor Mode Toggle
    console.log('\n--- 3. Testing Boutique Registration Flow ---');
    let onProfile = (await page.textContent('body')).includes('Vendor Atelier Mode') || (await page.textContent('body')).includes('Register Your Boutique');
    if (!onProfile) {
      // Navigate to profile from header
      const prof = page.locator('header [aria-label*="Profile" i], header img[alt*="Profile" i]').locator('visible=true').first();
      if (await prof.isVisible()) {
        await prof.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_patron_profile.png') });

    // Test clicking "Register Your Boutique"
    const regBoutique = page.locator('[data-action="register-vendor"], :text("Register Your Boutique"), button:has-text("Register Your Boutique")').locator('visible=true').first();
    if (await regBoutique.isVisible()) {
      console.log('  Found "Register Your Boutique". Clicking...');
      await regBoutique.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_vendor_register_form.png') });

      // Inspect form and test all inputs & dummy buttons
      const regInputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
          id: i.id,
          placeholder: i.placeholder,
          type: i.type,
          value: i.value,
        }));
      });
      console.log('  Registration inputs detected:', regInputs);

      // Check dummy buttons on Registration Screen
      const regButtons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a[role="button"]'));
        return btns.map(b => ({
          text: b.textContent.trim().replace(/\s+/g, ' '),
          id: b.id,
          hasAction: !!(b.getAttribute('onclick') || b.id || b.getAttribute('data-action')),
        }));
      });
      console.log('  Registration buttons:', regButtons);

      // Fill in and submit
      const shopInput = page.locator('#shop-name, input[placeholder*="Studio Anamika" i]').first();
      const propInput = page.locator('#proprietor-name, input[placeholder*="Anamika Joshi" i]').first();
      const phoneInput = page.locator('#whatsapp-contact, input[type="tel"]').first();
      if (await shopInput.isVisible()) await shopInput.fill('Dhapodkar Silks Nagpur');
      if (await propInput.isVisible()) await propInput.fill('Dev Dhapodkar');
      if (await phoneInput.isVisible()) await phoneInput.fill('9823011492');

      const submitReg = page.locator('#submit-btn, button[id*="submit-btn"], button:has-text("Register")').locator('visible=true').first();
      if (await submitReg.isVisible()) {
        console.log('  Submitting Boutique Registration...');
        await submitReg.click();
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('  "Register Your Boutique" not found directly, toggling Vendor Atelier Mode...');
      const vendorToggle = page.locator('#vendorModeToggle, [data-action="toggle-vendor-mode"], label:has-text("Vendor Atelier Mode") input, label:has-text("Vendor") input').first();
      if (await vendorToggle.isVisible()) {
        await vendorToggle.click({ force: true });
        await page.waitForTimeout(3000);
      } else {
        await page.evaluate(() => {
          if (window.__AUTH_STORE__) {
            window.__AUTH_STORE__.getState().setRole('VENDOR');
          }
        });
        await page.waitForTimeout(2000);
      }
    }

    // -------------------------------------------------------------
    // 4. Vendor Order Queue Screen Audit
    // -------------------------------------------------------------
    console.log('\n--- 4. Auditing Vendor Order Queue Screen ---');
    // Ensure on Vendor Queue
    const queueNav = page.locator('nav a[data-path="production-queue"], nav a:has-text("Queue")').locator('visible=true').first();
    if (await queueNav.isVisible()) {
      await queueNav.click({ force: true });
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_vendor_order_queue.png') });

    // Inspect all buttons and links on the Order Queue screen
    const queueElements = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a, input, [role="button"]'));
      return items.map(el => ({
        tag: el.tagName,
        id: el.id,
        text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 50),
        className: el.className,
        href: el.getAttribute('href'),
        visible: el.offsetParent !== null,
        bbox: el.getBoundingClientRect(),
      }));
    });
    console.log(`  Total interactive elements on Queue: ${queueElements.length}`);

    // Check for dummy buttons on Queue screen
    const dummyOnQueue = queueElements.filter(el => 
      el.visible && 
      (el.href === '#' || !el.href) && 
      el.tag === 'BUTTON' && 
      !el.id && 
      (el.text.includes('Review Tailoring') || el.text.includes('Notify Porter') || el.text.includes('Track') || el.text.includes('Filter'))
    );
    if (dummyOnQueue.length > 0) {
      console.log('  [Potential Dummy Buttons on Queue]:', dummyOnQueue.map(d => d.text));
      auditReport.dummyButtons.push(...dummyOnQueue.map(d => ({ screen: 'OrderQueue', text: d.text })));
    }

    // Test clicking tabs on Queue (All, New Queue, Tailoring/Packing, Dispatched)
    console.log('  Testing Queue tab filters...');
    const queueTabs = page.locator('.queue-tab, [data-filter], button:has-text("Queue"), button:has-text("Tailoring"), button:has-text("Dispatched")');
    const tabCount = await queueTabs.count();
    for (let i = 0; i < tabCount; i++) {
      const tab = queueTabs.nth(i);
      if (await tab.isVisible()) {
        const text = await tab.textContent();
        console.log(`    Clicking queue tab: "${text.trim()}"`);
        await tab.click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_queue_tab_filtered.png') });

    // Test online/offline status switch
    const toggleAtelierBtn = page.locator('#toggleAtelierBtn, [aria-label*="Online Status" i]').first();
    if (await toggleAtelierBtn.isVisible()) {
      console.log('  Clicking atelier online status toggle button...');
      await toggleAtelierBtn.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // Test clicking "Review Tailoring Specs & Measurements"
    const reviewSpecsBtn = page.locator('button:has-text("Review Tailoring Specs")').first();
    if (await reviewSpecsBtn.isVisible()) {
      console.log('  Clicking "Review Tailoring Specs & Measurements"...');
      await reviewSpecsBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Test clicking "Notify Porter Rider · Handover Station"
    const notifyPorterBtn = page.locator('button:has-text("Notify Porter Rider")').first();
    if (await notifyPorterBtn.isVisible()) {
      console.log('  Clicking "Notify Porter Rider · Handover Station"...');
      await notifyPorterBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }

    // -------------------------------------------------------------
    // 5. Vendor Order Detail Screen Audit
    // -------------------------------------------------------------
    console.log('\n--- 5. Auditing Vendor Order Detail Screen ---');
    // Click on order card or View Details
    const orderCard = page.locator('.order-card, [data-order-id], article:has-text("Order #")').first();
    if (await orderCard.isVisible()) {
      await orderCard.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_vendor_order_detail.png') });

    // Inspect buttons on Order Detail screen
    const detailButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, input[type="checkbox"]'));
      return btns.map(b => ({
        tag: b.tagName,
        id: b.id,
        text: b.textContent?.trim().replace(/\s+/g, ' ').slice(0, 50),
        type: b.getAttribute('type'),
        visible: b.offsetParent !== null,
      }));
    });
    console.log('  Interactive items on Order Detail:', detailButtons);

    // Test Print Garment Tag
    const printTagBtn = page.locator('button:has-text("Print Garment Tag")').first();
    if (await printTagBtn.isVisible()) {
      console.log('  Testing "Print Garment Tag" button...');
      await printTagBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    } else {
      auditReport.dummyButtons.push({ screen: 'OrderDetail', text: 'Print Garment Tag missing or not interactive' });
    }

    // Test Stylist Desk
    const stylistDeskBtn = page.locator('button:has-text("Stylist Desk")').first();
    if (await stylistDeskBtn.isVisible()) {
      console.log('  Testing "Stylist Desk" button...');
      await stylistDeskBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Test checklists / checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const chkCount = await checkboxes.count();
    console.log(`  Found ${chkCount} checkboxes on Order Detail`);
    for (let i = 0; i < chkCount; i++) {
      await checkboxes.nth(i).click({ force: true }).catch(() => {});
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_order_detail_checked.png') });

    // Test back button
    const backBtn = page.locator('header button:has-text("arrow_back"), [aria-label*="Back" i], button:has-text("Queue")').locator('visible=true').first();
    if (await backBtn.isVisible()) {
      console.log('  Navigating back to Queue...');
      await backBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    // -------------------------------------------------------------
    // 6. Catalogue Manager Screen Audit
    // -------------------------------------------------------------
    console.log('\n--- 6. Auditing Catalogue Manager Screen ---');
    const catNav = page.locator('nav a[data-path="boutique-catalogue"], nav a:has-text("Catalogue")').locator('visible=true').first();
    await catNav.click({ force: true });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_catalog_manager.png') });

    // Check search input functionality
    const searchInput = page.locator('#catalogueSearch, input[placeholder*="Search weave" i]').first();
    if (await searchInput.isVisible()) {
      console.log('  Testing catalogue search input...');
      await searchInput.fill('Chanderi');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_catalog_search.png') });
      await searchInput.fill('');
      await page.waitForTimeout(500);
    } else {
      auditReport.visualIssues.push({ screen: 'CatalogManager', issue: 'Catalogue search input not visible' });
    }

    // Check category filter pills
    const filterPills = page.locator('.filter-pill, #categoryRail button');
    const pillCount = await filterPills.count();
    console.log(`  Found ${pillCount} category filter pills`);
    for (let i = 0; i < pillCount; i++) {
      const pill = filterPills.nth(i);
      const text = await pill.textContent();
      console.log(`    Testing category pill: "${text.trim()}"`);
      await pill.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // Check QR tag scan button
    const qrBtn = page.locator('[aria-label*="Scan SKU" i], button:has([viewBox*="24 24"])').first();
    if (await qrBtn.isVisible()) {
      console.log('  Clicking Scan SKU QR button...');
      await qrBtn.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // Check Quick Edit 3-dots buttons on products
    const quickEditBtns = page.locator('button[title*="Quick edit" i], button:has-text("more_vert")');
    const qeCount = await quickEditBtns.count();
    console.log(`  Found ${qeCount} quick edit buttons`);
    if (qeCount > 0) {
      await quickEditBtns.first().click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // Check size / stock ledger buttons (XS, S, M, L, XL)
    const sizeBtns = page.locator('button:has-text("XS"), button:has-text("S"), button:has-text("M"), button:has-text("L")');
    const sizeCount = await sizeBtns.count();
    console.log(`  Found ${sizeCount} size ledger buttons`);
    if (sizeCount > 0) {
      await sizeBtns.first().click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // -------------------------------------------------------------
    // 7. Product Ingestion Form Audit
    // -------------------------------------------------------------
    console.log('\n--- 7. Auditing Product Ingestion Form ---');
    const addPieceBtn = page.locator('#addPieceBtn, button:has-text("Ingest Piece"), button:has-text("Add Piece")').first();
    await addPieceBtn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_product_ingestion.png') });

    // Inspect all form inputs and sections
    const ingestionFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea, button'));
      return inputs.map(i => ({
        tag: i.tagName,
        id: i.id,
        type: i.type,
        placeholder: i.placeholder,
        text: i.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40),
        visible: i.offsetParent !== null,
      }));
    });
    console.log('  Ingestion Form controls count:', ingestionFields.length);

    // Test filling all available fields
    const titleInp = page.locator('#productTitle, input[placeholder*="Handwoven" i]').first();
    if (await titleInp.isVisible()) await titleInp.fill('Nagpur Heritage Paithani Kurta');

    const descInp = page.locator('#productDescription, textarea, input[placeholder*="description" i]').first();
    if (await descInp.isVisible()) await descInp.fill('Pure Mulberry silk with handwoven gold zari borders crafted in Gandhibagh, Nagpur.');

    const priceInp = page.locator('#sellingPriceInput, input[placeholder*="4800" i]').first();
    if (await priceInp.isVisible()) await priceInp.fill('6200');

    const mrpInp = page.locator('#mrpInput, input[placeholder*="6499" i]').first();
    if (await mrpInp.isVisible()) await mrpInp.fill('8499');

    // Click step navigation or section tabs if present
    const stepButtons = page.locator('button:has-text("Next"), button:has-text("Step"), [data-step]');
    const stepCount = await stepButtons.count();
    console.log(`  Found ${stepCount} step/next buttons on Ingestion form`);
    for (let i = 0; i < stepCount; i++) {
      await stepButtons.nth(i).click().catch(() => {});
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_product_ingestion_filled.png') });

    // Submit Publish
    const pubBtn = page.locator('#publishBtn, button:has-text("Publish Product to Catalog")').first();
    if (await pubBtn.isVisible()) {
      console.log('  Submitting Product Ingestion form...');
      await pubBtn.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_post_publish_catalog.png') });

    // -------------------------------------------------------------
    // 8. Atelier Profile Screen Audit
    // -------------------------------------------------------------
    console.log('\n--- 8. Auditing Atelier Profile Screen ---');
    const atelierNav = page.locator('nav a:has-text("Atelier"), [data-path="atelier-profile"]').locator('visible=true').first();
    if (await atelierNav.isVisible()) {
      await atelierNav.click({ force: true });
    } else {
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('nav a, a[data-path]'));
        const el = els.find(a => (a.textContent && a.textContent.includes('Atelier')) || a.getAttribute('data-path') === 'atelier-profile');
        if (el) el.click();
      });
    }
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_atelier_profile.png') });

    // Check all cards on Atelier Profile
    const profileCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[role="button"], button, a'));
      return cards.map(c => ({
        ariaLabel: c.getAttribute('aria-label'),
        text: c.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60),
        visible: c.offsetParent !== null,
      }));
    });
    console.log('  Atelier Profile cards:', profileCards);

    // -------------------------------------------------------------
    // 9. Boutique Analytics Screen Audit
    // -------------------------------------------------------------
    console.log('\n--- 9. Auditing Boutique Analytics Screen ---');
    const analyticsBtn = page.locator('[aria-label*="Boutique Analytics" i], :text("Boutique Analytics & 60-Min Speed")').first();
    if (await analyticsBtn.isVisible()) {
      console.log('  Opening Boutique Analytics...');
      await analyticsBtn.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_boutique_analytics.png') });

      // Check analytics screen content
      const analyticsText = await page.textContent('body');
      console.log('  Analytics metrics present:', {
        hasVelocity: analyticsText.includes('Velocity') || analyticsText.includes('Revenue') || analyticsText.includes('₹'),
        hasSpeed: analyticsText.includes('60-Min') || analyticsText.includes('Turnaround') || analyticsText.includes('Fulfillment'),
        hasTopStyles: analyticsText.includes('Top') || analyticsText.includes('Styles') || analyticsText.includes('Kurta'),
      });

      // Check Back button from Analytics
      const analyticsBack = page.locator('header button, [aria-label*="Back" i]').first();
      if (await analyticsBack.isVisible()) {
        await analyticsBack.click();
        await page.waitForTimeout(1500);
      }
    } else {
      auditReport.dummyButtons.push({ screen: 'AtelierProfile', text: 'Boutique Analytics card not visible' });
    }

    // -------------------------------------------------------------
    // 10. Visual Misalignments & Viewport Overlaps Check
    // -------------------------------------------------------------
    console.log('\n--- 10. Checking Visual Misalignments & Viewport Collision ---');
    const visualAudit = await page.evaluate(() => {
      const issues = [];
      // 1. Check for horizontal overflow (causes unwanted sideways scroll)
      if (document.documentElement.scrollWidth > window.innerWidth + 2) {
        issues.push({
          type: 'HORIZONTAL_OVERFLOW',
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        });
      }

      // 2. Check for fixed bottom nav obscuring content
      const bottomNav = document.querySelector('nav.fixed.bottom-0');
      if (bottomNav) {
        const navRect = bottomNav.getBoundingClientRect();
        const main = document.querySelector('main');
        if (main) {
          const style = window.getComputedStyle(main);
          const pb = parseInt(style.paddingBottom || '0', 10);
          if (pb < navRect.height) {
            issues.push({
              type: 'BOTTOM_NAV_PADDING_COLLISION',
              paddingBottom: pb,
              navHeight: navRect.height,
            });
          }
        }
      }

      // 3. Check for truncated or clipped text that might look broken
      const allText = Array.from(document.querySelectorAll('h1, h2, h3, p, span'));
      for (const el of allText) {
        if (el.scrollWidth > el.clientWidth && window.getComputedStyle(el).overflow === 'hidden' && !el.className.includes('truncate') && !el.className.includes('line-clamp')) {
          issues.push({
            type: 'TEXT_OVERFLOW_CLIPPING',
            text: el.textContent.trim().slice(0, 40),
            tag: el.tagName,
          });
        }
      }

      return issues;
    });

    auditReport.visualIssues.push(...visualAudit);
    console.log('  Visual issues detected:', visualAudit);

    console.log('\n===============================================================');
    console.log('  AUDIT COMPLETE. SUMMARY OF FINDINGS:');
    console.log(`  - Network Errors (4xx/5xx): ${auditReport.networkErrors.length}`);
    console.log(`  - Console Errors: ${auditReport.consoleErrors.length}`);
    console.log(`  - Dummy Buttons / Unwired Actions: ${auditReport.dummyButtons.length}`);
    console.log(`  - Visual Issues: ${auditReport.visualIssues.length}`);
    console.log(`  - Broken Images: ${auditReport.brokenImages.length}`);
    console.log('===============================================================');

    // Save audit output to file
    fs.writeFileSync('tests/screenshots/vendor-audit/audit-report.json', JSON.stringify(auditReport, null, 2));

  } catch (err) {
    console.error('\n✗ Audit Exception:', err.message);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') }).catch(() => {});
  } finally {
    await browser.close();
  }
}

runVendorAudit();
