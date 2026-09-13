import { test, expect } from '@playwright/test';

// Every card in CategoryCarousel links to /shop?category=<name>.
// ShopByCategory.jsx normalizes both the medicine's raw category and the
// incoming ?category= param through the same LEGACY_CATEGORY_MAP before
// comparing - if that map is ever out of sync with either side, a category
// can silently filter to zero results with no explanation. Read the real
// category names straight from the rendered homepage carousel (not the
// source data file) so this exercises exactly what a user can click.
test('every Shop by Category link shows products or an explicit empty state', async ({ page }) => {
  await page.goto('/');

  const region = page.getByRole('region', { name: 'Shop by category' });
  await expect(region).toBeVisible();

  const names = await region
    .locator('[role="group"][aria-hidden="false"]')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('aria-label')));

  expect(names.length).toBeGreaterThan(0);

  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop
    await page.goto(`/shop?category=${encodeURIComponent(name)}`);
    // eslint-disable-next-line no-await-in-loop
    await expect(page.getByText(/^Showing \d+ products/)).toBeVisible();
    // eslint-disable-next-line no-await-in-loop
    await expect
      .poll(() => page.getByText('Loading products...').isVisible(), { timeout: 10_000 })
      .toBe(false);

    // eslint-disable-next-line no-await-in-loop
    const productCount = await page.locator('.shop-grid .card').count();
    // eslint-disable-next-line no-await-in-loop
    const hasEmptyState = await page.getByText('No products match your filters.').isVisible();

    expect(
      productCount > 0 || hasEmptyState,
      `category "${name}" showed neither products nor the empty state`
    ).toBe(true);
  }
});
