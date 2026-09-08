import { defineConfig, devices } from '@playwright/test';

/**
 * Kya Pehnu customer web storefront E2E.
 *
 * The web bundle in customer-app/dist-web is exported with baseUrl "/app", so it
 * is served through e2e/webroot (which symlinks app -> ../customer-app/dist-web)
 * and opened at /app/. When served over http on localhost the bundle's
 * resolveBaseUrl() points the app at the local API on :5001 (see
 * customer-app/src/api/vendorApi.js), so the UI drives the real backend.
 *
 * The backend runs against a THROWAWAY local database (kyapehnu_e2e) — never the
 * .env MONGO_URI — so tests never touch real or production data. A local mongod
 * on 127.0.0.1:27017 is assumed running.
 */

const WEB_PORT = 8090;
const API_PORT = 5001;
const WEB_BASE = `http://localhost:${WEB_PORT}/app/`;
const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/kyapehnu_e2e';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: WEB_BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: [
    {
      command: `MONGO_URI="${TEST_MONGO_URI}" PORT=${API_PORT} NODE_ENV=development ALLOW_DEV_TOKEN=true node server.js`,
      cwd: '../backend',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: `python3 -m http.server ${WEB_PORT} --directory webroot`,
      cwd: '.',
      url: WEB_BASE,
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});
