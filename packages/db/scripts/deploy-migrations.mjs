// Applies pending Prisma migrations to the production database during the
// Netlify production build, before the site is built (apps/web/netlify.toml,
// [context.production]). docs/final-decisions.md, 2026-10-05, "Production
// migrations run automatically on release".
//
// Netlify publishes a deploy only when its build succeeds, so:
// - migrations always land before the code that needs them goes live;
// - if a migration fails, the build fails and the previous deploy stays live.
//
// The connection: MIGRATE_DATABASE_URL if set, otherwise the site's own
// DATABASE_URL. Migrations can't run through Supabase's transaction pooler
// (port 6543), so a Supabase pooler address on 6543 is switched to 5432, the
// same host, user and password in session mode (Supabase docs, "Connecting to
// Postgres": "Port 5432 reaches ... Supavisor for session mode"). Only the
// variable name, host and port are ever printed, never the password.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SUPABASE_POOLER_HOST = /\.pooler\.supabase\.com$/;

/**
 * Decides whether and how to migrate, from the build environment. Pure, so it
 * is unit-tested (deploy-migrations.test.mjs).
 * @param {Record<string, string | undefined>} env
 * @returns {{ run: true, url: string, message: string } | { run: false, message: string, fail: boolean }}
 */
export function migrationPlan(env) {
  if (env.CONTEXT !== "production") {
    return {
      run: false,
      fail: false,
      message: `Skipping migrations: Netlify context is "${env.CONTEXT ?? "unset"}", not "production".`,
    };
  }
  const source = env.MIGRATE_DATABASE_URL ? "MIGRATE_DATABASE_URL" : "DATABASE_URL";
  const value = env[source];
  if (!value) {
    return {
      run: false,
      fail: true,
      message:
        "Neither MIGRATE_DATABASE_URL nor DATABASE_URL is set for production builds in Netlify. " +
        "See docs/15-deployment.md.",
    };
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    return { run: false, fail: true, message: `${source} is not a valid URL.` };
  }
  let note = "";
  if (url.port === "6543") {
    if (!SUPABASE_POOLER_HOST.test(url.hostname)) {
      return {
        run: false,
        fail: true,
        message:
          `${source} uses port 6543 (a transaction pooler) on a host that isn't Supabase's ` +
          "pooler, so it can't be switched to session mode. Set MIGRATE_DATABASE_URL to a 5432 string.",
      };
    }
    url.port = "5432";
    note = " (switched from the transaction pooler, 6543, to session mode)";
  }
  return {
    run: true,
    url: url.toString(),
    message: `Applying production migrations via ${source}: ${url.hostname}:${url.port || "5432"}${note}.`,
  };
}

function main() {
  const plan = migrationPlan(process.env);
  if (!plan.run) {
    (plan.fail ? console.error : console.log)(plan.message);
    process.exitCode = plan.fail ? 1 : 0;
    return;
  }
  console.log(plan.message);
  const result = spawnSync("pnpm", ["--filter", "@ppu/db", "exec", "prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: plan.url },
    shell: process.platform === "win32",
  });
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
