import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function run() {
  console.log("🚀 Starting E2E Verification for Vendor Register Button & Copy...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  console.log("📱 Navigating to http://localhost:4173/app ...");
  await page.goto("http://localhost:4173/app", { waitUntil: "networkidle", timeout: 20000 });

  // 1. Check Welcome Screen & Click Log In to reach Auth Screen
  console.log("Waiting for Welcome screen...");
  await page.waitForSelector("text=Kya Pehnu?", { timeout: 10000 });

  const loginBtn = page.locator("button:has-text(\"Log In\")").first();
  await loginBtn.click();
  await page.waitForTimeout(1000);

  // 2. Verify Auth Screen Vendor Callout Copy
  console.log("Verifying Auth screen vendor callout...");
  const authContent = await page.content();
  
  if (!authContent.includes("Want to Sell on Kya Pehnu?")) {
    throw new Error("Missing 'Want to Sell on Kya Pehnu?' headline on Auth screen!");
  }
  console.log("✅ 'Want to Sell on Kya Pehnu?' headline is present on Auth screen.");

  const screenshotDir = path.resolve("/Users/devdhapodkar/.gemini/antigravity/brain/399e6f6c-3302-4b92-8e46-629b70473717/scratch");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  await page.screenshot({ path: path.join(screenshotDir, "auth_screen_want_to_sell.png"), fullPage: true });

  if (authContent.includes("Own a Boutique in Nagpur?")) {
    throw new Error("Old copy 'Own a Boutique in Nagpur?' is still present on Auth screen!");
  }
  console.log("✅ Old copy 'Own a Boutique in Nagpur?' successfully replaced.");

  // 3. Click Register button on the vendor callout
  console.log("Clicking 'Register' button on vendor callout...");
  const vendorRegisterBtn = page.locator('[data-action="register-vendor"]').first();
  await vendorRegisterBtn.click();
  await page.waitForTimeout(1500);

  // 4. Assert navigation to VendorRegister screen
  const screenContentAfterClick = await page.content();
  const onVendorRegister = 
    screenContentAfterClick.includes("Register Your Shop") ||
    screenContentAfterClick.includes("Store Name") ||
    screenContentAfterClick.includes("Boutique") ||
    screenContentAfterClick.includes("Vendor") ||
    screenContentAfterClick.includes("GSTIN") ||
    screenContentAfterClick.includes("Shop / Atelier Name");

  console.log("Vendor Register check:", onVendorRegister);
  if (!onVendorRegister) {
    throw new Error("Failed to navigate to VendorRegister screen after clicking Register button!");
  }
  console.log("✅ Successfully navigated to VendorRegister screen!");

  const screenshotPath = path.join(screenshotDir, "vendor_register_nav_verified.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved to ${screenshotPath}`);

  if (pageErrors.length > 0) {
    console.warn("⚠️ Page errors logged during test:", pageErrors);
  }

  await browser.close();
  console.log("🎉 All vendor register button verifications passed successfully!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
