// Imports new guide and update drafts into the production database during the
// Netlify production build, after the site is built (apps/web/netlify.toml,
// [context.production]). docs/final-decisions.md, 2026-10-06, "Drafts import
// automatically on release".
//
// It runs the same two importers a person would run by hand (content:import
// and updates:import), with the build's own DATABASE_URL:
// - they create DRAFTS only, and skip any slug that already exists, so edits
//   made in the admin and anything already published are never touched;
// - publishing stays the product owner's click in /admin/content and
//   /admin/updates. Nothing here publishes.
//
// Importing drafts must never block a release, so a failure is reported as a
// warning in the build log and the deploy goes ahead.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const IMPORTERS = ["content:import", "updates:import"];

/**
 * Decides whether to import, from the build environment. Pure, so it is
 * unit-tested (import-drafts-on-deploy.test.mjs).
 * @param {Record<string, string | undefined>} env
 * @returns {{ run: boolean, message: string }}
 */
export function importPlan(env) {
  if (env.CONTEXT !== "production") {
    return {
      run: false,
      message: `Skipping draft import: Netlify context is "${env.CONTEXT ?? "unset"}", not "production".`,
    };
  }
  if (!env.ARTICLE_AUTHOR_EMAIL) {
    return {
      run: false,
      message:
        "Skipping draft import: ARTICLE_AUTHOR_EMAIL is not set in Netlify. Set it to an admin's " +
        "email to import new guide and update drafts on each release. See docs/15-deployment.md.",
    };
  }
  if (!env.DATABASE_URL) {
    return { run: false, message: "Skipping draft import: DATABASE_URL is not set." };
  }
  return { run: true, message: "Importing new guide and update drafts (drafts only)..." };
}

function main() {
  const plan = importPlan(process.env);
  console.log(plan.message);
  if (!plan.run) return;
  for (const script of IMPORTERS) {
    const result = spawnSync("pnpm", ["--filter", "@ppu/adapter-content", script], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) {
      console.warn(
        `WARNING: ${script} failed (exit ${result.status ?? "unknown"}). The deploy continues; ` +
          "fix the error above and run it by hand or on the next release.",
      );
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
