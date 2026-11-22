import { test, expect } from '@playwright/test';

const openChat = async (page) => {
  await page.getByRole('button', { name: 'Open CureNeed Support' }).click();
  const panel = page.getByRole('dialog', { name: 'CureNeed Support chat' });
  await expect(panel.getByText('CureNeed Support')).toBeVisible({ timeout: 15_000 });
  return panel;
};

test('the launcher opens a support panel with the welcome quick actions', async ({ page }) => {
  await page.goto('/');

  const panel = await openChat(page);
  await expect(panel.getByText(/Welcome to CureNeed/i)).toBeVisible();

  for (const label of ['Find a Medicine', 'Get a Quote', 'Check My Inquiry', 'Talk to Our Team']) {
    await expect(panel.getByRole('button', { name: new RegExp(label) })).toBeVisible();
  }

  await panel.getByRole('button', { name: 'Close CureNeed Support' }).click();
  await expect(panel).toBeHidden();
});

test('searching a medicine renders catalogue results as cards', async ({ page }) => {
  await page.goto('/');
  const panel = await openChat(page);

  await panel.getByPlaceholder('Type your message...').fill('Azithromycin');
  await panel.getByRole('button', { name: 'Send message' }).click();

  const card = panel.getByText(/Azithromycin/i).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByRole('link', { name: 'View Medicine' }).first()).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Send Inquiry' }).first()).toBeVisible();
});

test('a symptom question is refused instead of answered', async ({ page }) => {
  await page.goto('/');
  const panel = await openChat(page);

  await panel.getByPlaceholder('Type your message...').fill('I have fever, what medicine should I take?');
  await panel.getByRole('button', { name: 'Send message' }).click();

  await expect(panel.getByText(/doctor or pharmacist/i)).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByRole('link', { name: 'View Medicine' })).toHaveCount(0);
});

test('opening the chat on a medicine page greets with that product', async ({ page }) => {
  const [medicine] = await (await page.request.get('http://localhost:5000/api/medicines')).json();
  test.skip(!medicine, 'catalogue is empty');

  await page.goto(`/medicine/${medicine.slug}`);
  await expect(page.getByRole('heading', { name: medicine.name, level: 1 })).toBeVisible({ timeout: 15_000 });

  const panel = await openChat(page);
  await expect(panel.getByText(/I see you're looking at/i)).toBeVisible({ timeout: 15_000 });
  await expect(panel.getByText(medicine.name, { exact: false }).first()).toBeVisible();
  await expect(panel.getByRole('button', { name: /Product Details/ })).toBeVisible();
});

test('the panel fits a phone viewport without breaking the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto('/');

  const panel = await openChat(page);
  const box = await panel.boundingBox();
  expect(box.width).toBeLessThanOrEqual(390);

  // The composer has to stay on screen — it is the only way to reply.
  await expect(panel.getByPlaceholder('Type your message...')).toBeInViewport();

  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
});
