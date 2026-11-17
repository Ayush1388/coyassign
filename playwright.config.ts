import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const env = { DATABASE_URL: "file:./data/e2e.db", DEMO_RESET: "true", PORT: String(PORT) };

export default defineConfig({
  testDir: "tests/e2e",
  // All tests share one SQLite DB and reset it, so run them one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 860 } } },
  ],
  webServer: {
    command: `pnpm exec tsx db/setup.ts --reset && pnpm exec next build && pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/feed`,
    env,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
