import { test, expect } from '@playwright/test';

// Regression: AutoScroll's marquee ran with stopOnInteraction:false, and a
// manual scrollNext()/scrollPrev() call didn't touch AutoScroll's own
// pointerDown/pointerUp listeners at all - so a manual arrow click was
// overridden by the continuous marquee within a frame or two. The fix
// explicitly stops AutoScroll around the jump and only resumes it after a
// 3500ms breather (CategoryCarousel.jsx ARROW_RESUME_DELAY).

function trackTranslateX(track) {
  return track.evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return m.m41;
  });
}

test('clicking the next arrow moves the carousel and the position holds (no autoscroll snap-back)', async ({ page }) => {
  await page.goto('/');

  const region = page.getByRole('region', { name: 'Shop by category' });
  await expect(region).toBeVisible();
  const track = region.locator('> div').first();

  const before = await trackTranslateX(track);

  await page.getByRole('button', { name: 'Next categories' }).click();
  // Let Embla's eased scrollNext() animation finish settling.
  await page.waitForTimeout(600);
  const afterClick = await trackTranslateX(track);

  expect(afterClick).not.toBeCloseTo(before, 0);

  // Within the window before AutoScroll would resume (ARROW_RESUME_DELAY is
  // 3500ms), the position must stay put - this is exactly the bug that
  // regressed: the marquee snapping the track back within 1-2 frames.
  await page.waitForTimeout(1500);
  const afterWait = await trackTranslateX(track);

  expect(Math.abs(afterWait - afterClick)).toBeLessThan(5);
});
