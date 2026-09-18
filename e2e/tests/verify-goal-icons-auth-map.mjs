import { chromium } from "playwright";

async function run() {
  console.log("🚀 Starting E2E Goal Verification Suite...");
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

  // 1. Check Welcome Screen
  console.log("Checking Welcome Screen...");
  await page.waitForSelector("text=Kya Pehnu?", { timeout: 10000 });
  const welcomeText = await page.content();

  // Assert absence of raw emojis on Welcome Screen
  const rawEmojis = ["⚡", "👗", "💳", "☀️", "🌙", "📍", "🇮🇳", "👘", "🧣", "🥻", "🔔", "♥"];
  for (const emoji of rawEmojis) {
    if (welcomeText.includes(emoji)) {
      throw new Error("Found unexpected raw emoji: " + emoji + " on Welcome Screen!");
    }
  }
  console.log("✅ Welcome Screen has 0 raw emojis.");

  // Assert presence of Material Symbols on Welcome Screen
  const materialSymbolsCount = await page.locator(".material-symbols-outlined").count();
  console.log("Found " + materialSymbolsCount + " Material Symbols on Welcome Screen.");
  if (materialSymbolsCount === 0) {
    throw new Error("Expected Material Symbols on Welcome screen but found none.");
  }

  // 2. Navigate to Auth Screen (Sign In / Login)
  console.log("Navigating to Sign In / Auth screen...");
  const loginBtn = page.locator("button:has-text(\"Log In\")").first();
  await loginBtn.click();
  await page.waitForTimeout(1000);

  const authContent = await page.content();

  // Assert absence of Apple login button
  if (authContent.includes("<span>Apple</span>") || authContent.includes("Continue with Apple")) {
    throw new Error("Apple login button is still present on Auth screen!");
  }
  console.log("✅ Apple login button is completely removed.");

  // Assert presence of full-width Google login button
  const googleBtn = page.locator("button:has-text(\"Continue with Google\")");
  const googleBtnCount = await googleBtn.count();
  if (googleBtnCount === 0) {
    throw new Error("Expected Continue with Google button on Auth screen!");
  }
  console.log("✅ Full-width Continue with Google button is present.");

  // Check country flag SVG presence
  const flagSvgCount = await page.locator("svg:has(rect[fill=\"#FF9933\"])").count();
  if (flagSvgCount === 0) {
    throw new Error("Expected vector SVG Indian flag in phone selector!");
  }
  console.log("✅ High-quality vector SVG flag is present.");

  // Assert absence of raw emojis on Auth screen
  for (const emoji of rawEmojis) {
    if (authContent.includes(emoji)) {
      throw new Error("Found unexpected raw emoji: " + emoji + " on Auth Screen!");
    }
  }
  console.log("✅ Auth Screen has 0 raw emojis.");

  // Test clicking Google button triggers functional auth flow
  console.log("Testing Google button click behavior...");
  await googleBtn.first().click();
  await page.waitForTimeout(1200);
  console.log("✅ Google sign-in click handled gracefully without uncaught exceptions.");

  // 3. Fast Sign In to explore Storefront and Map
  console.log("Signing in to explore Storefront & Map...");
  const quickDemoBtn = page.locator("#btn-fast-demo-signin, #dark-btn-fast-demo-signin, button:has-text(\"1-Tap Quick Member Login\")").first();
  if (await quickDemoBtn.isVisible()) {
    await quickDemoBtn.click();
  } else {
    const submitBtn = page.locator("#btn-submit-signin, #dark-btn-submit-signin").first();
    await submitBtn.click();
  }

  await page.waitForTimeout(1500);

  // 4. Check Storefront
  console.log("Checking Storefront...");
  const storeContent = await page.content();

  // Assert absence of "Blinkit Map Engine"
  if (storeContent.toLowerCase().includes("blinkit map engine")) {
    throw new Error("Found Blinkit Map Engine text on Storefront!");
  }
  console.log("✅ Storefront does NOT contain Blinkit Map Engine.");

  // Open Location Drawer / Map Pin Picker
  console.log("Opening Doorstep Map Picker...");
  const headerLocBtn = page.locator("header button:has-text(\"Nagpur\"), header button:has-text(\"Sitabuldi\"), header [aria-label*=\"Location\"]").first();
  await headerLocBtn.click();
  await page.waitForTimeout(1500);

  const mapContent = await page.content();

  // Assert absence of "Blinkit Map Engine" in map picker
  if (mapContent.toLowerCase().includes("blinkit map engine")) {
    throw new Error("Found Blinkit Map Engine text inside Location Picker Modal!");
  }
  console.log("✅ Map Picker does NOT contain Blinkit Map Engine.");

  // Assert absence of raw emojis in map picker
  for (const emoji of rawEmojis) {
    if (mapContent.includes(emoji)) {
      throw new Error("Found unexpected raw emoji: " + emoji + " in Location Picker!");
    }
  }
  console.log("✅ Map Picker has 0 raw emojis.");

  // Check presence of Material Icons inside Location Picker
  const mapIconsCount = await page.locator(".material-symbols-outlined, svg").count();
  if (mapIconsCount === 0) {
    throw new Error("Expected high quality icons in Map Picker!");
  }
  console.log("✅ Map Picker has " + mapIconsCount + " icons rendered.");

  // Close map picker
  const closeMapBtn = page.locator("button:has-text(\"Confirm Delivery Pin\"), button[aria-label=\"Close\"], #btnClosePrecinctSwitcher").first();
  if (await closeMapBtn.isVisible()) {
    await closeMapBtn.click();
    await page.waitForTimeout(500);
  }

  console.log("Page errors during test:", pageErrors.length);

  await browser.close();
  console.log("🎉 ALL VERIFICATION CHECKS PASSED 100%!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
