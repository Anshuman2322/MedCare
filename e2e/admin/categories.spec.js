import { test, expect } from '@playwright/test';

test('Categories page loads and the Add Category flow is present', async ({ page }) => {
  await page.goto('/categories');

  // Topbar also renders a dynamic page-title <h1>Categories</h1> - scope to
  // <main> for the page's own heading to avoid matching both.
  await expect(page.getByRole('main').getByRole('heading', { name: 'Categories' })).toBeVisible();

  const nameInput = page.getByPlaceholder('Enter category name');
  await expect(nameInput).toBeVisible();
  const addButton = page.getByRole('button', { name: 'Add Category' });
  await expect(addButton).toBeVisible();
  await expect(addButton).toBeEnabled();

  // The real taxonomy is seeded (server/scripts/seedCategories.js) - the
  // table should list at least one existing category, not just show the
  // "No categories yet." empty state.
  await expect
    .poll(async () => page.getByText('No categories yet.').isVisible(), { timeout: 10_000 })
    .toBe(false);
  await expect(page.locator('table')).toBeVisible();
});
