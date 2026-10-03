// Imports drafted platform updates (content/updates/*.md) as DRAFTS (MVP-033 slice D).
//
//   DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=you@example.com \
//     pnpm --filter @ppu/adapter-content updates:import
//
// The same rules as content:import (import-articles.mjs):
// - Every file is validated first; if any is invalid, nothing is imported.
// - An update whose slug already exists is skipped, never overwritten.
// - Updates are created as DRAFT, authored by ARTICLE_AUTHOR_EMAIL (an
//   existing ADMIN). The product owner reviews and publishes in /admin/updates.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@ppu/db";
import { parseUpdateSource } from "@ppu/domain-content";
import { PrismaUpdateRepository } from "../dist/index.js";

const root = fileURLToPath(new URL("../../../../content/updates/", import.meta.url));
const authorEmail = process.env.ARTICLE_AUTHOR_EMAIL;

async function main() {
  if (!authorEmail) throw new Error("Set ARTICLE_AUTHOR_EMAIL to an existing ADMIN user's email.");
  const author = await prisma.user.findUnique({ where: { email: authorEmail } });
  if (!author || author.role !== "ADMIN")
    throw new Error(`${authorEmail} is not an existing ADMIN user.`);

  const parsed = readdirSync(root)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => ({ name, result: parseUpdateSource(readFileSync(join(root, name), "utf8")) }));
  const invalid = parsed.filter((entry) => !entry.result.ok);
  if (invalid.length > 0) {
    for (const entry of invalid) console.error(`${entry.name}: ${entry.result.errors.join("; ")}`);
    throw new Error(`${invalid.length} invalid update file(s); nothing was imported.`);
  }

  const repository = new PrismaUpdateRepository(prisma);
  let created = 0;
  let skipped = 0;
  for (const { name, result } of parsed) {
    const { update } = result;
    if (await repository.findUpdateBySlug(update.slug)) {
      console.log(`skipped (already exists): ${name}`);
      skipped += 1;
      continue;
    }
    await repository.createUpdate({ ...update, authorUserId: author.id });
    console.log(`created draft: ${name}`);
    created += 1;
  }
  console.log(
    `Done: ${created} draft(s) created, ${skipped} skipped. Review and publish them in /admin/updates.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
