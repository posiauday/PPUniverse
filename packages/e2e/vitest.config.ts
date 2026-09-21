import { defineConfig } from "vitest/config";

// Unit tests for the harness's own pure logic (contrast maths, the database
// guard, reserved-prefix rules, axe configuration, route coverage). They need
// no browser, no database and no server, so `pnpm test` stays fast; the
// Playwright specs under tests/ run through `pnpm test:a11y` instead.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
