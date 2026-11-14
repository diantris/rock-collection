import { APIRequestContext } from '@playwright/test';
import { test, expect } from './fixtures';

// Full add/edit form and the detail view. Needs the full stack running.
const API = process.env.API_BASE_URL || 'http://localhost:8080/api';

async function createSpecimen(request: APIRequestContext, data: object): Promise<{ id: number; name: string }> {
  const response = await request.post(`${API}/specimens`, { data });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function deleteSpecimensNamed(request: APIRequestContext, prefix: string) {
  const page = await (await request.get(`${API}/specimens?size=100&sort=id&direction=desc`)).json();
  for (const s of page.content) if (s.name.startsWith(prefix)) await request.delete(`${API}/specimens/${s.id}`);
}

test('Clicking a row opens the details; editing hardness with a decimal comma saves it', async ({ page, request }) => {
  const specimen = await createSpecimen(request, { name: `Form test ${Date.now()}`, marketName: 'Dalmatian Jasper' });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: '#' }).click();
    await page.getByRole('button', { name: '#' }).click(); // newest first
    await page.getByRole('row', { name: new RegExp(specimen.name) }).click();

    const detail = page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) });
    await expect(detail.getByText('Sold as “Dalmatian Jasper”')).toBeVisible();
    await expect(detail.getByText(/Not recorded: .*hardness/i)).toBeVisible();

    await detail.getByRole('button', { name: 'Edit' }).click();
    const form = page.getByRole('dialog', { name: `Edit #${specimen.id}` });
    await form.getByRole('button', { name: /Physical properties/ }).click();
    await form.getByRole('textbox', { name: 'Hardness from (Mohs)' }).fill('6,5');
    await form.getByRole('button', { name: 'Save' }).click();

    const updated = page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) });
    await expect(updated.getByRole('region', { name: 'Physical properties' }).getByText('6.5')).toBeVisible();
    const saved = await (await request.get(`${API}/specimens/${specimen.id}`)).json();
    expect(saved).toMatchObject({ hardnessMin: 6.5, hardnessMax: 6.5, marketName: 'Dalmatian Jasper' });
  } finally {
    await request.delete(`${API}/specimens/${specimen.id}`);
  }
});

test('A pinned stone tops the default order (by name), sorting by a column ignores pins, a third click goes back', async ({ page, request }) => {
  const specimen = await createSpecimen(request, { name: `Zzz pin test ${Date.now()}` }); // last by name
  const other = await createSpecimen(request, { name: `Aaa pin test ${Date.now()}` });
  try {
    await page.goto('/');
    const table = page.getByRole('table', { name: 'Specimens' });
    await expect(table.getByRole('columnheader', { name: 'Name', exact: true })).toHaveCSS('position', 'sticky');
    await page.getByRole('button', { name: '#' }).click();
    await page.getByRole('button', { name: '#' }).click(); // newest first
    const pin = page.getByRole('button', { name: `Pin ${specimen.name}` });
    await expect(pin).toHaveAttribute('aria-pressed', 'false');
    await pin.click();
    await expect(pin).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: '#' }).click(); // third click: back to pinned first, then by name
    await expect(table.getByRole('row').nth(1)).toContainText(specimen.name);
    await page.getByRole('button', { name: 'Name', exact: true }).click(); // A to Z, pins ignored
    await expect(table.getByRole('row').nth(1)).not.toContainText(specimen.name);

    const saved = await (await request.get(`${API}/specimens/${specimen.id}`)).json();
    expect(saved.pinned).toBe(true);
  } finally {
    await request.delete(`${API}/specimens/${specimen.id}`);
    await request.delete(`${API}/specimens/${other.id}`);
  }
});

test('"Why it’s special" sits under the name in the form and at the top of the details', async ({ page, request }) => {
  const specimen = await createSpecimen(request, { name: `Why test ${Date.now()}` });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: '#' }).click();
    await page.getByRole('button', { name: '#' }).click(); // newest first
    await page.getByRole('row', { name: new RegExp(specimen.name) }).click();
    await page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) }).getByRole('button', { name: 'Edit' }).click();

    const form = page.getByRole('dialog', { name: `Edit #${specimen.id}` });
    await form.getByRole('textbox', { name: 'Why it’s special' }).fill('Looks like a slice of salami');
    await form.getByRole('button', { name: 'Save' }).click();

    const detail = page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) });
    await expect(detail.getByRole('region', { name: 'Why it’s special' })).toContainText('Looks like a slice of salami');
  } finally {
    await request.delete(`${API}/specimens/${specimen.id}`);
  }
});

test('A specimen can link to its mindat.org page; anything but a web address is refused', async ({ page, request }) => {
  const specimen = await createSpecimen(request, { name: `Link test ${Date.now()}` });
  const url = 'https://www.mindat.org/min-54558.html';
  try {
    await page.goto('/');
    await page.getByRole('button', { name: '#' }).click();
    await page.getByRole('button', { name: '#' }).click(); // newest first
    await page.getByRole('row', { name: new RegExp(specimen.name) }).click();
    await page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) }).getByRole('button', { name: 'Edit' }).click();

    const form = page.getByRole('dialog', { name: `Edit #${specimen.id}` });
    await form.getByRole('button', { name: /Notes/ }).click();
    const link = form.getByRole('textbox', { name: 'mindat.org link' });
    await link.fill('mindat zarinite');
    await form.getByRole('button', { name: 'Save' }).click();
    await expect(form.getByText('must be a web address starting with http:// or https://', { exact: true })).toBeVisible();

    await link.fill(url);
    await form.getByRole('button', { name: 'Save' }).click();
    const notes = page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) }).getByRole('region', { name: 'Notes' });
    await expect(notes.getByRole('link', { name: url })).toHaveAttribute('href', url);
  } finally {
    await request.delete(`${API}/specimens/${specimen.id}`);
  }
});

test('A stone marked as no longer in the collection is greyed out and kept off the public site', async ({ page, request }) => {
  const specimen = await createSpecimen(request, { name: `Gone test ${Date.now()}` });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: '#' }).click();
    await page.getByRole('button', { name: '#' }).click(); // newest first
    await page.getByRole('row', { name: new RegExp(specimen.name) }).click();
    await page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) }).getByRole('button', { name: 'Edit' }).click();

    const form = page.getByRole('dialog', { name: `Edit #${specimen.id}` });
    const pub = form.getByLabel('Show on the public site', { exact: true });
    await expect(pub).toBeChecked();
    await form.getByLabel('No longer in my collection', { exact: true }).click();
    await expect(pub).not.toBeChecked();
    await expect(pub).toBeDisabled();
    await form.getByRole('button', { name: 'Save' }).click();

    const detail = page.getByRole('dialog', { name: new RegExp(`#${specimen.id}`) });
    await expect(detail.getByText('No longer in your collection. It’s left off the public site from your next publish.')).toBeVisible();
    // The public switch is kept, so unmarking the stone restores it as it was
    expect(await (await request.get(`${API}/specimens/${specimen.id}`)).json()).toMatchObject({ gone: true, published: true });

    await detail.getByRole('button', { name: 'Close' }).click();
    await expect(detail).toHaveCount(0);
    await expect(page.getByRole('row', { name: new RegExp(specimen.name) }).getByText('Gone', { exact: true })).toBeVisible();
  } finally {
    await request.delete(`${API}/specimens/${specimen.id}`);
  }
});

test('"Add & next" keeps where-I-got-it details for the next specimen', async ({ page, request }) => {
  const prefix = `Batch test ${Date.now()}`;
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add a specimen' }).click();
    const form = page.getByRole('dialog', { name: 'Add a specimen' });
    await form.getByRole('textbox', { name: 'Name', exact: true }).fill(`${prefix} A`);
    await form.getByRole('button', { name: /Origin & acquisition/ }).click();
    await form.getByRole('textbox', { name: 'Where I got it', exact: true }).fill('Mineral fair');
    await form.getByRole('button', { name: 'Add & next' }).click();

    await expect(form.getByText(`Added “${prefix} A”`)).toBeVisible();
    await expect(form.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('');
    await form.getByRole('textbox', { name: 'Name', exact: true }).fill(`${prefix} B`);
    await form.getByRole('button', { name: /Origin & acquisition/ }).click();
    await expect(form.getByRole('textbox', { name: 'Where I got it', exact: true })).toHaveValue('Mineral fair');
    await form.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(form).toBeHidden();

    const recent = (await (await request.get(`${API}/specimens?size=10&sort=id&direction=desc`)).json()).content;
    const batch = recent.filter((s: { name: string }) => s.name.startsWith(prefix));
    expect(batch.map((s: { acquiredFrom: string }) => s.acquiredFrom)).toEqual(['Mineral fair', 'Mineral fair']);
  } finally {
    await deleteSpecimensNamed(request, prefix);
  }
});

test('A new material can be created from inside the specimen form; Type comes from the specimen nature', async ({ page, request }) => {
  const stamp = Date.now();
  const materialName = `Testite ${stamp}`;
  const specimenName = `Material test ${stamp}`;
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add a specimen' }).click();
    const form = page.getByRole('dialog', { name: 'Add a specimen' });
    await form.getByRole('textbox', { name: 'Name', exact: true }).fill(specimenName);
    await form.getByRole('combobox', { name: 'Nature' }).click();
    await page.getByRole('option', { name: 'Natural rock' }).click();
    await form.getByRole('button', { name: '+ Add material' }).click();
    await form.getByRole('combobox', { name: 'Material' }).fill(materialName);
    await page.getByRole('option', { name: `Add “${materialName}” as a new material` }).click();

    const materialDialog = page.getByRole('dialog', { name: 'Add a material' });
    await expect(materialDialog.getByRole('textbox', { name: 'Scientific name' })).toHaveValue(materialName);
    // A mineraloid only offers mineraloid families and starts without a crystal structure
    await materialDialog.getByRole('combobox', { name: 'Type' }).click();
    await page.getByRole('option', { name: 'Mineraloid' }).click();
    await expect(materialDialog.getByRole('combobox', { name: 'Crystal system' })).toHaveText('Amorphous (no crystal structure)');
    // A mineral always has a crystal structure, so switching to Mineral clears it again
    await materialDialog.getByRole('combobox', { name: 'Type' }).click();
    await page.getByRole('option', { name: 'Mineral', exact: true }).click();
    await expect(materialDialog.getByRole('combobox', { name: 'Crystal system' })).not.toHaveText(/Amorphous/);
    await materialDialog.getByRole('combobox', { name: 'Type' }).click();
    await page.getByRole('option', { name: 'Mineraloid' }).click();
    await expect(materialDialog.getByRole('combobox', { name: 'Crystal system' })).toHaveText('Amorphous (no crystal structure)');
    await materialDialog.getByRole('combobox', { name: 'Family' }).click();
    await expect(page.getByRole('option', { name: 'Silicate' })).toHaveCount(0);
    await page.getByRole('option', { name: 'Volcanic glass' }).click();
    await materialDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(form.getByRole('combobox', { name: 'Material' })).toHaveValue(materialName);

    await form.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(form).toBeHidden();
    const recent = (await (await request.get(`${API}/specimens?size=5&sort=id&direction=desc`)).json()).content;
    const created = recent.find((s: { name: string }) => s.name === specimenName);
    expect(created.components[0]).toMatchObject({ materialName, category: 'MINERALOID', family: 'VOLCANIC_GLASS', role: 'HOST', certainty: 'TENTATIVE' });
    expect(created.nature).toBe('NATURAL_ROCK');
    await page.getByRole('button', { name: '#' }).click();
    await page.getByRole('button', { name: '#' }).click(); // newest first
    const row = page.getByRole('row', { name: new RegExp(specimenName) });
    await expect(row.getByRole('cell', { name: 'Rock', exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: 'Volcanic glass', exact: true })).toBeVisible();
  } finally {
    await deleteSpecimensNamed(request, specimenName);
    const materials = await (await request.get(`${API}/materials`)).json();
    const material = materials.find((m: { name: string }) => m.name === materialName);
    if (material) await request.delete(`${API}/materials/${material.id}`);
  }
});
