import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer between 1 and 65535.');
}
const url = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PLAYWRIGHT_REPORT_PATH || '.codex/qa/browser-results.json' }],
  ],
  outputDir: '.codex/qa/browser-artifacts',
  use: {
    baseURL: url,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --port ${port} --strictPort`,
    url,
    reuseExistingServer: false,
  },
});
