import { test, expect } from '@playwright/test';

// hero-section-fill's height is calc(100dvh - 65px) with a calc(100vh -
// 65px) fallback and a 560px floor - so the hero + navbar together should
// account for the full viewport height (within a few px of rounding/scrollbar
// slack), and never less than the 560px floor on very short viewports.
const SIZES = [
  { width: 1440, height: 900 },
  { width: 375, height: 812 },
];

for (const { width, height } of SIZES) {
  test(`hero fills the viewport height at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');

    const nav = page.locator('nav').first();
    const hero = page.locator('section').first();

    const navBox = await nav.boundingBox();
    const heroBox = await hero.boundingBox();

    const combined = navBox.height + heroBox.height;
    const expectedFloor = Math.max(560, height - navBox.height);

    expect(heroBox.height).toBeGreaterThanOrEqual(expectedFloor - 2);
    expect(Math.abs(combined - height)).toBeLessThan(20);
  });
}

test('both trust badges link to real, existing pages', async ({ page }) => {
  // Note: only 2 badges are visually distinct trust claims in the current
  // build, but there are 3 badge links total (shipping + privacy are split
  // since one link can't honestly point at two different policy pages) -
  // this covers all of them.
  const badges = [
    { text: 'Transparent Inquiry Process', path: '/contact' },
    { text: 'Clear Shipping Policy', path: '/shipping-policy' },
    { text: 'Clear Privacy Policy', path: '/privacy-policy' },
  ];

  for (const { text, path } of badges) {
    // eslint-disable-next-line no-await-in-loop
    await page.goto('/');
    // eslint-disable-next-line no-await-in-loop
    const badge = page.getByRole('link', { name: text });
    // eslint-disable-next-line no-await-in-loop
    await expect(badge).toHaveAttribute('href', path);

    // A Vite dev server always serves the SPA shell with 200 for any
    // unmatched path, so an HTTP status check alone wouldn't prove the
    // route is real - click through and confirm the destination page's
    // own <h1> actually rendered inside App.jsx's <Routes>.
    // eslint-disable-next-line no-await-in-loop
    await badge.click();
    // eslint-disable-next-line no-await-in-loop
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    // eslint-disable-next-line no-await-in-loop
    await expect(page.locator('h1')).toBeVisible();
  }
});
