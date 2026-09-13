import { test, expect } from '@playwright/test';

// Regression: Login.jsx's brand badge showed "MC" (leftover from the old
// "MedCare" name) while Sidebar.jsx's badge showed "CN" ("CureNeed") and
// both call the product "CureNeed" in visible text. Confirms the initials
// badge and the product name now agree everywhere an admin sees them.
test('the brand name and initials badge are consistent across Login, Sidebar, and Topbar', async ({ browser }) => {
  const loggedOutContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const loginPage = await loggedOutContext.newPage();
  await loginPage.goto('/login');
  await expect(loginPage.getByText('CureNeed', { exact: false })).toBeVisible();
  await expect(loginPage.getByText('CN', { exact: true })).toBeVisible();
  await expect(loginPage.getByText('MC', { exact: true })).toHaveCount(0);
  await loggedOutContext.close();
});

test('Sidebar and Topbar both show "CureNeed" branding', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.locator('aside').getByText('CureNeed', { exact: true })).toBeVisible();
  await expect(page.locator('aside').getByText('CN', { exact: true })).toBeVisible();
  await expect(page.locator('header').getByText('CureNeed Admin', { exact: true })).toBeVisible();
});
