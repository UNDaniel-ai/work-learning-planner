import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    channel: process.env.CI ? undefined : "chrome",
    trace: "on-first-retry"
  },
  webServer: {
    command:
      "DATABASE_URL=file:local.db TEST_DATABASE_URL=file:local.e2e.db LEARNING_ASSETS_DIR=temp/e2e-learning-assets pnpm dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
