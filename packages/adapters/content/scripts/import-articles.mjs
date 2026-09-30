// Imports launch articles (content/articles/**/*.md) as DRAFTS (MVP-029).
//
//   DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=you@example.com \
//     pnpm --filter @ppu/adapter-content content:import
//
// - Every file is validated first; if any is invalid, nothing is imported.
// - An article whose slug already exists is skipped, never overwritten, so
//   edits made in the admin editor are safe and re-running is harmless.
// - Articles are created as DRAFT, authored by ARTICLE_AUTHOR_EMAIL, which
//   must be an existing ADMIN. Publishing stays a deliberate step in the
//   admin editor (docs/final-decisions.md, "Launch content plan approved").
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@ppu/db";
import { parseArticleSource } from "@ppu/domain-content";
import { PrismaContentRepository } from "../dist/index.js";

const root = fileURLToPath(new URL("../../../../content/articles/", import.meta.url));
const authorEmail = process.env.ARTICLE_AUTHOR_EMAIL;

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return name.endsWith(".md") && name !== "README.md" ? [path] : [];
  });
}

async function main() {
  if (!authorEmail) throw new Error("Set ARTICLE_AUTHOR_EMAIL to an existing ADMIN user's email.");
  const author = await prisma.user.findUnique({ where: { email: authorEmail } });
  if (!author || author.role !== "ADMIN") throw new Error(`${authorEmail} is not an existing ADMIN user.`);

  const parsed = markdownFiles(root).map((path) => ({
    name: relative(root, path).split("\\").join("/"),
    result: parseArticleSource(readFileSync(path, "utf8")),
  }));
  const invalid = parsed.filter((entry) => !entry.result.ok);
  if (invalid.length > 0) {
    for (const entry of invalid) console.error(`${entry.name}: ${entry.result.errors.join("; ")}`);
    throw new Error(`${invalid.length} invalid article file(s); nothing was imported.`);
  }

  const repository = new PrismaContentRepository(prisma);
  let created = 0;
  let skipped = 0;
  for (const { name, result } of parsed) {
    const { article } = result;
    if (await repository.findArticleBySlug(article.slug)) {
      console.log(`skipped (already exists): ${name}`);
      skipped += 1;
      continue;
    }
    await repository.createArticle({ ...article, authorUserId: author.id });
    console.log(`created draft: ${name}`);
    created += 1;
  }
  console.log(`Done: ${created} draft(s) created, ${skipped} skipped. Review and publish them in /admin/content.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
