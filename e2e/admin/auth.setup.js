import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { test as setup, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

const authFile = path.resolve(__dirname, '../.auth/admin.json');

// Reuses the same super_admin account `npm run seed:admin` creates in
// server/ (ADMIN_EMAIL / ADMIN_PASSWORD) rather than inventing a separate
// test-only account, so this only ever succeeds against a database that's
// already been seeded the normal way.
setup('authenticate as admin', async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  expect(email, 'ADMIN_EMAIL must be set in server/.env to run admin E2E specs').toBeTruthy();
  expect(password, 'ADMIN_PASSWORD must be set in server/.env to run admin E2E specs').toBeTruthy();

  await page.goto('/login');
  await page.getByPlaceholder('admin@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await page.context().storageState({ path: authFile });
});
