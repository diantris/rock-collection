import { Page, APIRequestContext } from '@playwright/test';
import { test, expect } from './fixtures';

// Photo endpoints and the photo files are mocked with page.route: a real upload would push to the public Pages repo.
const API = process.env.API_BASE_URL ?? 'http://localhost:8080/api';
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

interface MockPhoto { id: number; fileName: string; url: string; smallUrl: string; caption: string | null; position: number; width: number; height: number }

const photo = (specimenId: number, id: number, position: number): MockPhoto => ({
  id, fileName: `photos/${specimenId}/${specimenId}-${id}.jpg`,
  url: `https://raw.githubusercontent.com/test/pages/main/photos/${specimenId}/${specimenId}-${id}.jpg`,
  smallUrl: `https://raw.githubusercontent.com/test/pages/main/photos/${specimenId}/${specimenId}-${id}-small.jpg`,
  caption: null, position, width: 1600, height: 1200,
});

async function createSpecimen(request: APIRequestContext, name: string): Promise<number> {
  const res = await request.post(`${API}/specimens`, { data: { name } });
  expect(res.status()).toBe(201);
  return (await res.json()).id;
}

/** Serves every photo and thumbnail as a 1×1 PNG, and pretends the specimen has a thumbnail in the table. */
async function mockImages(page: Page, specimenId: number) {
  await page.route('https://raw.githubusercontent.com/**', route => route.fulfill({ contentType: 'image/png', body: PIXEL }));
  await page.route(`**/api/specimens/${specimenId}/thumbnail*`, route => route.fulfill({ contentType: 'image/png', body: PIXEL }));
  await page.route('**/api/specimens?*', async route => {
    const page = await (await route.fetch()).json();
    for (const s of page.content) if (s.id === specimenId) s.thumbnailVersion = 1;
    await route.fulfill({ json: page });
  });
}

/** Sorts by # descending, so the newest specimen is on the first page. */
async function newestFirst(page: Page) {
  await page.getByRole('button', { name: '#' }).click();
  await page.getByRole('button', { name: '#' }).click();
}

let specimenId: number;
let name: string;

test.beforeEach(async ({ request }) => {
  name = `Photo test ${Date.now()}`;
  specimenId = await createSpecimen(request, name);
});

test.afterEach(async ({ request }) => {
  await request.delete(`${API}/specimens/${specimenId}`);
});

test('Table photo opens a gallery with dots, arrows and keyboard navigation', async ({ page }) => {
  await mockImages(page, specimenId);
  await page.route(`**/api/specimens/${specimenId}/photos`, route =>
    route.fulfill({ json: [photo(specimenId, 1, 0), photo(specimenId, 2, 1), photo(specimenId, 3, 2)] }));
  await page.goto('/');
  await newestFirst(page);

  await page.getByRole('button', { name: `Photos of ${name}` }).click();
  const gallery = page.getByRole('dialog', { name: `${name} photos` });
  await expect(gallery).toBeVisible();
  await expect(gallery.getByRole('img', { name: `${name}, photo 1 of 3` })).toBeVisible();
  await expect(gallery.getByRole('button', { name: 'Photo 1' })).toHaveAttribute('aria-current', 'true');

  await gallery.getByRole('button', { name: 'Next photo' }).click();
  await expect(gallery.getByRole('button', { name: 'Photo 2' })).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(gallery.getByText('3 / 3')).toBeVisible();
  await page.keyboard.press('ArrowRight'); // wraps around
  await expect(gallery.getByRole('button', { name: 'Photo 1' })).toHaveAttribute('aria-current', 'true');
  await gallery.getByRole('button', { name: 'Photo 3' }).click();
  await expect(gallery.getByRole('img', { name: `${name}, photo 3 of 3` })).toBeVisible();

  await gallery.getByRole('button', { name: 'Close gallery' }).click();
  await expect(gallery).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0); // the photo opens the gallery, not the details
});

test('Details: upload photos, make one the cover and delete one', async ({ page }) => {
  await mockImages(page, specimenId);
  let photos: MockPhoto[] = [];
  let uploadedBody = '';
  let newOrder: number[] = [];
  await page.route(`**/api/specimens/${specimenId}/photos`, async route => {
    if (route.request().method() === 'POST') {
      uploadedBody = route.request().postDataBuffer()?.toString('latin1') ?? '';
      photos = [photo(specimenId, 1, 0), photo(specimenId, 2, 1)];
      return route.fulfill({ status: 201, json: photos });
    }
    return route.fulfill({ json: photos });
  });
  await page.route(`**/api/specimens/${specimenId}/photos/order`, async route => {
    newOrder = route.request().postDataJSON();
    photos = newOrder.map((id, position) => ({ ...photo(specimenId, id, position) }));
    await route.fulfill({ json: photos });
  });
  await page.route(`**/api/specimens/${specimenId}/photos/*`, async route => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    const id = Number(route.request().url().split('/').pop());
    photos = photos.filter(p => p.id !== id).map((p, position) => ({ ...p, position }));
    await route.fulfill({ status: 204 });
  });

  await page.goto('/');
  await newestFirst(page);
  await page.getByRole('row', { name: new RegExp(name) }).getByRole('cell', { name, exact: true }).click();
  const details = page.getByRole('dialog', { name: `#${specimenId} ${name}` });
  const section = details.getByRole('region', { name: 'Photos' });
  await expect(section.getByText('No photos yet')).toBeVisible();

  await section.getByLabel('Photo files').setInputFiles([
    { name: 'front.jpg', mimeType: 'image/jpeg', buffer: PIXEL },
    { name: 'back.jpg', mimeType: 'image/jpeg', buffer: PIXEL },
  ]);
  await expect(section.getByRole('button', { name: /^Open photo/ })).toHaveCount(2);
  expect(uploadedBody).toContain('filename="front.jpg"');
  expect(uploadedBody).toContain('filename="back.jpg"');
  await expect(section.getByText('Cover')).toBeVisible();

  await section.getByRole('button', { name: 'Make photo 2 the cover' }).click();
  await expect.poll(() => newOrder).toEqual([2, 1]);
  await expect(section.getByRole('button', { name: 'Open photo 1' }).locator('img')).toHaveAttribute('src', /-2-small\.jpg$/);

  await section.getByRole('button', { name: 'Delete photo 2' }).click(); // now the original first photo
  await page.getByRole('dialog', { name: 'Delete this photo?' }).getByRole('button', { name: 'Delete' }).click();
  await expect(section.getByRole('button', { name: /^Open photo/ })).toHaveCount(1);
  expect(photos.map(p => p.id)).toEqual([2]);
  await expect(section.getByText(/publish again to update it/)).toBeVisible();
});

test('Add form uploads the chosen photos once the specimen is saved', async ({ page, request }) => {
  let uploadedTo = '';
  await page.route('**/api/specimens/*/photos', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    uploadedTo = route.request().url();
    await route.fulfill({ status: 201, json: [] });
  });
  await page.goto('/');
  const addedName = `${name} (form)`;
  await page.getByRole('button', { name: 'Add a specimen' }).click();
  const form = page.getByRole('dialog', { name: 'Add a specimen' });
  await form.getByRole('textbox', { name: 'Name', exact: true }).fill(addedName);
  await form.getByLabel('Photo files').setInputFiles({ name: 'rock.jpg', mimeType: 'image/jpeg', buffer: PIXEL });
  await expect(form.getByRole('button', { name: 'rock.jpg' })).toBeVisible(); // deletable chip
  await form.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(form).toHaveCount(0);

  const added = (await (await request.get(`${API}/specimens?sort=id&direction=desc&size=5`)).json()).content
    .find((s: { name: string }) => s.name === addedName);
  expect(uploadedTo).toMatch(new RegExp(`/api/specimens/${added.id}/photos$`));
  await request.delete(`${API}/specimens/${added.id}`);
});

test('API: a new specimen has no photos and no thumbnail; a non-image upload is refused', async ({ request }) => {
  expect(await (await request.get(`${API}/specimens/${specimenId}/photos`)).json()).toEqual([]);
  expect((await request.get(`${API}/specimens/${specimenId}/thumbnail`)).status()).toBe(404);

  // Refused before anything is pushed: 400 when GitHub is configured (not an image), 503 when it isn't
  const res = await request.post(`${API}/specimens/${specimenId}/photos`, {
    multipart: { files: { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a photo') } },
  });
  expect([400, 503]).toContain(res.status());
  expect((await res.json()).error).toBeTruthy();
  expect(await (await request.get(`${API}/specimens/${specimenId}/photos`)).json()).toEqual([]);
});
