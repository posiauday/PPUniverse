// BUG-015 test isolation: rewrites DATABASE_URL to this package's own
// Postgres schema before any test file's beforeAll touches @ppu/db's prisma
// client. See packages/db/src/test-schema-isolation.ts and
// planning/prework/BUG-015-prework-analysis.md.
import { applyTestSchemaIsolation } from "@ppu/db";

applyTestSchemaIsolation();
