import { test, expect, Page } from '@playwright/test';

// Every publish endpoint is mocked: a real publish would commit to the public Pages repo,
// and saving settings would overwrite the owner's choices.

interface Field { key: string; label: string; group: string; included: boolean }

const FIELDS: Field[] = [
  { key: 'IDENTITY', label: 'Scientific identity (materials)', group: 'What it is', included: true },
  { key: 'HARDNESS', label: 'Hardness (Mohs)', group: 'Physical properties', included: true },
  { key: 'PRICE', label: 'Price', group: 'Origin & acquisition', included: false },
];

async function mockPublishApi(page: Page, overrides: Partial<{ publicCount: number; gitHubConfigured: boolean; changed: boolean }> = {}) {
  const state = {
    fields: FIELDS.map(f => ({ ...f })), intro: 'Hello experts.', lastPublishedAt: null as string | null,
    siteUrl: 'https://owner.github.io/pages/', publicCount: overrides.publicCount ?? 3, totalCount: 3,
    gitHubConfigured: overrides.gitHubConfigured ?? true,
  };
  const calls = { saved: [] as { fields: string[]; intro: string }[], published: 0, showAll: 0 };
  await page.route('**/api/publish/settings', async route => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      calls.saved.push(body);
      state.fields = state.fields.map(f => ({ ...f, included: body.fields.includes(f.key) }));
      state.intro = body.intro;
    }
    await route.fulfill({ json: state });
  });
  await page.route('**/api/publish/all-specimens', async route => {
    calls.showAll++;
    state.publicCount = state.totalCount;
    await route.fulfill({ json: state });
  });
  await page.route('**/api/publish', async route => {
    calls.published++;
    await route.fulfill({ json: { changed: overrides.changed ?? true, specimenCount: 3, siteUrl: state.siteUrl, publishedAt: new Date().toISOString() } });
  });
  return calls;
}

test('Publish dialog saves ticked fields, the intro, and publishes', async ({ page }) => {
  const calls = await mockPublishApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Publish the public site' });

  const fields = dialog.getByRole('region', { name: 'Fields to publish' });
  await expect(fields.getByRole('group', { name: 'Physical properties' }).getByRole('checkbox', { name: 'Hardness (Mohs)' })).toBeChecked();
  await expect(fields.getByRole('checkbox', { name: 'Price' })).not.toBeChecked();

  await fields.getByRole('checkbox', { name: 'Price' }).check();
  await expect.poll(() => calls.saved.at(-1)?.fields).toEqual(['IDENTITY', 'HARDNESS', 'PRICE']);
  await fields.getByRole('checkbox', { name: 'Hardness (Mohs)' }).uncheck();
  await expect.poll(() => calls.saved.at(-1)?.fields).toEqual(['IDENTITY', 'PRICE']);

  const intro = dialog.getByRole('textbox', { name: 'Introduction on the site’s front page' });
  await intro.fill('Please help me identify these.');
  await intro.blur();
  await expect.poll(() => calls.saved.at(-1)?.intro).toBe('Please help me identify these.');

  await dialog.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(dialog.getByText('Published 3 specimens.')).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'the site' })).toHaveAttribute('href', 'https://owner.github.io/pages/');
  expect(calls.published).toBe(1);
});

test('Publish dialog can show every specimen at once', async ({ page }) => {
  const calls = await mockPublishApi(page, { publicCount: 1 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Publish the public site' });

  await expect(dialog.getByText('1 of 3 specimens are shown on the site.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Show all specimens' }).click();
  await expect(dialog.getByText('3 of 3 specimens are shown on the site.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Show all specimens' })).toHaveCount(0);
  expect(calls.showAll).toBe(1);
});

test('Publish dialog explains a missing GitHub token and an unchanged site', async ({ page }) => {
  await mockPublishApi(page, { gitHubConfigured: false });
  await page.goto('/');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Publish the public site' });
  await expect(dialog.getByText(/needs the GitHub token/)).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Publish', exact: true })).toBeDisabled();

  await page.unrouteAll();
  await mockPublishApi(page, { changed: false });
  await page.reload();
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await page.getByRole('dialog', { name: 'Publish the public site' }).getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByText('The site was already up to date; nothing changed.')).toBeVisible();
});
