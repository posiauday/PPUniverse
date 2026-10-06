// Applies pending Prisma migrations to the production database during the
// Netlify production build, before the site is built (apps/web/netlify.toml,
// [context.production]). docs/final-decisions.md, 2026-10-05, "Production
// migrations run automatically on release".
//
// Netlify publishes a deploy only when its build succeeds, so:
// - migrations always land before the code that needs them goes live;
// - if a migration fails, the build fails and the previous deploy stays live.
//
// Reads MIGRATE_DATABASE_URL (the 5432 session or direct connection string,
// set in the Netlify UI for the Production context only). The app's own
// DATABASE_URL is the 6543 transaction pooler, which migrations can't use.
// The connection string is never printed.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Decides whether to migrate, from the build environment. Pure, so it is
 * unit-tested (deploy-migrations.test.mjs).
 * @param {Record<string, string | undefined>} env
 * @returns {{ run: true, url: string } | { run: false, message: string, fail: boolean }}
 */
export function migrationPlan(env) {
  if (env.CONTEXT !== "production") {
    return {
      run: false,
      fail: false,
      message: `Skipping migrations: Netlify context is "${env.CONTEXT ?? "unset"}", not "production".`,
    };
  }
  const url = env.MIGRATE_DATABASE_URL;
  if (!url) {
    return {
      run: false,
      fail: true,
      message:
        "MIGRATE_DATABASE_URL is not set. Add the Supabase 5432 connection string to Netlify " +
        "(Site configuration > Environment variables, Production context). See docs/15-deployment.md.",
    };
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { run: false, fail: true, message: "MIGRATE_DATABASE_URL is not a valid URL." };
  }
  if (parsed.port === "6543") {
    return {
      run: false,
      fail: true,
      message:
        "MIGRATE_DATABASE_URL uses port 6543 (the transaction pooler), which migrations can't use. " +
        "Use the 5432 session or direct connection string.",
    };
  }
  return { run: true, url };
}

function main() {
  const plan = migrationPlan(process.env);
  if (!plan.run) {
    (plan.fail ? console.error : console.log)(plan.message);
    process.exitCode = plan.fail ? 1 : 0;
    return;
  }
  console.log("Applying production migrations (prisma migrate deploy)...");
  const result = spawnSync("pnpm", ["--filter", "@ppu/db", "exec", "prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: plan.url },
    shell: process.platform === "win32",
  });
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
