import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**"],
    // The password tests hash for real with the production scrypt cost (about
    // 0.3 s each, and several times that while the whole workspace runs in
    // parallel), so a test that signs in six times needs more than 5 seconds.
    testTimeout: 60_000,
  },
});
