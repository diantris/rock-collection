import { test, expect } from './fixtures';

// Base URL for the backend API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

test('GET /specimens returns a page', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/specimens?page=0&size=5&sort=name&direction=asc`);
  expect(response.ok()).toBeTruthy();
  const page = await response.json();
  expect(Array.isArray(page.content)).toBeTruthy();
  expect(page).toMatchObject({ page: 0, size: 5 });
  expect(typeof page.totalElements).toBe('number');
});

test('GET /materials returns the seeded reference list', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/materials`);
  expect(response.ok()).toBeTruthy();
  const materials = await response.json();
  expect(materials.map((m: { name: string }) => m.name)).toContain('Quartz');
});

test('Specimen with components can be created, read and deleted', async ({ request }) => {
  const materials: { id: number; name: string }[] = await (await request.get(`${API_BASE_URL}/materials`)).json();
  const quartz = materials.find(m => m.name === 'Quartz')!;
  const garnet = materials.find(m => m.name === 'Garnet')!;

  const createResponse = await request.post(`${API_BASE_URL}/specimens`, {
    data: {
      name: 'API test: quartz with garnet',
      form: 'ROUGH',
      components: [
        { materialId: quartz.id, role: 'HOST', certainty: 'CONFIRMED' },
        { materialId: garnet.id, role: 'INCLUSION' },
      ],
      weightG: 12.5,
      hardnessMax: 7,
      price: 1,
      tags: ['api-test-tag'],
      specialProperties: ['FLUORESCENT'],
      color: '',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();
  expect(created.color).toBeNull(); // blanks are stored as unknown
  expect(created.components).toMatchObject([
    { materialId: quartz.id, materialName: 'Quartz', category: 'MINERAL', family: 'SILICATE', role: 'HOST', certainty: 'CONFIRMED' },
    { materialId: garnet.id, materialName: 'Garnet', role: 'INCLUSION', certainty: 'TENTATIVE' },
  ]);

  const fetched = await (await request.get(`${API_BASE_URL}/specimens/${created.id}`)).json();
  expect(fetched).toMatchObject({ weightG: 12.5, hardnessMin: 7, hardnessMax: 7, currency: 'PLN', specialProperties: ['FLUORESCENT'] });
  expect(await (await request.get(`${API_BASE_URL}/specimens/tags`)).json()).toContain('api-test-tag');

  // A material in use can't be deleted
  expect((await request.delete(`${API_BASE_URL}/materials/${quartz.id}`)).status()).toBe(409);

  expect((await request.delete(`${API_BASE_URL}/specimens/${created.id}`)).status()).toBe(204);
  expect((await request.get(`${API_BASE_URL}/specimens/${created.id}`)).status()).toBe(404);
});

test('Specimen without a name is rejected with field errors', async ({ request }) => {
  const response = await request.post(`${API_BASE_URL}/specimens`, { data: { name: '' } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toHaveProperty('name');
});

test('Other web sites can neither change nor read data through the browser', async ({ playwright, request }) => {
  // A change without the app's header (what a form on another site would send) is refused
  const plain = await playwright.request.newContext();
  expect((await plain.post(`${API_BASE_URL}/publish`)).status()).toBe(403);
  await plain.dispose();

  // CORS only lets the app's own address in
  const preflight = (origin: string) => request.fetch(`${API_BASE_URL}/specimens/1`, {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'DELETE', 'Access-Control-Request-Headers': 'x-rock-collection' },
  });
  expect((await preflight('https://evil.example')).headers()['access-control-allow-origin']).toBeUndefined();
  const app = new URL(process.env.FRONTEND_URL || 'http://localhost:3000').origin;
  expect((await preflight(app)).headers()['access-control-allow-origin']).toBe(app);
});

test('Behind an HTTPS proxy (the VM), the app’s own page may change data and other sites still may not', async ({ request }) => {
  // What Caddy passes on from https://<name>.duckdns.org: plain HTTP inside, the browser's HTTPS in X-Forwarded-Proto.
  // Day 14: without trusting that header the API took its own page for another site (403 "Invalid CORS request").
  const pin = (origin: string) => request.put(`${API_BASE_URL}/specimens/999999/pinned`, {
    data: { pinned: true },
    headers: { Origin: origin, Host: 'rock-collection.example', 'X-Forwarded-Proto': 'https' },
  });
  expect((await pin('https://rock-collection.example')).status()).toBe(404); // past CORS; that specimen doesn't exist
  expect((await pin('https://evil.example')).status()).toBe(403);
});
