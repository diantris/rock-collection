import { test, expect } from '@playwright/test';

// Base URL for the backend API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

// Test: GET /rocks returns a list of rocks
test('GET /rocks returns a list of rocks', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/rocks`);
  expect(response.ok()).toBeTruthy();
  const rocks = await response.json();
  expect(Array.isArray(rocks)).toBeTruthy();
  if (rocks.length > 0) {
    expect(rocks[0]).toHaveProperty('id');
    expect(rocks[0]).toHaveProperty('name');
    expect(rocks[0]).toHaveProperty('group_name');
  }
});

// Test: GET /groups returns a list of groups
test('GET /groups returns a list of groups', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/groups`);
  expect(response.ok()).toBeTruthy();
  const groups = await response.json();
  expect(Array.isArray(groups)).toBeTruthy();
  if (groups.length > 0) {
    expect(groups[0]).toHaveProperty('id');
    expect(groups[0]).toHaveProperty('groupName');
  }
});

// Test: POST /rocks adds a new rock and DELETE /rocks/:id deletes it
test('POST /rocks adds a new rock and DELETE /rocks/:id deletes it', async ({ request }) => {
  // Add a new rock with correct backend property names
  const newRock = {
    rockName: 'Test Rock', // Use the property expected by backend
    marketName: 'Test Market',
    group: { id: 1 }, // Assumes group with id 1 exists
    origin: 'Test Origin'
  };
  const addResponse = await request.post(`${API_BASE_URL}/rocks`, {
    data: newRock,
  });
  expect(addResponse.ok()).toBeTruthy();
  const addedRock = await addResponse.json();
  expect(addedRock).toHaveProperty('id');

  // Delete the rock
  const deleteResponse = await request.delete(`${API_BASE_URL}/rocks/${addedRock.id}`);
  expect(deleteResponse.ok()).toBeTruthy();
});
