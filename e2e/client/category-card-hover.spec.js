import { test, expect } from '@playwright/test';

// Regression: CategoryCard's whileHover lifts the card -8px and grows its
// box-shadow (blur radius 40px). The carousel's clipping region originally
// had no headroom, so the lift + shadow blur got clipped by the
// overflow-hidden track. Fixed with py-12 (48px) padding on the region
// (offset by a matching -my-12 so it doesn't push the page layout down).
test('hovering a category card is not clipped by its overflow-hidden parent', async ({ page }) => {
  await page.goto('/');

  const region = page.getByRole('region', { name: 'Shop by category' });
  await expect(region).toBeVisible();
  await expect(region).toHaveCSS('overflow', 'hidden');

  const track = region.locator('> div').first();
  const readX = () => track.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);

  // The carousel auto-scrolls continuously (AutoScroll marquee), which
  // fails Playwright's hover stability check on a moving target, and also
  // means the DOM's "first" card can already be scrolled off-screen by the
  // time the test runs. Hover the region broadly first - stopOnMouseEnter
  // pauses the marquee - then poll until the track's transform actually
  // stops changing.
  await region.hover();
  await expect.poll(async () => {
    const a = await readX();
    await page.waitForTimeout(50);
    const b = await readX();
    return Math.abs(a - b);
  }, { timeout: 5000 }).toBeLessThan(0.5);

  // Pick whichever card is CURRENTLY fully on-screen within the region
  // (not necessarily "first" in DOM order, since the marquee already moved
  // it) and move the real mouse to its center directly - bypassing
  // Locator.hover()'s own scroll-into-view/stability retry loop, which
  // mis-fires here against a sticky-positioned navbar overlapping the
  // scrolled-to region.
  const clipBox = await region.boundingBox();
  const target = await region.evaluate((regionEl, clip) => {
    const links = Array.from(regionEl.querySelectorAll('a'));
    const onScreen = links.find((a) => {
      const r = a.getBoundingClientRect();
      return r.left >= clip.x + 1 && r.right <= clip.x + clip.width - 1;
    });
    if (!onScreen) return null;
    const r = onScreen.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, clipBox);

  expect(target, 'no category card was fully on-screen to hover').not.toBeNull();

  await page.mouse.move(target.x, target.y);
  // Let the whileHover motion (300ms ease-out) finish animating.
  await page.waitForTimeout(400);

  const result = await region.evaluate((regionEl, clip) => {
    const hovered = regionEl.querySelector('a:hover');
    if (!hovered) return null;
    const r = hovered.getBoundingClientRect();
    return {
      topBuffer: r.top - clip.y,
      bottomBuffer: clip.y + clip.height - (r.top + r.height),
    };
  }, clipBox);

  expect(result, 'no card matched :hover after moving the mouse').not.toBeNull();

  // The fix added 48px of headroom (py-12) specifically to cover an 8px
  // lift plus shadow blur - assert real buffer remains on both edges,
  // not just that the card technically stays inside the clip box.
  expect(result.topBuffer).toBeGreaterThan(30);
  expect(result.bottomBuffer).toBeGreaterThan(30);
});
