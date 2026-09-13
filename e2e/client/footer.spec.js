import { test, expect } from '@playwright/test';

const FOOTER_LINKS = [
  { name: 'Shop', path: '/shop' },
  { name: 'About Us', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: 'Privacy Policy', path: '/privacy-policy' },
  { name: 'Terms of Service', path: '/terms-of-service' },
  { name: 'Shipping Policy', path: '/shipping-policy' },
];

for (const { name, path } of FOOTER_LINKS) {
  test(`footer link "${name}" navigates to a real page, not a 404`, async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    // App.jsx has no catch-all route - an unmatched path renders nothing
    // inside <Routes>. Every real destination page has its own <h1>, so a
    // visible one confirms the route actually matched and rendered.
    await expect(page.locator('h1')).toBeVisible();
  });
}

// The wordmark's font-size is a fluid clamp() and whiteSpace:'nowrap' - it
// must render as a single, unbroken line at every breakpoint from the
// smallest supported viewport up to very wide desktop screens.
const WIDTHS = [375, 768, 1440, 1920];

for (const width of WIDTHS) {
  test(`footer wordmark renders on one line at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const wordmark = page.getByRole('button', { name: 'Scroll to top' });
    await wordmark.scrollIntoViewIfNeeded();
    await expect(wordmark).toBeVisible();

    const { whiteSpace, lineCount } = await wordmark.evaluate((el) => {
      const style = getComputedStyle(el);
      const rects = el.getClientRects();
      return { whiteSpace: style.whiteSpace, lineCount: rects.length };
    });

    expect(whiteSpace).toBe('nowrap');
    // A wrapped inline element reports one client rect per visual line.
    expect(lineCount).toBe(1);

    // No-wrap alone doesn't rule out horizontal page overflow if the text
    // is simply wider than the viewport - confirm it doesn't blow out the
    // page horizontally either.
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}
