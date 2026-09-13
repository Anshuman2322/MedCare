import { test, expect } from '@playwright/test';

// Regression: NavLink is active-by-prefix unless `end` is set, so without
// `end` the Home link ("/") would match every path (since every path
// starts with "/") and stay lit up everywhere - the same class of bug as
// the admin Sidebar's /medicines vs /medicines/add.
const NAV_LABELS = ['Home', 'Shop by Category', 'About Us', 'Contact'];

const pages = [
  { path: '/', activeLabel: 'Home' },
  { path: '/shop', activeLabel: 'Shop by Category' },
  { path: '/about', activeLabel: 'About Us' },
  { path: '/contact', activeLabel: 'Contact' },
];

for (const { path, activeLabel } of pages) {
  test(`exactly one nav link is active on ${path}, and it is "${activeLabel}"`, async ({ page }) => {
    await page.goto(path);

    const activeLabels = [];
    for (const label of NAV_LABELS) {
      // exact:true so "Home" doesn't also match "Homepage"-ish partials.
      // eslint-disable-next-line no-await-in-loop
      // Scoped to <nav> - the footer's Quick Links duplicate "About Us"
      // and "Contact" as link text, which would otherwise be ambiguous.
      const link = page.locator('nav').getByRole('link', { name: label, exact: true });
      // eslint-disable-next-line no-await-in-loop
      const classes = await link.getAttribute('class');
      // Exact token match, not substring - inactive links carry
      // "hover:text-emerald-600", which a naive .includes() would
      // false-positive on since it contains "text-emerald-600" too.
      if (classes?.split(/\s+/).includes('text-emerald-600')) activeLabels.push(label);
    }

    expect(activeLabels).toEqual([activeLabel]);
  });
}

test('Home is specifically NOT active on a non-home page', async ({ page }) => {
  await page.goto('/about');
  const homeLink = page.locator('nav').getByRole('link', { name: 'Home', exact: true });
  const classes = await homeLink.getAttribute('class');
  expect(classes?.split(/\s+/)).not.toContain('text-emerald-600');
});
