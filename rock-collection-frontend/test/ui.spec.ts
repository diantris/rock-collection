import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Home page loads and displays title', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Rock Collection' })).toBeVisible();
});

test('Specimens table is visible with sortable columns', async ({ page }) => {
  await expect(page.getByRole('table', { name: 'Specimens' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Name', exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Market name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Family' })).toBeVisible();
});

test('Add specimen dialog opens', async ({ page }) => {
  await page.getByRole('button', { name: /add a specimen/i }).click();
  await expect(page.getByRole('dialog', { name: 'Add a specimen' })).toBeVisible();
});

test('Adding a specimen with only a name shows it in the table', async ({ page }) => {
  const name = `UI test specimen ${Date.now()}`;
  await page.getByRole('button', { name: /add a specimen/i }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  // Newest specimens have the highest ids, so sort by # descending to find it on the first page
  await page.getByRole('button', { name: '#' }).click();
  await page.getByRole('button', { name: '#' }).click();
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row.getByText('unknown').first()).toBeVisible();

  // Clean up through the UI
  await row.getByRole('button', { name: `Delete ${name}` }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(row).toHaveCount(0);
});
