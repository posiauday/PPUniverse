// Imports the component library (content/components) as DRAFTS (MVP-049).
//
//   DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=you@example.com \
//     pnpm --filter @ppu/adapter-content components:import
//
// - Every folder is checked first (Microsoft's pa.yaml schema, the
//   LowCodeStacks standard, the variations); if any is invalid, nothing is
//   imported.
// - A new slug is created as a DRAFT, authored by ARTICLE_AUTHOR_EMAIL (an
//   existing ADMIN).
// - An existing DRAFT is updated from its files, so a component can be fixed
//   after the product owner's paste-test. If its YAML changed, its test record
//   is cleared: the new YAML has to be tested again before it can be published.
// - A PUBLISHED component is never touched here.
import { prisma } from "@ppu/db";
import { PrismaComponentRepository, readComponentFolders } from "../dist/index.js";

const authorEmail = process.env.ARTICLE_AUTHOR_EMAIL;

async function main() {
  if (!authorEmail) throw new Error("Set ARTICLE_AUTHOR_EMAIL to an existing ADMIN user's email.");
  const author = await prisma.user.findUnique({ where: { email: authorEmail } });
  if (!author || author.role !== "ADMIN")
    throw new Error(`${authorEmail} is not an existing ADMIN user.`);

  const folders = readComponentFolders();
  if (folders.length === 0) {
    console.log("No content/components folders: nothing to import.");
    return;
  }
  const invalid = folders.filter((entry) => !entry.result.ok);
  if (invalid.length > 0) {
    for (const entry of invalid) console.error(`${entry.folder}: ${entry.result.errors.join("; ")}`);
    throw new Error(`${invalid.length} invalid component folder(s); nothing was imported.`);
  }

  const repository = new PrismaComponentRepository(prisma);
  const counts = { created: 0, updated: 0, skipped: 0 };
  for (const { folder, result } of folders) {
    const input = { ...result.component, authorUserId: author.id };
    const existing = await repository.findBySlug(input.slug);
    if (!existing) {
      await repository.create(input);
      console.log(`created draft component: ${folder}`);
      counts.created += 1;
    } else if (existing.status === "DRAFT") {
      const updated = await repository.replaceDraft(existing.id, input);
      const retest = existing.testedAt && !updated.testedAt ? " (YAML changed: test it again)" : "";
      console.log(`updated draft component: ${folder}${retest}`);
      counts.updated += 1;
    } else {
      console.log(`skipped published component: ${folder}`);
      counts.skipped += 1;
    }
  }
  console.log(
    `Done: ${counts.created} created, ${counts.updated} updated, ${counts.skipped} skipped. ` +
      "Test and publish them in /admin/components.",
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
