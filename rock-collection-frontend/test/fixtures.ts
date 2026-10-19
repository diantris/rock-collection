// fixtures.ts - Playwright's test, with an API `request` context that sends the header the API requires on changes.
// Only the tests' direct API calls get it; pages must send it themselves (api.ts), so a missing header still fails.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  request: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ extraHTTPHeaders: { 'X-Rock-Collection': '1' } });
    await use(request);
    await request.dispose();
  },
});

export { expect };
