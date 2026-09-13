import { test, expect } from '@playwright/test';

// Regression: NavLink is active-by-prefix unless `end` is set. Sidebar.jsx
// explicitly sets `end: true` only on the /medicines entry (not
// /medicines/add) so visiting /medicines/add doesn't ALSO light up the
// "Medicines" link just because its path is a prefix match.
test('on /medicines/add, only "Add Medicine" is active - not also "Medicines"', async ({ page }) => {
  await page.goto('/medicines/add');
  // Topbar also renders a dynamic page-title <h1>Add Medicine</h1> - scope
  // to <main> for the form's own heading to avoid matching both.
  await expect(page.getByRole('main').getByRole('heading', { name: 'Add Medicine' })).toBeVisible();

  const nav = page.locator('aside nav');
  const medicinesLink = nav.getByRole('link', { name: 'Medicines', exact: true });
  const addMedicineLink = nav.getByRole('link', { name: 'Add Medicine', exact: true });

  const activeClass = 'bg-emerald-600';
  await expect(addMedicineLink).toHaveClass(new RegExp(activeClass));
  const medicinesClasses = await medicinesLink.getAttribute('class');
  expect(medicinesClasses).not.toContain(activeClass);
});

test('on /medicines, only "Medicines" is active', async ({ page }) => {
  await page.goto('/medicines');

  const nav = page.locator('aside nav');
  const medicinesLink = nav.getByRole('link', { name: 'Medicines', exact: true });
  const addMedicineLink = nav.getByRole('link', { name: 'Add Medicine', exact: true });

  await expect(medicinesLink).toHaveClass(/bg-emerald-600/);
  const addClasses = await addMedicineLink.getAttribute('class');
  expect(addClasses).not.toContain('bg-emerald-600');
});
