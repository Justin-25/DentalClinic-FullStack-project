import { defineConfig, devices } from "@playwright/test";

// End-to-end tests: a real browser drives the real app (Vite + Express + MongoDB).
// If the servers are already running (npm run dev / npm run start:dev), they are reused.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // tests share one dev database, so run them one at a time
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure", // step-by-step replay of failed tests: npx playwright show-trace
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "npm run start:dev",
      cwd: "../backend/dentalClinic",
      url: "http://localhost:3000/api/services",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
    },
  ],
});
