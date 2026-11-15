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

test('The search box finds stones by part of the name or market name, or by number', async ({ page, request }) => {
  const stamp = Date.now();
  const specimen = await createSpecimen(request, { name: `Searchable Dalmatian ${stamp}`, marketName: `Spotty jasper ${stamp}` });
  const other = await createSpecimen(request, { name: `Unrelated ${stamp}` });
  try {
    await page.goto('/');
    const table = page.getByRole('table', { name: 'Specimens' });
    const search = page.getByRole('searchbox', { name: 'Search specimens' });
    await search.fill(`dalmatian ${stamp}`);
    await expect(table.getByRole('row')).toHaveCount(2); // header + the match
    await expect(table.getByRole('row').nth(1)).toContainText(specimen.name);

    await search.fill(`JASPER ${stamp}`);
    await expect(table.getByRole('row').nth(1)).toContainText(specimen.name);
    await search.fill(`#${other.id}`);
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table.getByRole('row').nth(1)).toContainText(other.name);
    await search.fill(`nothing like this ${stamp}`);
    await expect(table.getByText(`No specimens match “nothing like this ${stamp}”.`)).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(search).toHaveValue('');
    await expect(table.getByText(/No specimens match/)).toBeHidden();
  } finally {
    await request.delete(`${API}/specimens/${specimen.id}`);
    await request.delete(`${API}/specimens/${other.id}`);
  }
});

test('"Where I got it" offers the places already used, the latest first', async ({ page, request }) => {
  const stamp = Date.now();
  const older = await createSpecimen(request, { name: `Place test A ${stamp}`, acquiredFrom: `Old fair ${stamp}` });
  const newer = await createSpecimen(request, { name: `Place test B ${stamp}`, acquiredFrom: `Etsy ${stamp}` });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add a specimen' }).click();
    const form = page.getByRole('dialog', { name: 'Add a specimen' });
    await form.getByRole('button', { name: /Origin & acquisition/ }).click();
    const place = form.getByRole('combobox', { name: 'Where I got it', exact: true });
    await place.click(); // the list opens without typing
    const options = page.getByRole('listbox').getByRole('option');
    await expect(options.first()).toHaveText(`Etsy ${stamp}`);
    await expect(page.getByRole('option', { name: `Old fair ${stamp}` })).toBeVisible();

    await place.fill('ets'); // a few letters narrow the list
    await expect(page.getByRole('option', { name: `Old fair ${stamp}` })).toBeHidden();
    await page.getByRole('option', { name: `Etsy ${stamp}` }).click();
    await expect(place).toHaveValue(`Etsy ${stamp}`);
  } finally {
    await request.delete(`${API}/specimens/${older.id}`);
    await request.delete(`${API}/specimens/${newer.id}`);
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

test('Columns can be resized (and reset); long text wraps instead of being cut off', async ({ page, request }) => {
  const specimen = await createSpecimen(request, {
    name: `Wrap test ${Date.now()}`, marketName: '"Herkimer Diamond Cabochon" (just quoting the seller, who was very sure about it)',
  });
  try {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.removeItem('specimenTable.columnWidths'));
    await page.reload();
    const table = page.getByRole('table', { name: 'Specimens' });
    await expect(table.getByRole('columnheader', { name: 'Name', exact: true })).toBeVisible();
    const header = table.getByRole('columnheader', { name: 'Market name' });
    const handle = page.getByRole('separator', { name: 'Resize Market name column' });
    await expect(handle).toHaveAttribute('aria-valuenow', '220');
    expect(await table.getByRole('separator', { name: 'Resize # column' }).count()).toBe(0); // # keeps its width

    // Keyboard: three steps wider; it's remembered after a reload
    await handle.focus();
    for (let i = 0; i < 3; i++) await handle.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '280');
    expect(Math.round((await header.boundingBox())!.width)).toBe(280);
    await page.reload();
    await expect(page.getByRole('separator', { name: 'Resize Market name column' })).toHaveAttribute('aria-valuenow', '280');

    // Mouse: drag the edge narrower; the long market name wraps onto more lines
    await page.getByRole('button', { name: '#' }).click();
    await page.getByRole('button', { name: '#' }).click(); // newest first
    const cellText = page.getByRole('row', { name: new RegExp(specimen.name) }).getByText(/Herkimer/);
    const oneLine = (await cellText.boundingBox())!.height;
    const box = (await page.getByRole('separator', { name: 'Resize Market name column' }).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByRole('separator', { name: 'Resize Market name column' })).toHaveAttribute('aria-valuenow', '120');
    expect((await cellText.boundingBox())!.height).toBeGreaterThan(oneLine * 2);

    // Double-click goes back to the starting width
    await page.getByRole('separator', { name: 'Resize Market name column' }).dblclick();
    await expect(page.getByRole('separator', { name: 'Resize Market name column' })).toHaveAttribute('aria-valuenow', '220');
  } finally {
    await page.evaluate(() => window.localStorage.removeItem('specimenTable.columnWidths'));
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
    await form.getByRole('combobox', { name: 'Where I got it', exact: true }).fill('Mineral fair');
    await form.getByRole('button', { name: 'Add & next' }).click();

    await expect(form.getByText(`Added “${prefix} A”`)).toBeVisible();
    await expect(form.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('');
    await form.getByRole('textbox', { name: 'Name', exact: true }).fill(`${prefix} B`);
    await form.getByRole('button', { name: /Origin & acquisition/ }).click();
    await expect(form.getByRole('combobox', { name: 'Where I got it', exact: true })).toHaveValue('Mineral fair');
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

test('The identification status is set by hand, shown in the details and the table, and sorts by certainty', async ({ page, request }) => {
  const name = `Status test ${Date.now()}`;
  // A confirmed material doesn't make it identified: the status is the owner's call
  const material = (await (await request.get(`${API}/materials`)).json())[0];
  const specimen = await createSpecimen(request, { name, components: [{ materialId: material.id, certainty: 'CONFIRMED' }] });
  const other = await createSpecimen(request, { name: `${name} known`, identificationStatus: 'IDENTIFIED' });
  try {
    expect((await (await request.get(`${API}/specimens/${specimen.id}`)).json()).identificationStatus).toBe('UNIDENTIFIED');

    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Search specimens' }).fill(name);
    await expect(page.getByRole('row', { name: new RegExp(`${name} known`) })).toBeVisible();
    await page.getByRole('cell', { name, exact: true }).click();
    const detail = page.getByRole('dialog', { name: `#${specimen.id} ${name}` });
    await expect(detail.getByRole('region', { name: 'Scientific identity' }).getByText('Unidentified', { exact: true })).toBeVisible();

    await detail.getByRole('button', { name: 'Edit' }).click();
    const form = page.getByRole('dialog', { name: `Edit #${specimen.id}` });
    await form.getByRole('combobox', { name: 'Identification status' }).click();
    await page.getByRole('option', { name: 'Possible ID' }).click();
    await expect(form.getByText('There’s an idea of what it is, but it’s only a guess.', { exact: false })).toBeVisible();
    await form.getByRole('button', { name: 'Save' }).click();

    const updated = page.getByRole('dialog', { name: `#${specimen.id} ${name}` });
    await expect(updated.getByRole('region', { name: 'Scientific identity' }).getByText('Possible ID', { exact: true })).toBeVisible();
    expect((await (await request.get(`${API}/specimens/${specimen.id}`)).json()).identificationStatus).toBe('POSSIBLE_ID');
    await page.keyboard.press('Escape');
    await expect(updated).toBeHidden();

    // The column (shown by default) sorts by certainty: possible ID before identified, then the other way round
    const table = page.getByRole('table', { name: 'Specimens' });
    await table.getByRole('button', { name: 'Identification' }).click();
    await expect(table.getByRole('row').nth(1)).toContainText('Possible ID');
    await expect(table.getByRole('row').nth(2)).toContainText('Identified');
    await table.getByRole('button', { name: 'Identification' }).click();
    await expect(table.getByRole('row').nth(1)).toContainText(`${name} known`);
  } finally {
    await request.delete(`${API}/specimens/${specimen.id}`);
    await request.delete(`${API}/specimens/${other.id}`);
  }
});
