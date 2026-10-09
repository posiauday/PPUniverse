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
    await db.articleScheduleEvent.deleteMany({ where: { articleId: { in: createdArticleIds } } });
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
      technology: null,
      topic: null,
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
      technology: null,
      topic: null,
      body: "Original body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);

    const updated = await repo.updateArticle(created.id, {
      slug: "content-repo-update-slug",
      title: "Updated title",
      type: "COMPARISON",
      technology: null,
      topic: null,
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
      technology: null,
      topic: null,
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
      technology: null,
      topic: null,
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

  async function draft(slug: string, authorUserId: string) {
    const created = await repo.createArticle({
      slug,
      title: `Title ${slug}`,
      type: "TUTORIAL",
      technology: null,
      topic: null,
      body: "Body.",
      excerpt: null,
      authorUserId,
    });
    createdArticleIds.push(created.id);
    return created;
  }

  it("schedules, reschedules and cancels a draft, recording each change (MVP-050)", async () => {
    const author = await createTestUser("content-repo-schedule@example.test");
    const created = await draft("content-repo-schedule-slug", author.id);
    const first = new Date("2030-01-02T15:00:00.000Z");
    const second = new Date("2030-01-03T09:30:00.000Z");

    expect((await repo.scheduleArticle(created.id, first, author.id)).scheduledFor).toEqual(first);
    const moved = await repo.scheduleArticle(created.id, second, author.id);
    expect(moved).toMatchObject({ status: "DRAFT", scheduledFor: second, publishedAt: null });

    const cancelled = await repo.cancelArticleSchedule(created.id, author.id);
    expect(cancelled.scheduledFor).toBeNull();
    await expect(repo.cancelArticleSchedule(created.id, author.id)).rejects.toThrow();

    const events = await db.articleScheduleEvent.findMany({
      where: { articleId: created.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((event) => [event.action, event.scheduledFor])).toEqual([
      ["SCHEDULED", first],
      ["SCHEDULED", second],
      ["CANCELLED", null],
    ]);
  });

  it("never schedules a published article, and publishing by hand clears a schedule (MVP-050)", async () => {
    const author = await createTestUser("content-repo-schedule-published@example.test");
    const created = await draft("content-repo-schedule-published-slug", author.id);
    await repo.scheduleArticle(created.id, new Date("2030-01-02T15:00:00.000Z"), author.id);

    const published = await repo.publishArticle(created.id, author.id);
    expect(published.scheduledFor).toBeNull();
    await expect(
      repo.scheduleArticle(created.id, new Date("2030-02-02T15:00:00.000Z"), author.id),
    ).rejects.toThrow();
  });

  it("publishDueArticles publishes due drafts once, at their time, by the admin who scheduled them (MVP-050)", async () => {
    const author = await createTestUser("content-repo-due-author@example.test");
    const scheduler = await createTestUser("content-repo-due-scheduler@example.test");
    const due = await draft("content-repo-due-slug", author.id);
    const later = await draft("content-repo-not-due-slug", author.id);
    const dueAt = new Date("2026-01-05T08:00:00.000Z");
    const now = new Date("2026-01-05T08:00:30.000Z");
    await repo.scheduleArticle(due.id, dueAt, scheduler.id);
    await repo.scheduleArticle(later.id, new Date("2026-01-05T08:01:00.000Z"), scheduler.id);

    // Two visits at once: only one of them publishes it.
    const [a, b] = await Promise.all([repo.publishDueArticles(now), repo.publishDueArticles(now)]);
    const published = [...a, ...b].filter((article) => article.id === due.id);
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      status: "PUBLISHED",
      publishedAt: dueAt,
      scheduledFor: null,
    });

    const events = await db.articlePublishEvent.findMany({ where: { articleId: due.id } });
    expect(events).toHaveLength(1);
    expect(events[0]?.actorUserId).toBe(scheduler.id);

    expect(await repo.findArticleById(later.id)).toMatchObject({ status: "DRAFT" });
    expect(await repo.publishDueArticles(now)).toEqual([]);
  });

  it("findPublishedArticleBySlug returns null for a DRAFT article", async () => {
    const author = await createTestUser("content-repo-draft-hidden@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-draft-hidden-slug",
      title: "Still a draft",
      type: "PATTERN",
      technology: null,
      topic: null,
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
      technology: null,
      topic: null,
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(draft.id);
    const toPublish = await repo.createArticle({
      slug: "content-repo-list-published-slug",
      title: "Published listing",
      type: "TUTORIAL",
      technology: null,
      topic: null,
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
    const sitemapSlugs = sitemap.entries.map((entry) => entry.slug);
    expect(sitemapSlugs).toContain(toPublish.slug);
    expect(sitemapSlugs).not.toContain(draft.slug);
    const entry = sitemap.entries.find((e) => e.slug === toPublish.slug);
    expect(entry?.updatedAt).toBeInstanceOf(Date);

    const summaries = await repo.listPublishedArticleSummaries({ limit: 1000 });
    const summarySlugs = summaries.map((summary) => summary.slug);
    expect(summarySlugs).toContain(toPublish.slug);
    expect(summarySlugs).not.toContain(draft.slug);
    expect(summaries.find((a) => a.slug === toPublish.slug)).not.toHaveProperty("body");

    const excluding = await repo.listPublishedArticleSummaries({
      limit: 1000,
      excludeSlug: toPublish.slug,
    });
    expect(excluding.map((a) => a.slug)).not.toContain(toPublish.slug);
  });

  it("stores an article's technology section, and changes or clears it on update (MVP-028)", async () => {
    const author = await createTestUser("content-repo-tech@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-tech-slug",
      title: "Technology",
      type: "KPI_GUIDE",
      technology: "POWER_BI",
      topic: null,
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);
    expect(created.type).toBe("KPI_GUIDE");
    expect(created.technology).toBe("POWER_BI");
    const moved = await repo.updateArticle(created.id, {
      slug: created.slug,
      title: created.title,
      type: "KPI_GUIDE",
      technology: "POWER_APPS",
      topic: null,
      body: created.body,
      excerpt: null,
    });
    expect(moved.technology).toBe("POWER_APPS");
    const cleared = await repo.updateArticle(created.id, {
      slug: created.slug,
      title: created.title,
      type: "KPI_GUIDE",
      technology: null,
      topic: null,
      body: created.body,
      excerpt: null,
    });
    expect(cleared.technology).toBeNull();
  });

  it("filters published summaries by technology and by several types (MVP-028)", async () => {
    const author = await createTestUser("content-repo-techfilter@example.test");
    const make = async (
      slug: string,
      type: "TUTORIAL" | "PATTERN" | "KPI_GUIDE",
      technology: "POWER_APPS" | "POWER_BI" | null,
    ) => {
      const article = await repo.createArticle({
        slug,
        title: slug,
        type,
        technology,
        // MVP-033: a topic round-trips to the summaries.
        topic: technology === "POWER_APPS" ? "choose-and-plan" : null,
        body: "Body.",
        excerpt: null,
        authorUserId: author.id,
      });
      createdArticleIds.push(article.id);
      await repo.publishArticle(article.id, author.id);
    };
    await make("content-repo-tf-apps-tutorial", "TUTORIAL", "POWER_APPS");
    await make("content-repo-tf-apps-pattern", "PATTERN", "POWER_APPS");
    await make("content-repo-tf-bi-kpi", "KPI_GUIDE", "POWER_BI");
    await make("content-repo-tf-none", "TUTORIAL", null);

    const apps = await repo.listPublishedArticleSummaries({ limit: 50, technology: "POWER_APPS" });
    const appSlugs = apps.map((a) => a.slug).filter((slug) => slug.startsWith("content-repo-tf-"));
    expect(appSlugs.sort()).toEqual([
      "content-repo-tf-apps-pattern",
      "content-repo-tf-apps-tutorial",
    ]);
    expect(apps.every((a) => a.technology === "POWER_APPS")).toBe(true);
    expect(apps.filter((a) => a.slug.startsWith("content-repo-tf-")).map((a) => a.topic)).toEqual([
      "choose-and-plan",
      "choose-and-plan",
    ]);

    const learnTab = await repo.listPublishedArticleSummaries({
      limit: 50,
      technology: "POWER_APPS",
      types: ["TUTORIAL", "COMPARISON"],
    });
    expect(
      learnTab.map((a) => a.slug).filter((slug) => slug.startsWith("content-repo-tf-")),
    ).toEqual(["content-repo-tf-apps-tutorial"]);

    const kpis = await repo.listPublishedArticleSummaries({
      limit: 50,
      technology: "POWER_BI",
      types: ["KPI_GUIDE"],
    });
    expect(kpis.map((a) => a.slug).filter((slug) => slug.startsWith("content-repo-tf-"))).toEqual([
      "content-repo-tf-bi-kpi",
    ]);
  });

  it("searchPublishedArticles finds PUBLISHED articles only, title matches first (MVP-031)", async () => {
    const author = await createTestUser("content-repo-search@example.test");
    const make = async (slug: string, title: string, body: string, publish: boolean) => {
      const article = await repo.createArticle({
        slug,
        title,
        type: "TUTORIAL",
        technology: "POWER_APPS",
        topic: null,
        body,
        excerpt: null,
        authorUserId: author.id,
      });
      createdArticleIds.push(article.id);
      if (publish) await repo.publishArticle(article.id, author.id);
    };
    await make("content-repo-search-title", "Zyxquark galleries explained", "Body.", true);
    await make(
      "content-repo-search-body",
      "Another guide",
      "This mentions **zyxquark** once, see [the docs](https://example.test/a).",
      true,
    );
    await make("content-repo-search-draft", "Zyxquark draft", "Zyxquark zyxquark.", false);

    const hits = await repo.searchPublishedArticles({ query: "zyxquark", limit: 10 });
    expect(hits.map((hit) => hit.slug)).toEqual([
      "content-repo-search-title",
      "content-repo-search-body",
    ]);
    expect(hits[0]?.technology).toBe("POWER_APPS");
    expect(hits[0]?.type).toBe("TUTORIAL");
    const start = String.fromCharCode(1);
    const end = String.fromCharCode(2);
    expect(hits[0]?.titleMarked).toBe(`${start}Zyxquark${end} galleries explained`);
    expect(hits[1]?.snippetMarked).toContain(`${start}zyxquark${end}`);
    // Markdown emphasis, link brackets and link targets are stripped.
    for (const leftover of ["*", "[", "]", "https:"]) {
      expect(hits[1]?.snippetMarked).not.toContain(leftover);
    }

    // A hub's search box (MVP-037): only that area's guides.
    const apps = await repo.searchPublishedArticles({
      query: "zyxquark",
      limit: 10,
      technology: "POWER_APPS",
    });
    expect(apps.map((hit) => hit.slug)).toEqual([
      "content-repo-search-title",
      "content-repo-search-body",
    ]);
    expect(
      await repo.searchPublishedArticles({ query: "zyxquark", limit: 10, technology: "POWER_BI" }),
    ).toEqual([]);

    expect(await repo.searchPublishedArticles({ query: "   ", limit: 10 })).toEqual([]);
    // Unbalanced quotes and operators are accepted, never a syntax error.
    await expect(
      repo.searchPublishedArticles({ query: '"zyxquark -or (', limit: 10 }),
    ).resolves.toBeInstanceOf(Array);
  });

  it("an authorUserId cannot be hard-deleted while an Article references it (Restrict FK)", async () => {
    const author = await createTestUser("content-repo-restrict@example.test");
    const created = await repo.createArticle({
      slug: "content-repo-restrict-slug",
      title: "Restrict check",
      type: "TUTORIAL",
      technology: null,
      topic: null,
      body: "Body.",
      excerpt: null,
      authorUserId: author.id,
    });
    createdArticleIds.push(created.id);

    await expect(db.user.delete({ where: { id: author.id } })).rejects.toThrow();
  });
});
