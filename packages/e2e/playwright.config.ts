import { randomBytes } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

/**
 * Accessibility gate configuration (MVP-023; decisions Q33, Q34, Q39 in
 * docs/final-decisions.md).
 *
 * - Three engine projects on Playwright's PINNED, bundled browser builds:
 *   chromium, firefox, webkit. No `channel` is set anywhere, so no moving or
 *   branded build can gate a merge.
 * - Viewport widths (320, 375, 768, 1280) are exercised inside the specs, from
 *   src/matrix.ts, so tests that do not depend on width are not repeated four times.
 * - No retries: a flaky accessibility test is a defect, not something to mask.
 * - The application under test is a production build served by `next start`
 *   (E2E_SERVER_MODE=dev is for fast local iteration only and is never used in CI).
 */

const PORT = Number.parseInt(process.env["E2E_PORT"] ?? "3100", 10);
const BASE_URL = `http://localhost:${PORT}`;
const isCi = process.env["CI"] === "true";
const devServer = process.env["E2E_SERVER_MODE"] === "dev";

if (!process.env["DATABASE_URL"]) {
  console.warn(
    "[e2e] DATABASE_URL is not set: the application server cannot reach a database and the specs will fail.",
  );
}

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: 0,
  workers: isCi ? 3 : undefined,
  timeout: 45_000,
  expect: { timeout: 7_500 },
  reporter: isCi
    ? [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["junit", { outputFile: "results/junit.xml" }],
        ["json", { outputFile: "results/results.json" }],
        ["./src/summary-reporter.ts"],
      ]
    : [["list"], ["./src/summary-reporter.ts"]],
  use: {
    baseURL: BASE_URL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "UTC",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `pnpm --filter @ppu/web exec next ${devServer ? "dev" : "start"} -p ${PORT}`,
    url: `${BASE_URL}/api/health`,
    timeout: 180_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...(process.env as Record<string, string>),
      NEXTAUTH_URL: BASE_URL,
      // A throwaway per-run secret: never committed, never reused.
      NEXTAUTH_SECRET: process.env["NEXTAUTH_SECRET"] ?? randomBytes(32).toString("hex"),
      // Only used to build canonical URLs and structured data; nothing is fetched from it.
      NEXT_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://e2e.example.org",
    },
  },
});
