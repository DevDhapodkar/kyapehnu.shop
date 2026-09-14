import { test, expect } from '@playwright/test';

test.describe('Split Auth Suite (Sign In vs Register)', () => {
  test('verifies split auth tab switching, distinct inputs, and password toggles', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' });

    // Click "Log In to Your Account" on welcome screen
    const loginBtn = page.getByRole('button', { name: /(Log In to Your Account|Log In|Sign In)/i }).first();
    await expect(loginBtn).toBeVisible({ timeout: 15000 });
    await loginBtn.click();

    // 1. Verify Auth screen elements are present
    const signInTab = page.locator('#tab-signin');
    const registerTab = page.locator('#tab-register');
    await expect(signInTab).toBeVisible({ timeout: 15000 });
    await expect(registerTab).toBeVisible({ timeout: 15000 });

    // 2. Verify Sign In panel is visible by default
    const signInPanel = page.locator('#panel-signin');
    const registerPanel = page.locator('#panel-register');
    await expect(signInPanel).toBeVisible();
    await expect(registerPanel).toBeHidden();

    // Verify Sign In specific fields
    const signinIdentifier = page.locator('#signin-identifier');
    const signinPassword = page.locator('#signin-password');
    const signinSubmit = page.locator('#btn-submit-signin');
    const forgotPwd = page.locator('#btn-forgot-password');

    await expect(signinIdentifier).toBeVisible();
    await expect(signinPassword).toBeVisible();
    await expect(signinSubmit).toBeVisible();
    await expect(forgotPwd).toBeVisible();

    // Verify Register specific fields are NOT visible in signin tab
    await expect(page.locator('#reg-name')).toBeHidden();
    await expect(page.locator('#btn-submit-register')).toBeHidden();

    // 3. Test password visibility toggle on Sign In form
    const toggleBtn = page.locator('#toggle-signin-password');
    await expect(signinPassword).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(signinPassword).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(signinPassword).toHaveAttribute('type', 'password');

    // 4. Switch to Register Tab
    await registerTab.click();

    // Verify Register panel is now visible and Sign In panel is hidden
    await expect(registerPanel).toBeVisible();
    await expect(signInPanel).toBeHidden();

    // Verify all 4 Register fields exist
    const regName = page.locator('#reg-name');
    const regPhone = page.locator('#reg-phone');
    const regEmail = page.locator('#reg-email');
    const regPassword = page.locator('#reg-password');
    const regSubmit = page.locator('#btn-submit-register');

    await expect(regName).toBeVisible();
    await expect(regPhone).toBeVisible();
    await expect(regEmail).toBeVisible();
    await expect(regPassword).toBeVisible();
    await expect(regSubmit).toBeVisible();

    // 5. Switch back to Sign In tab via switch link
    const switchLink = page.locator('#link-switch-to-signin');
    await switchLink.click();

    // Verify Sign In panel is visible again and Register panel is hidden
    await expect(signInPanel).toBeVisible();
    await expect(registerPanel).toBeHidden();
  });
});
