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

test('A new material can be created from inside the specimen form', async ({ page, request }) => {
  const stamp = Date.now();
  const materialName = `Testite ${stamp}`;
  const specimenName = `Material test ${stamp}`;
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add a specimen' }).click();
    const form = page.getByRole('dialog', { name: 'Add a specimen' });
    await form.getByRole('textbox', { name: 'Name', exact: true }).fill(specimenName);
    await form.getByRole('button', { name: '+ Add material' }).click();
    await form.getByRole('combobox', { name: 'Material' }).fill(materialName);
    await page.getByRole('option', { name: `Add “${materialName}” as a new material` }).click();

    const materialDialog = page.getByRole('dialog', { name: 'Add a material' });
    await expect(materialDialog.getByRole('textbox', { name: 'Scientific name' })).toHaveValue(materialName);
    await materialDialog.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(form.getByRole('combobox', { name: 'Material' })).toHaveValue(materialName);

    await form.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(form).toBeHidden();
    const recent = (await (await request.get(`${API}/specimens?size=5&sort=id&direction=desc`)).json()).content;
    const created = recent.find((s: { name: string }) => s.name === specimenName);
    expect(created.components[0]).toMatchObject({ materialName, role: 'HOST', certainty: 'TENTATIVE' });
  } finally {
    await deleteSpecimensNamed(request, specimenName);
    const materials = await (await request.get(`${API}/materials`)).json();
    const material = materials.find((m: { name: string }) => m.name === materialName);
    if (material) await request.delete(`${API}/materials/${material.id}`);
  }
});
