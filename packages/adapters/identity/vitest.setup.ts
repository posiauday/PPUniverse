// BUG-015 test isolation: rewrites DATABASE_URL to this package's own
// Postgres schema before any test file's beforeAll touches @ppu/db's prisma
// client. See packages/db/src/test-schema-isolation.ts and
// planning/prework/BUG-015-prework-analysis.md. The package name is an
// explicit literal, not inferred from an environment variable — see
// test-schema-isolation.ts's header comment for why.
import { applyTestSchemaIsolation } from "@ppu/db";

applyTestSchemaIsolation("identity");
