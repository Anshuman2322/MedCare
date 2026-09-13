import { test, expect } from '@playwright/test';

// The left product-details panel (InquiryModal.jsx) is a fixed-height
// column (`h-full max-h-full overflow-y-auto`) that can hold more content
// than fits (image + name + manufacturer + a 4-row info card including
// Quantity) - it must be independently scrollable so nothing, including
// Quantity, is clipped with no way to reach it.
test('the inquiry modal left panel is independently scrollable and Quantity stays reachable', async ({ page }) => {
  // A short viewport forces the fixed h-[80vh] modal's left panel content
  // (image + name + manufacturer + info card) to genuinely overflow,
  // regardless of how much real product data happens to be seeded.
  await page.setViewportSize({ width: 1280, height: 620 });
  await page.goto('/');

  const carousel = page.getByRole('region', { name: 'Featured medicines' });
  await expect(carousel).toBeVisible({ timeout: 15_000 });
  await carousel.getByRole('button', { name: 'Inquire Now' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const leftPanel = dialog.locator('div.overflow-y-auto');
  await expect(leftPanel).toBeVisible();
  await expect(leftPanel).toHaveCSS('overflow-y', 'auto');

  const quantityLabel = leftPanel.getByText('Quantity', { exact: true });
  await expect(quantityLabel).toBeAttached();

  // Confirm the panel actually needs scrolling on this viewport - otherwise
  // "it's scrollable" would be untested (nothing to scroll = false pass).
  const { scrollHeight, clientHeight } = await leftPanel.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }));
  expect(scrollHeight).toBeGreaterThan(clientHeight);

  await leftPanel.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await expect(quantityLabel).toBeInViewport();
});
