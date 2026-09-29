import { prisma } from "@ppu/db";
import { expect, test } from "@playwright/test";
import { createFixtures } from "../../src/seed.js";

/**
 * Proves the Q36 data policy: cleanup removes only the rows its own worker
 * created, never another worker's rows and never seeded data. This spec drives the
 * fixture module directly (no browser), so it also exercises the database guard.
 */

async function seededSnapshot(): Promise<string> {
  const categories = await prisma.category.findMany({ orderBy: { slug: "asc" } });
  const licences = await prisma.licenseDefinition.findMany({ orderBy: { slug: "asc" } });
  return JSON.stringify({
    categories: categories.map((c) => [
      c.id,
      c.slug,
      c.name,
      c.description,
      c.updatedAt.toISOString(),
    ]),
    licences: licences.map((l) => [l.id, l.slug, l.name, l.updatedAt.toISOString()]),
  });
}

test.describe("fixture cleanup is scoped to the rows its worker created", () => {
  test("removes its own rows, leaves another worker's rows and seeded data untouched", async () => {
    const seededBefore = await seededSnapshot();
    const first = await createFixtures(9001);
    const second = await createFixtures(9002);

    try {
      expect(first.prefix).not.toBe(second.prefix);
      // 6 fixture products per worker: fullProduct, minimalProduct,
      // freeGrantProduct (MVP-010) — isolated from each other so a state
      // that grants a free entitlement can never leak into one that expects
      // none yet — plus draftAdminProduct and publishedAdminProduct
      // (MVP-012), and suspendedAdminProduct (MVP-019), the admin
      // product/release editor's and audit log's own fixtures.
      expect(await prisma.product.count({ where: { slug: { startsWith: first.prefix } } })).toBe(6);
      // 2 fixture users per worker: the ordinary member and the ADMIN fixture
      // (MVP-020) — 3 sessions: currentSession, otherSession (both the
      // member's) and adminSession.
      expect(await prisma.user.count({ where: { email: { startsWith: first.prefix } } })).toBe(2);
      expect(
        await prisma.session.count({ where: { sessionToken: { startsWith: first.prefix } } }),
      ).toBe(3);

      await first.cleanup();

      // Everything the first worker created is gone...
      expect(await prisma.product.count({ where: { slug: { startsWith: first.prefix } } })).toBe(0);
      expect(await prisma.user.count({ where: { email: { startsWith: first.prefix } } })).toBe(0);
      expect(
        await prisma.session.count({ where: { sessionToken: { startsWith: first.prefix } } }),
      ).toBe(0);
      // ...the second worker's rows are untouched...
      expect(await prisma.product.count({ where: { slug: { startsWith: second.prefix } } })).toBe(
        6,
      );
      expect(await prisma.user.count({ where: { email: { startsWith: second.prefix } } })).toBe(2);
      expect(
        await prisma.session.count({ where: { sessionToken: { startsWith: second.prefix } } }),
      ).toBe(3);
      // ...and seeded categories and licence definitions are exactly as they were.
      expect(await seededSnapshot()).toBe(seededBefore);
    } finally {
      await second.cleanup();
    }

    expect(await prisma.product.count({ where: { slug: { startsWith: second.prefix } } })).toBe(0);
    expect(await seededSnapshot()).toBe(seededBefore);
  });

  test("never creates a category: the fixture only references seeded ones", async () => {
    const before = await prisma.category.count();
    const set = await createFixtures(9003);
    try {
      expect(await prisma.category.count()).toBe(before);
      expect(set.populatedCategory.slug).not.toBe(set.emptyCategory.slug);
    } finally {
      await set.cleanup();
    }
    expect(await prisma.category.count()).toBe(before);
  });
});
