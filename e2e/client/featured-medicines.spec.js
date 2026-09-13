import { test, expect } from '@playwright/test';

test('every Featured Medicines product card has a fully loaded image', async ({ page }) => {
  await page.goto('/');

  const carousel = page.getByRole('region', { name: 'Featured medicines' });
  await expect(carousel).toBeVisible({ timeout: 15_000 });

  const images = carousel.locator('img');
  const count = await images.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const img = images.nth(i);
    await expect(img).toBeVisible();
    await expect
      .poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0), { timeout: 10_000 })
      .toBe(true);
  }
});

// Regression: FeaturedMedicines previously fell back to bundled sample/backup
// JSON data when the API call failed. That fallback data was deleted from
// the repo (client/src/data/*.json, featuredMedicinesSample.js) - this
// guards against it (or an equivalent) ever coming back silently.
test('shows the explicit empty state, never fallback data, when the API is unavailable', async ({ page }) => {
  // Scoped to the real backend origin only - a bare "**/api/medicines**"
  // glob also matches Vite's dev-server module request for
  // /src/api/medicines.js and breaks the page load entirely.
  await page.route('http://localhost:5000/api/medicines**', (route) =>
    route.fulfill({ status: 500, body: 'mocked failure' })
  );

  await page.goto('/');

  await expect(page.getByText('Featured medicines will appear here once available.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Featured medicines' })).toHaveCount(0);
});
