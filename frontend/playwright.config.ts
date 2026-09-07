import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "python3 -m uvicorn main:app --port 8000",
      cwd: "../backend",
      port: 8000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      port: 3001,
      env: { PORT: "3001" },
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
