import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/');
});

test('Home page loads and displays title', async ({ page }) => {
  await expect(page.getByRole('heading', { name: "Collected Rocks" })).toBeVisible();
});

test('Collected Rocks Table is visible', async ({ page }) => {
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: "Name", exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: "Rock type" })).toBeVisible();
});

test('Add Rock Dialog opens', async ({ page }) => {
  const addButton = page.getByRole('button', { name: /add a rock/i });
  await addButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
