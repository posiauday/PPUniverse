import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["./vitest.setup.ts"],
    // The password-flow integration test hashes for real with the production
    // scrypt cost, several times over; a CI runner needed more than 5 seconds.
    testTimeout: 60_000,
  },
});
