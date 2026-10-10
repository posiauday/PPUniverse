// Local-only (not committed): publishes content/components in the LOCAL dev database only.
import { prisma } from "@ppu/db";
import { readComponentFolders } from "../dist/component-files.js";

if (!/@localhost:\d+\//.test(process.env.DATABASE_URL ?? "")) throw new Error("Local database only.");
const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
if (!admin) throw new Error("No local admin.");
for (const { folder, result } of readComponentFolders()) {
  if (!result.ok) { console.log(`${folder}: invalid: ${result.errors.join("; ")}`); continue; }
  const c = result.component;
  const data = {
    title: c.title, summary: c.summary, category: c.category, componentName: c.componentName,
    version: c.version, yaml: c.yaml, guide: c.guide, properties: c.properties, variations: c.variations,
    access: c.access, needsModernControls: c.needsModernControls, status: "PUBLISHED",
    publishedAt: new Date(), testedAt: new Date(), testedStudioVersion: "3.26094.8",
  };
  await prisma.libraryComponent.upsert({ where: { slug: c.slug }, update: data, create: { ...data, slug: c.slug, authorUserId: admin.id } });
}
await prisma.$disconnect();
console.log("published");
