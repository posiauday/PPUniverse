import { defineConfig } from "vitest/config";

export default defineConfig({
  // apps/web's tsconfig uses "jsx": "preserve" (Next.js compiles JSX itself).
  // Tests that import page components need the automatic JSX runtime instead.
  oxc: { jsx: { runtime: "automatic" } },
  test: { environment: "node" },
});
