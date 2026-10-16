// playwright.config.ts - End-to-end tests; expect the full stack (db, api, frontend) to be running
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  use: {
    baseURL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  },
});
