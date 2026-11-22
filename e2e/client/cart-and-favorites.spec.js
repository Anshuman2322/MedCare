import { test, expect } from '@playwright/test';

const cartBadge = (page) => page.getByRole('link', { name: /^Request list, / }).first();

async function addFirstShopItem(page) {
  await page.goto('/shop');
  const card = page.locator('.card').first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  const name = (await card.locator('.card-title').innerText()).trim();
  await card.getByRole('button', { name: /Add .* to request list/ }).click();
  return name;
}

test('adding from a medicine card fills the cart and shows a toast', async ({ page }) => {
  const name = await addFirstShopItem(page);

  await expect(page.getByText('Added to request list')).toBeVisible();
  await expect(cartBadge(page)).toHaveAccessibleName(/1 item/);

  await page.getByRole('link', { name: 'View List' }).click();
  await expect(page.getByRole('heading', { name: 'Your Request List' })).toBeVisible();
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
});

test('adding the same medicine twice tops up one row instead of duplicating', async ({ page }) => {
  await addFirstShopItem(page);
  await page.locator('.card').first().getByRole('button', { name: /Add .* to request list/ }).click();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your Request List' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Remove$/ })).toHaveCount(1);
  await expect(page.getByRole('spinbutton', { name: /Quantity of/ })).toHaveValue('2');
  await expect(cartBadge(page)).toHaveAccessibleName(/1 item/);
});

test('quantity controls, persistence and remove all work', async ({ page }) => {
  await addFirstShopItem(page);
  await page.goto('/cart');

  const quantity = page.getByRole('spinbutton', { name: /Quantity of/ });
  const decrease = page.getByRole('button', { name: /Decrease quantity/ });

  await expect(decrease).toBeDisabled();
  await page.getByRole('button', { name: /Increase quantity/ }).click();
  await expect(quantity).toHaveValue('2');
  await expect(decrease).toBeEnabled();

  // Cart survives a full page navigation.
  await page.goto('/about');
  await page.goto('/cart');
  await expect(quantity).toHaveValue('2');

  await page.getByRole('button', { name: /^Remove$/ }).click();
  await expect(page.getByText('Removed from request list')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your request list is empty' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Medicines' })).toBeVisible();
});

test('several medicines submit as ONE combined inquiry', async ({ page }) => {
  await page.goto('/shop');
  const cards = page.locator('.card');
  await expect(cards.first()).toBeVisible({ timeout: 15_000 });

  for (const index of [0, 1, 2]) {
    await cards.nth(index).getByRole('button', { name: /Add .* to request list/ }).click();
  }

  await page.goto('/cart');
  await expect(page.getByRole('button', { name: /^Remove$/ })).toHaveCount(3);

  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/inquiries/bulk')) requests.push(request.postDataJSON());
  });

  await page.getByRole('button', { name: 'Submit Inquiry' }).click();
  const dialog = page.getByRole('dialog', { name: 'Submit Inquiry' });

  await dialog.getByLabel(/^Name/).fill('Playwright Buyer');
  await dialog.getByLabel(/Delivery Location/).fill('Austin, USA');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByLabel(/^Email/).fill('playwright.cart@example.com');
  await dialog.getByRole('button', { name: 'Next' }).click();

  await expect(dialog.getByText('Review & Submit')).toBeVisible();
  await dialog.getByRole('button', { name: 'Submit Inquiry', exact: true }).click();

  await expect(dialog.getByText('Thank you for your inquiry')).toBeVisible({ timeout: 20_000 });
  await expect(dialog.getByText(/Reference ID: CN-\d{4}-\d{4}/)).toBeVisible();

  // Exactly one request, carrying all three medicines.
  expect(requests).toHaveLength(1);
  expect(requests[0].items).toHaveLength(3);
  expect(requests[0].requestType).toBe('inquiry');

  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your request list is empty' })).toBeVisible();
});

test('best price from the product page keeps the listed price visible', async ({ page }) => {
  const [medicine] = await (await page.request.get('http://localhost:5000/api/medicines')).json();
  test.skip(!medicine, 'catalogue is empty');

  await page.goto(`/medicine/${medicine.slug}`);
  await expect(page.getByRole('heading', { name: medicine.name, level: 1 })).toBeVisible({ timeout: 15_000 });

  const listedPrice = page.locator('.text-emerald-700').filter({ hasText: /^\$/ }).first();
  await expect(listedPrice).toBeVisible();
  const priceText = await listedPrice.innerText();

  await page.getByRole('button', { name: 'Request a Quote' }).click();
  const dialog = page.getByRole('dialog', { name: 'Request a Quote' });

  await dialog.getByLabel(/^Name/).fill('Playwright Buyer');
  await dialog.getByLabel(/Delivery Location/).fill('Austin, USA');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByLabel(/^Email/).fill('playwright.bp@example.com');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Request a Quote', exact: true }).click();

  await expect(dialog.getByText('Best-price request submitted')).toBeVisible({ timeout: 20_000 });
  await expect(dialog.getByText(/Reference ID: BP-\d{4}-\d{4}/)).toBeVisible();
  // No discounted figure is ever invented for the customer.
  await expect(dialog.getByText(/% off/i)).toHaveCount(0);

  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(listedPrice).toHaveText(priceText);
});

test('favorites persist and stay independent of the cart', async ({ page }) => {
  const [medicine] = await (await page.request.get('http://localhost:5000/api/medicines')).json();
  test.skip(!medicine, 'catalogue is empty');

  await page.goto(`/medicine/${medicine.slug}`);
  await page.getByRole('button', { name: new RegExp(`Save ${medicine.name}`) }).click();
  await expect(page.getByText('Saved to favorites')).toBeVisible();

  await page.getByRole('button', { name: 'Add to Request' }).click();

  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Your Favorites' })).toBeVisible();
  await expect(page.getByText(medicine.name, { exact: false }).first()).toBeVisible();

  // Emptying the cart must not touch favorites.
  await page.goto('/cart');
  await page.getByRole('button', { name: /^Remove$/ }).click();
  await page.goto('/favorites');
  await expect(page.getByText(medicine.name, { exact: false }).first()).toBeVisible();

  // And un-favoriting must not be undone by a reload.
  await page.getByRole('button', { name: new RegExp(`Remove ${medicine.name} from favorites`) }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'No favorites yet' })).toBeVisible();
});

test('the existing single-medicine inquiry flow still works end to end', async ({ page }) => {
  const [medicine] = await (await page.request.get('http://localhost:5000/api/medicines')).json();
  test.skip(!medicine, 'catalogue is empty');

  await page.goto(`/medicine/${medicine.slug}`);
  await page.getByRole('button', { name: 'Send Inquiry' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Tell us about you')).toBeVisible();
  await expect(dialog.getByText(/Step 1 of 5/)).toBeVisible();

  await dialog.getByLabel(/^Name/).fill('Playwright Solo');
  await dialog.getByLabel(/^City/).fill('Dallas');
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();
  await dialog.getByRole('button', { name: 'Next' }).click();

  await expect(dialog.getByText('Review & Submit')).toBeVisible();
  await dialog.getByRole('button', { name: 'Submit Inquiry' }).click();
  await expect(dialog.getByText('Thank you for your inquiry')).toBeVisible({ timeout: 20_000 });
});

test('cart page works at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await addFirstShopItem(page);
  await page.goto('/cart');

  // Single column on a phone: the summary sits below the items, so it is
  // reachable by scrolling rather than already on screen.
  const submit = page.getByRole('button', { name: 'Submit Inquiry', exact: true });
  await submit.scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Request Summary' })).toBeVisible();
  await expect(submit).toBeInViewport();

  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
});
