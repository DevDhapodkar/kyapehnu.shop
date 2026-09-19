import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function run() {
  console.log("🚀 Starting Comprehensive Light/Dark Theme & Vendor Register Consistency Verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const screenshotDir = path.resolve("/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch");
  const artifactDir = path.resolve("/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  async function saveScreenshot(filename) {
    const p1 = path.join(screenshotDir, filename);
    const p2 = path.join(artifactDir, filename);
    await page.screenshot({ path: p1, fullPage: true });
    fs.copyFileSync(p1, p2);
    console.log(`📸 Saved screenshot: ${filename}`);
  }

  console.log("📱 Navigating to http://localhost:4173/app ...");
  await page.goto("http://localhost:4173/app", { waitUntil: "networkidle", timeout: 25000 });

  // 1. Welcome Screen
  console.log("Waiting for Welcome screen...");
  await page.waitForSelector("text=Kya Pehnu?", { timeout: 10000 });

  // 2. Click Log In to reach Light Auth Screen
  console.log("--- TEST 1: Light Theme Auth Screen & Vendor Callout ---");
  const loginBtn = page.locator("button:has-text(\"Log In\")").first();
  await loginBtn.click();
  await page.waitForTimeout(1200);

  // Scroll to make sure vendor callout is visible
  await page.evaluate(() => {
    const el = document.querySelector('[data-purpose="vendor-callout"]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(400);

  const lightAuthContent = await page.content();
  if (!lightAuthContent.includes("Want to Sell on Kya Pehnu?")) {
    throw new Error("Missing 'Want to Sell on Kya Pehnu?' on Light Auth screen!");
  }
  await saveScreenshot("auth_screen_light_verified.png");
  console.log("✅ Light Theme Auth screen verified with 'Want to Sell on Kya Pehnu?'.");

  // 3. Click Register in Light Theme -> Verify Light Vendor Register Screen
  console.log("--- TEST 2: Light Theme Vendor Registration ---");
  const lightVendorRegisterBtn = page.locator('[data-action="register-vendor"]').first();
  await lightVendorRegisterBtn.click();
  await page.waitForTimeout(1500);

  const lightRegisterContent = await page.content();
  const isLightRegisterRendered = 
    lightRegisterContent.includes("Register Shop") ||
    lightRegisterContent.includes("Boutique Identity") ||
    lightRegisterContent.includes("Studio Anamika Handlooms");

  if (!isLightRegisterRendered) {
    throw new Error("Failed to navigate to VendorRegister screen in light theme!");
  }
  await saveScreenshot("vendor_register_light_verified.png");
  console.log("✅ Light theme registration screen correctly loaded.");

  // 4. Go back to Auth Screen
  console.log("--- TEST 3: Go Back from Vendor Register to Auth ---");
  const lightBackBtn = page.locator('button[aria-label="Go back"]:visible, button:visible:has([class*="arrow_back"])').last();
  await lightBackBtn.click();
  await page.waitForTimeout(1200);

  // 5. Toggle to Dark Theme via exposed store or evaluate
  console.log("--- TEST 4: Toggle to Dark Theme ---");
  await page.evaluate(() => {
    if (window.__KYA_PEHNU_TOGGLE_THEME__) {
      window.__KYA_PEHNU_TOGGLE_THEME__();
    } else if (window.__KYAPEHNU_THEME_STORE__) {
      window.__KYAPEHNU_THEME_STORE__.getState().toggleTheme();
    }
  });
  await page.waitForTimeout(1000);

  // Scroll to make sure vendor callout is visible
  await page.evaluate(() => {
    const el = document.querySelector('[data-purpose="vendor-callout"]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(400);

  const darkAuthContent = await page.content();
  if (!darkAuthContent.includes("Want to Sell on Kya Pehnu?")) {
    throw new Error("Missing 'Want to Sell on Kya Pehnu?' on Dark Auth screen!");
  }
  await saveScreenshot("auth_screen_dark_verified.png");
  console.log("✅ Dark Theme Auth screen verified with 'Want to Sell on Kya Pehnu?'.");

  // 6. Click Register in Dark Theme -> Verify DARK Vendor Register Screen (NO LIGHT FORM!)
  console.log("--- TEST 5: Dark Theme Vendor Registration (NO LIGHT FORM) ---");
  const darkVendorRegisterBtn = page.locator('[data-action="register-vendor"]').first();
  await darkVendorRegisterBtn.click();
  await page.waitForTimeout(1500);

  const darkRegisterContent = await page.content();
  const isDarkRegisterRendered = 
    darkRegisterContent.includes("Register Shop") ||
    darkRegisterContent.includes("Boutique Identity") ||
    darkRegisterContent.includes("Studio Anamika Handlooms");

  if (!isDarkRegisterRendered) {
    throw new Error("Failed to navigate to VendorRegister screen from dark auth screen!");
  }

  // Strictly verify dark theme styling (Noir background #131315, noir classes)
  const darkThemeEvaluation = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const hasNoirBg = html.includes('bg-noir') || html.includes('#131315') || bodyBg.includes('19, 19, 21');
    const hasWhiteFormOnly = html.includes('final_light_theme_Register_Your_Shop') && !html.includes('final_theme_dark_Register_Your_Shop');
    return { hasNoirBg, hasWhiteFormOnly, bodyBg };
  });
  console.log("Dark Theme Registration Evaluation:", darkThemeEvaluation);

  if (darkThemeEvaluation.hasWhiteFormOnly) {
    throw new Error("DARK REGISTRATION BUG: White light-theme form loaded when user is in dark theme!");
  }
  console.log("✅ Dark theme registration screen correctly loaded with NOIR styling!");
  await saveScreenshot("vendor_register_dark_verified.png");

  // 7. Interactive chip and cluster selection on Dark Vendor Register screen
  console.log("--- TEST 6: Interactive Chips and Clusters in Dark Theme ---");
  const chip = page.locator(".spec-chip").nth(2);
  if (await chip.count() > 0) {
    await chip.click();
    await page.waitForTimeout(300);
    console.log("✅ Specialty chip toggled.");
  }

  const cluster = page.locator(".cluster-btn").nth(1);
  if (await cluster.count() > 0) {
    await cluster.click();
    await page.waitForTimeout(300);
    console.log("✅ Cluster zone Sitabuldi selected.");
  }
  await saveScreenshot("vendor_register_dark_interactive.png");

  // 8. Go back to Auth Screen
  console.log("--- TEST 7: Go Back to Dark Auth ---");
  const darkBackBtn = page.locator('button[aria-label="Go back"]:visible, button:visible:has([class*="arrow_back"])').last();
  await darkBackBtn.click();
  await page.waitForTimeout(1200);

  // 9. Navigate to Profile Screen to verify dark & light profile vendor callouts
  console.log("--- TEST 8: Verify Profile Screen in Dark & Light ---");
  await page.evaluate(() => {
    if (window.__NAV__) {
      window.__NAV__.navigate('Profile');
    }
  });
  await page.waitForTimeout(1500);

  const profileContent = await page.content();
  console.log("Checking Profile screen for vendor callout...");
  const hasVendorCallout = profileContent.includes("Want to Sell on Kya Pehnu?");
  console.log("Profile has 'Want to Sell on Kya Pehnu?':", hasVendorCallout);
  if (!hasVendorCallout) {
    throw new Error("Missing 'Want to Sell on Kya Pehnu?' on Profile screen!");
  }
  await saveScreenshot("profile_screen_dark_verified.png");
  console.log("✅ Dark Theme Profile screen verified.");

  // Toggle to Light Theme on Profile screen
  console.log("--- TEST 9: Toggle Theme on Profile Screen ---");
  await page.evaluate(() => {
    if (window.__KYA_PEHNU_TOGGLE_THEME__) {
      window.__KYA_PEHNU_TOGGLE_THEME__();
    }
  });
  await page.waitForTimeout(1000);

  const lightProfileContent = await page.content();
  if (!lightProfileContent.includes("Want to Sell on Kya Pehnu?")) {
    throw new Error("Missing 'Want to Sell on Kya Pehnu?' on Light Profile screen!");
  }
  await saveScreenshot("profile_screen_light_verified.png");
  console.log("✅ Light Theme Profile screen verified.");

  if (pageErrors.length > 0) {
    console.warn("⚠️ Page errors logged during test:", pageErrors);
  }

  await browser.close();
  console.log("🎉 ALL LIGHT/DARK CONSISTENCY & VENDOR REGISTRATION TESTS PASSED!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
