import { test, expect } from '@playwright/test';

test.describe('Production Live Verification (kyapehnu.shop/app)', () => {
  test.use({
    baseURL: 'https://www.kyapehnu.shop/app/',
    viewport: { width: 412, height: 915 },
  });

  test('verifies live production Split Auth and tab switching', async ({ page }) => {
    await page.goto('https://www.kyapehnu.shop/app/', { waitUntil: 'networkidle' });

    // Open Auth from Welcome
    const loginBtn = page.getByRole('button', { name: /(Log In to Your Account|Log In|Sign In)/i }).first();
    await expect(loginBtn).toBeVisible({ timeout: 20000 });
    await loginBtn.click();

    // Verify Sign In tab active
    const signInTab = page.locator('#tab-signin');
    const registerTab = page.locator('#tab-register');
    await expect(signInTab).toBeVisible({ timeout: 15000 });
    await expect(registerTab).toBeVisible({ timeout: 15000 });

    const signInPanel = page.locator('#panel-signin');
    const registerPanel = page.locator('#panel-register');
    await expect(signInPanel).toBeVisible();
    await expect(registerPanel).toBeHidden();

    // Verify distinct Sign In fields
    await expect(page.locator('#signin-identifier')).toBeVisible();
    await expect(page.locator('#signin-password')).toBeVisible();
    await expect(page.locator('#btn-submit-signin')).toBeVisible();
    await expect(page.locator('#btn-forgot-password')).toBeVisible();

    // Verify Register fields are hidden
    await expect(page.locator('#reg-name')).toBeHidden();

    // Switch to Register tab
    await registerTab.click();
    await expect(registerPanel).toBeVisible();
    await expect(signInPanel).toBeHidden();

    // Verify Register fields are visible
    await expect(page.locator('#reg-name')).toBeVisible();
    await expect(page.locator('#reg-phone')).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
    await expect(page.locator('#btn-submit-register')).toBeVisible();

    // Switch back to Sign In tab
    await page.locator('#link-switch-to-signin').click();
    await expect(signInPanel).toBeVisible();
    await expect(registerPanel).toBeHidden();
  });

  test('verifies live production Storefront guest browsing with MongoDB products', async ({ page }) => {
    await page.goto('https://www.kyapehnu.shop/app/', { waitUntil: 'networkidle' });

    // Enter as Guest
    const guestBtn = page.getByRole('button', { name: /(Explore Storefront as Guest|Browse Catalog as guest)/i }).first();
    await expect(guestBtn).toBeVisible({ timeout: 20000 });
    await guestBtn.click();

    // Verify Storefront product cards render
    const productCards = page.locator('[aria-label*="₹"]');
    await expect(productCards.first()).toBeVisible({ timeout: 30000 });
    const count = await productCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify Bag tab is present
    await expect(page.getByRole('tab', { name: 'Bag' })).toBeVisible();
  });
});
