import type { ComponentCreateInput } from "@ppu/domain-content";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaComponentRepository } from "./component-repository.js";

/** Runs only against a real, migrated Postgres (see content-repository.integration.test.ts). */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaComponentRepository (integration, MVP-049)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaComponentRepository;
  const createdUserIds: string[] = [];
  const createdComponentIds: string[] = [];

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaComponentRepository(db);
  });

  afterAll(async () => {
    await db.componentEvent.deleteMany({ where: { componentId: { in: createdComponentIds } } });
    await db.libraryComponent.deleteMany({ where: { id: { in: createdComponentIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  async function admin(email: string) {
    const user = await db.user.create({ data: { email, role: "ADMIN" } });
    createdUserIds.push(user.id);
    return user;
  }

  const input = (slug: string, authorUserId: string, yaml = "ComponentDefinitions: {}\n"): ComponentCreateInput => ({
    slug,
    title: `Component ${slug}`,
    componentName: "lcsThing",
    category: "buttons-and-actions",
    summary: "A component used by the repository integration test.",
    access: "OPEN",
    version: "1.0.0",
    needsModernControls: true,
    guide: "## Use it\n\nText.",
    yaml,
    properties: [
      { name: "Label", kind: "Input", dataType: "Text", description: "The label.", defaultValue: '"Hi"', parameters: [] },
    ],
    variations: [{ name: "Plain", description: "No changes.", settings: {} }],
    authorUserId,
  });

  async function create(slug: string, authorUserId: string) {
    const created = await repo.create(input(slug, authorUserId));
    createdComponentIds.push(created.id);
    return created;
  }

  it("creates a hidden-from-the-site draft and round-trips its properties", async () => {
    const user = await admin("component-repo-create@example.test");
    const created = await create("component-repo-create", user.id);
    expect(created.status).toBe("DRAFT");
    expect(created.properties[0]?.name).toBe("Label");
    expect(created.variations[0]?.name).toBe("Plain");
    expect(await repo.findPublicBySlug("component-repo-create")).toBeNull();
  });

  it("publishes only a tested draft, and records each step", async () => {
    const user = await admin("component-repo-publish@example.test");
    const created = await create("component-repo-publish", user.id);
    await expect(repo.publish(created.id, user.id)).rejects.toThrow(/tested/);

    const tested = await repo.markTested(created.id, "3.26093.12", user.id);
    expect(tested.testedStudioVersion).toBe("3.26093.12");
    const published = await repo.publish(created.id, user.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();
    expect((await repo.findPublicBySlug("component-repo-publish"))?.id).toBe(created.id);

    const events = await db.componentEvent.findMany({
      where: { componentId: created.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((event) => event.action)).toEqual(["TESTED", "PUBLISHED"]);
  });

  it("clears the test record when a draft's YAML changes, and keeps it when it doesn't", async () => {
    const user = await admin("component-repo-replace@example.test");
    const created = await create("component-repo-replace", user.id);
    await repo.markTested(created.id, "3.1", user.id);

    const sameYaml = await repo.replaceDraft(created.id, { ...input("component-repo-replace", user.id), title: "Renamed" });
    expect(sameYaml.title).toBe("Renamed");
    expect(sameYaml.testedAt).not.toBeNull();

    const newYaml = await repo.replaceDraft(
      created.id,
      input("component-repo-replace", user.id, "ComponentDefinitions: { changed: true }\n"),
    );
    expect(newYaml.testedAt).toBeNull();
    expect(newYaml.testedStudioVersion).toBeNull();
  });

  it("hides a published component from the site and logs only real changes", async () => {
    const user = await admin("component-repo-settings@example.test");
    const created = await create("component-repo-settings", user.id);
    await repo.markTested(created.id, "3.1", user.id);
    await repo.publish(created.id, user.id);

    await repo.updateSettings(created.id, { hidden: true, access: "MEMBERS" }, user.id);
    expect(await repo.findPublicBySlug("component-repo-settings")).toBeNull();
    await repo.updateSettings(created.id, { hidden: true }, user.id);

    const changes = await db.componentEvent.findMany({
      where: { componentId: created.id, action: "SETTINGS_CHANGED" },
    });
    expect(changes).toHaveLength(1);
    expect(changes[0]?.detail).toEqual({
      access: { from: "OPEN", to: "MEMBERS" },
      hidden: { from: false, to: true },
    });
    await expect(repo.replaceDraft(created.id, input("component-repo-settings", user.id))).rejects.toThrow(/draft/);
  });
  it("shows a Coming soon draft as a teaser only, never its YAML, and not once hidden or published", async () => {
    const user = await admin("component-repo-soon@example.test");
    const created = await create("component-repo-soon", user.id);
    expect(await repo.findComingSoonBySlug("component-repo-soon")).toBeNull();

    await repo.updateSettings(created.id, { comingSoon: true }, user.id);
    const teaser = await repo.findComingSoonBySlug("component-repo-soon");
    expect(teaser).toEqual({
      id: created.id,
      slug: "component-repo-soon",
      title: "Component component-repo-soon",
      summary: created.summary,
      category: "buttons-and-actions",
      componentName: "lcsThing",
      access: "OPEN",
    });
    expect(teaser).not.toHaveProperty("yaml");
    expect((await repo.listComingSoon()).map((t) => t.slug)).toContain("component-repo-soon");
    // Still not a public component: nothing to copy.
    expect(await repo.findPublicBySlug("component-repo-soon")).toBeNull();

    await repo.updateSettings(created.id, { hidden: true }, user.id);
    expect(await repo.findComingSoonBySlug("component-repo-soon")).toBeNull();
    await repo.updateSettings(created.id, { hidden: false }, user.id);

    await repo.markTested(created.id, "3.1", user.id);
    await repo.publish(created.id, user.id);
    expect(await repo.findComingSoonBySlug("component-repo-soon")).toBeNull();
    expect(await repo.findPublicBySlug("component-repo-soon")).not.toBeNull();

    const changes = await db.componentEvent.findMany({
      where: { componentId: created.id, action: "SETTINGS_CHANGED" },
      orderBy: { createdAt: "asc" },
    });
    expect(changes[0]?.detail).toEqual({ comingSoon: { from: false, to: true } });
  });
});
