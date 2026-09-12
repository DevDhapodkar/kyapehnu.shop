import { test, expect, Page } from '@playwright/test';

/**
 * Guest storefront critical path (UI): a visitor with no account explores the
 * storefront, opens a product, adds it to the bag, and reaches checkout.
 *
 * The final order placement (which requires a map-pinned delivery coordinate)
 * is covered at the API boundary in guest-order-api.spec.ts, so this spec stops
 * once the checkout/address screen is reached.
 */

const enterAsGuest = async (page: Page) => {
  // Absolute '/app/' — the bundle is served under its exported baseUrl, and a
  // bare '/' would resolve to the static server root, not the app.
  await page.goto('/app/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /(Explore Storefront as Guest|Browse Catalog as guest)/i }).first().click();
  // Storefront settles once product cards render. The price lives in the card's
  // aria-label ("<name>, ₹<price>"), so match the attribute, not visible text.
  await expect(page.locator('[aria-label*="₹"]').first()).toBeVisible({ timeout: 30000 });
};

test('guest can browse the storefront and see live products', async ({ page }) => {
  await enterAsGuest(page);
  const productCards = page.locator('[aria-label*="₹"]');
  expect(await productCards.count()).toBeGreaterThan(0);
  // exact: 'Bag' the tab, not "Bag item" / "Quick add to bag" on each card.
  await expect(page.getByRole('tab', { name: 'Bag' })).toBeVisible();
});

test('guest can open a product, add it to the bag, and reach checkout', async ({ page }) => {
  await enterAsGuest(page);

  // Open the first product's detail page.
  const firstCard = page.locator('[aria-label*="₹"]').first();
  await firstCard.click();

  const addToBag = page.getByRole('button', { name: /add to bag/i });
  await expect(addToBag).toBeVisible({ timeout: 20000 });

  // Some products gate add-to-bag behind a size choice. Pick one if offered.
  const sizeChip = page.getByRole('button', { name: /^(FREE|XS|S|M|L|XL|XXL)$/ }).first();
  if (await sizeChip.count()) {
    await sizeChip.click().catch(() => {});
  }

  await addToBag.click();

  // The product-detail screen has no bottom tab bar (the ADD TO BAG action bar
  // takes its place), so return to the storefront before opening the bag tab.
  await page.getByRole('button', { name: 'Go back' }).click();

  // Open the bag and confirm the cart is non-empty and offers checkout.
  await page.getByRole('tab', { name: 'Bag' }).click();
  const proceed = page.getByRole('button', { name: /proceed to checkout/i });
  await expect(proceed).toBeVisible({ timeout: 20000 });

  // Advance to the express-fitting checkout / address screen. Assert on the
  // screen's unique title (the prior cart screen also renders a "Delivery
  // Address" label and stays mounted-but-hidden under React Navigation).
  await proceed.click();
  await expect(page.getByText('Express Fitting Checkout')).toBeVisible({ timeout: 20000 });
});
