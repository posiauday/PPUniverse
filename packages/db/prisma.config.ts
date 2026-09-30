import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` doesn't need a real database connection, but the
// `env()` helper from `prisma/config` throws eagerly while loading this
// file if the variable is unset — before Prisma even checks whether the
// invoked command needs it. Reading process.env directly instead lets
// `generate` (used by build/typecheck/test, e.g. in CI before a real
// DATABASE_URL is configured for those steps) succeed with undefined;
// commands that actually need a connection (migrate deploy, runtime
// queries) still fail clearly on their own if it's genuinely missing.
export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
