import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaContentRepository } from "./content-repository.js";

/**
 * Runs only when DATABASE_URL points at a real, migrated Postgres database
 * (packages/db/prisma/schema), matching @ppu/adapter-privacy's own
 * integration-test pattern exactly.
 */
const hasDatabase = Boolean(process.env["DATABASE_URL"]);

describe.skipIf(!hasDatabase)("PrismaContentRepository (integration)", () => {
  let db: import("@ppu/db").PrismaClient;
  let repo: PrismaContentRepository;
  const createdUserIds: string[] = [];
  const createdArticleIds: string[] = [];

  beforeAll(async () => {
    const { prisma } = await import("@ppu/db");
    db = prisma;
    repo = new PrismaContentRepository(db);
  });

  afterAll(async () => {
    // Children first — ArticlePublishEvent/Article use Restrict FKs on
    // authorUserId/actorUserId, so the user row cannot be deleted while
    // either still references it.
    await db.articlePublishEvent.deleteMany({
      where: { article: { id: { in: createdArticleIds } } },
    });
    await db.article.deleteMany({ where: { id: { in: createdArticleIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  async function createTestUser(email: string) {
    const user = await db.user.create({ data: { email, role: "ADMIN" } });
    createdUserIds.push(user.id);
    return user;
  }

  it("createArticle always starts as DRAFT with publishedAt null", async () => {
    const author = await createTestUser("content-repo-create@example.test");

    const article = await repo.createArticle({
      slug: "content-repo-create-slug",
      title: "A tutorial",
      type: "TUTORIAL",
      body: "# Heading\n\nBody text.",
      excerpt: "An excerpt.",
      authorUserId: author.id,
    });
    createdArticleIds.push(article.id);

    expect(article.status).toBe("DRAFT");
    expect(article.publishedAt).toBeNull();
    expect(article.authorUserId).toBe(author.id);
  });

  it("updateArticle changes content fields but never status or publishedAt", async () => {
    const author = await createTestUser("content-repo-update@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-update-slug",
      title: "Original title",
      type: "PATTERN",
      body: "Original body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);

    const updated = await repo.updateArticle(created.id, {
      slug: "content-repo-update-slug",
      title: "Updated title",
      type: "COMPARISON",
      body: "Updated body.",
      excerpt: "Now has an excerpt.",
    });

    expect(updated.title).toBe("Updated title");
    expect(updated.type).toBe("COMPARISON");
    expect(updated.body).toBe("Updated body.");
    expect(updated.excerpt).toBe("Now has an excerpt.");
    expect(updated.status).toBe("DRAFT");
    expect(updated.publishedAt).toBeNull();
  });

  it("publishArticle sets PUBLISHED, stamps publishedAt, and appends exactly one PUBLISHED event", async () => {
    const author = await createTestUser("content-repo-publish@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-publish-slug",
      title: "Publish me",
      type: "TUTORIAL",
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);

    const published = await repo.publishArticle(created.id, author.id);

    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();

    const events = await db.articlePublishEvent.findMany({ where: { articleId: created.id } });
    expect(events).toHaveLength(1);
    expect(events[0]?.action).toBe("PUBLISHED");
    expect(events[0]?.actorUserId).toBe(author.id);
  });

  it("publishArticle rejects an already-PUBLISHED article (no double-publish)", async () => {
    const author = await createTestUser("content-repo-double-publish@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-double-publish-slug",
      title: "Publish twice?",
      type: "TUTORIAL",
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);

    await repo.publishArticle(created.id, author.id);
    await expect(repo.publishArticle(created.id, author.id)).rejects.toThrow();

    const events = await db.articlePublishEvent.findMany({ where: { articleId: created.id } });
    expect(events).toHaveLength(1);
  });

  it("findPublishedArticleBySlug returns null for a DRAFT article", async () => {
    const author = await createTestUser("content-repo-draft-hidden@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-draft-hidden-slug",
      title: "Still a draft",
      type: "PATTERN",
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);

    expect(await repo.findPublishedArticleBySlug(created.slug)).toBeNull();
    expect(await repo.findArticleBySlug(created.slug)).not.toBeNull();

    const publishedFetch = await repo.publishArticle(created.id, author.id);
    expect(publishedFetch.status).toBe("PUBLISHED");
    const nowVisible = await repo.findPublishedArticleBySlug(created.slug);
    expect(nowVisible?.id).toBe(created.id);
  });

  it("listArticles returns every status, listPublishedArticleSlugs only PUBLISHED", async () => {
    const author = await createTestUser("content-repo-list@example.test");
    const draft = await repo.createArticle({
      slug: "content-repo-list-draft-slug",
      title: "Draft listing",
      type: "TUTORIAL",
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(draft.id);
    const toPublish = await repo.createArticle({
      slug: "content-repo-list-published-slug",
      title: "Published listing",
      type: "TUTORIAL",
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(toPublish.id);
    await repo.publishArticle(toPublish.id, author.id);

    const all = await repo.listArticles();
    const allIds = all.map((article) => article.id);
    expect(allIds).toContain(draft.id);
    expect(allIds).toContain(toPublish.id);

    const sitemap = await repo.listPublishedArticleSlugs(1000);
    expect(sitemap.slugs).toContain(toPublish.slug);
    expect(sitemap.slugs).not.toContain(draft.slug);
  });

  it("an authorUserId cannot be hard-deleted while an Article references it (Restrict FK)", async () => {
    const author = await createTestUser("content-repo-restrict@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-restrict-slug",
      title: "Restrict check",
      type: "TUTORIAL",
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);

    await expect(db.user.delete({ where: { id: author.id } })).rejects.toThrow();
  });
});
