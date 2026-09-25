import { randomBytes } from "node:crypto";
import { Prisma, prisma } from "@ppu/db";
import { mintUnsubscribeToken } from "@ppu/domain-notifications";
import { assertSafeDatabaseTarget } from "./db-guard.js";
import { RESERVED_PREFIX, assertReserved, newWorkerPrefix } from "./prefix.js";

/**
 * Temporary rows for the accessibility tests (decision Q36).
 *
 * - Nothing here is marketplace inventory: every name says it is a test fixture,
 *   every identifier starts with the reserved prefix, and everything is deleted
 *   when the worker finishes.
 * - Seeded categories and licence definitions are only ever READ.
 * - Deletion is by the ids this worker created AND the reserved prefix; both must
 *   match, so a seeded or real row can never be removed.
 * - The database guard runs first and throws (the test fails loudly) unless the
 *   target is positively identified as local or CI.
 */

export const SEARCH_TERM = "zzfixture";
export const NO_MATCH_TERM = "zzznomatchzzz";

export interface CategoryRef {
  slug: string;
  name: string;
}

export interface ProductRef {
  slug: string;
  name: string;
}

export interface ArticleRef {
  id: string;
  slug: string;
  title: string;
}

/** MVP-012 (FR-009): admin authoring fixtures need the row id (the editor
 * URL is /admin/products/[id]/edit, not slug-addressed), unlike the public
 * ProductRef above. */
export interface AdminProductRef {
  id: string;
  slug: string;
  name: string;
}

export interface SessionRef {
  id: string;
  token: string;
  createdAt: Date;
}

export interface FixtureSet {
  prefix: string;
  /** A seeded category that also holds this worker's PUBLISHED fixture products. */
  populatedCategory: CategoryRef;
  /** A seeded category with no PUBLISHED products at all. */
  emptyCategory: CategoryRef;
  fullProduct: ProductRef;
  minimalProduct: ProductRef;
  /** Isolated for the free-entitlement flow's own click-through interaction — see createFixtures. */
  freeGrantProduct: ProductRef;
  /** MVP-017 (FR-014): a PUBLISHED Article, visible at /learn/[slug]. */
  publishedArticle: ArticleRef;
  /** MVP-017 (FR-014): a DRAFT Article — visible in the admin list, but /learn/[slug] must 404 for it. */
  draftArticle: ArticleRef;
  /** MVP-012 (FR-009): a bare DRAFT Product (core fields only, no license/
   * support/compatibility/release) — visible in the admin products list,
   * and exercises the "still missing mandatory fields" publish-readiness
   * state on its own edit page. */
  draftAdminProduct: AdminProductRef;
  /** MVP-012 (FR-009): a fully-evidenced, PUBLISHED Product with its
   * selected Release also published (direct product-owner decision, "PR #23
   * blocker corrections" A2) — visible in the admin products list, and
   * exercises the "published release, files immutable" edit-page state. */
  publishedAdminProduct: AdminProductRef;
  user: { id: string; email: string };
  /** The session the browser signs in with. */
  currentSession: SessionRef;
  /** A second session of the same user, which the sessions page lets the user revoke. */
  otherSession: SessionRef;
  /**
   * MVP-020 (FR-004): a second fixture identity with `role: "ADMIN"`, created
   * directly in the database under the reserved prefix — the sanctioned
   * mechanism (docs/final-decisions.md, "MVP-020 open questions 46, 47 and
   * 48", question 48, constraint 3: "Tests that need an admin create one
   * directly in the database... No test-only bypass, no role-elevation
   * helper shipped in application code"). This is test infrastructure, not
   * application code, so this is not that prohibited helper.
   */
  admin: { id: string; email: string };
  /** The session the browser signs in with for admin-surface states. */
  adminSession: SessionRef;
  /**
   * A valid, unexpired unsubscribe token for the main fixture user (MVP-018,
   * FR-013), minted with the same EMAIL_UNSUBSCRIBE_SECRET the running
   * server verifies against (playwright.config.ts mutates process.env so
   * both processes see the identical value). Minting is a pure, synchronous
   * function — computed once here, not a method, since it needs no
   * database access.
   */
  unsubscribeToken: string;
  /** Creates another revocable session (tracked for cleanup). */
  createExtraSession(): Promise<SessionRef>;
  /**
   * Grants this worker's fixture user a free entitlement to the given
   * product (MVP-010, FR-005), for exercising the "already entitled" page
   * state. Idempotent — a repeat call for the same product is a no-op, not
   * an error: the same state runs once per tested width against the same
   * worker-scoped fixture user and product, so a naive create() would throw
   * a real unique-constraint violation on the second width onward (found in
   * CI, not locally, run 1). No separate cleanup call is needed:
   * Entitlement.userId cascades on delete (packages/db/prisma/schema/
   * entitlements.prisma), so removing the fixture user at cleanup() removes
   * this too.
   */
  grantEntitlement(productSlug: string): Promise<void>;
  /**
   * Removes any existing entitlement for this worker's fixture user and the
   * given product (MVP-010), so a state that grants one ITSELF, through a UI
   * interaction rather than this helper, can start from a guaranteed-clean
   * slate on every tested width — otherwise only the first width's run
   * would ever see the "not yet entitled" starting condition, since the
   * fixture user and product persist across every width the same state is
   * tested at (found in CI, not locally, run 1: product-free-granted timed
   * out from the third tested width onward, waiting for a button that could
   * only ever exist before the first width's own grant).
   */
  resetEntitlement(productSlug: string): Promise<void>;
  /**
   * Deletes every ConsentRecord/DeletionRequest(+Event) row for the given
   * user (defaults to the worker's main fixture user) so a state that needs
   * a specific starting condition can establish it deterministically,
   * regardless of what any other state (or another width of the same
   * state) left behind — the same reset-before-prepare pattern
   * resetEntitlement already proved (MVP-010, CI run 1).
   */
  resetPrivacyState(userId?: string): Promise<void>;
  /** Directly creates a DeletionRequest + its initial SUBMITTED event, bypassing the UI/API — fixture setup, not the behavior under test. */
  submitDeletionRequest(userId?: string): Promise<{ id: string }>;
  /** Appends one more DeletionRequestEvent, simulating an admin's (or the requester's) review action without going through the real route. */
  advanceDeletionRequest(
    deletionRequestId: string,
    toState: "UNDER_REVIEW" | "APPROVED" | "DENIED" | "COMPLETED" | "WITHDRAWN",
    actorUserId: string,
    reason?: string,
  ): Promise<void>;
  cleanup(): Promise<void>;
}

const HOUR_MS = 60 * 60 * 1000;

export async function createFixtures(workerIndex: number): Promise<FixtureSet> {
  assertSafeDatabaseTarget();

  const prefix = newWorkerPrefix(workerIndex);
  const created = {
    sessionIds: [] as string[],
    userId: null as string | null,
    adminUserId: null as string | null,
    productIds: [] as string[],
    articleIds: [] as string[],
    fileScanIds: [] as string[],
  };

  const cleanup = async (): Promise<void> => {
    const failures: unknown[] = [];
    const attempt = async (step: () => Promise<unknown>): Promise<void> => {
      try {
        await step();
      } catch (error) {
        failures.push(error);
      }
    };
    const fixtureUserIds = [created.userId, created.adminUserId].filter(
      (id): id is string => id !== null,
    );
    // ConsentRecord/DeletionRequest(+Event) use Restrict FKs on userId
    // (MVP-020, docs/final-decisions.md, "MVP-020 open questions 46, 47 and
    // 48", question 46) — deliberately, so a real user-deletion can never
    // silently destroy this audit trail. That means this cleanup must
    // delete them explicitly, in dependency order, BEFORE the user rows
    // below, or the user deletes would fail exactly the way the schema
    // intends them to when rows still reference them.
    if (fixtureUserIds.length > 0) {
      await attempt(() =>
        prisma.deletionRequestEvent.deleteMany({
          where: { deletionRequest: { userId: { in: fixtureUserIds } } },
        }),
      );
      await attempt(() =>
        prisma.deletionRequest.deleteMany({ where: { userId: { in: fixtureUserIds } } }),
      );
      await attempt(() =>
        prisma.consentRecord.deleteMany({ where: { userId: { in: fixtureUserIds } } }),
      );
    }
    // ArticlePublishEvent/Article use Restrict FKs on actorUserId/
    // authorUserId (MVP-017, docs/final-decisions.md content.prisma header
    // comment) — deleted here, BEFORE the user deleteMany below, for the
    // identical reason the privacy rows above are: the admin user delete
    // would otherwise fail while an Article still references it as author.
    if (created.articleIds.length > 0) {
      await attempt(() =>
        prisma.articlePublishEvent.deleteMany({
          where: { articleId: { in: created.articleIds } },
        }),
      );
    }
    await attempt(() =>
      prisma.article.deleteMany({
        where: { id: { in: created.articleIds }, slug: { startsWith: RESERVED_PREFIX } },
      }),
    );
    // MVP-012: must also run BEFORE user.deleteMany below, for a subtler
    // version of the same reason as Article above. FileScan.uploadedByUserId
    // -> User is onDelete: Cascade (packages/db/prisma/schema/files.prisma),
    // but ReleaseFile -> FileScan is onDelete: Restrict (deliberately: "a
    // scanned file already attached to a release must not be deletable out
    // from under it"). If the fixture admin user were deleted first, its
    // Cascade would try to delete the FileScan rows it uploaded while a
    // ReleaseFile row still references them, and the Restrict FK would
    // block that — a real failure reproduced locally while building this
    // fixture. Deleting Product first cascades away Release and (via
    // Release's own Cascade) ReleaseFile, so by the time FileScan is deleted
    // explicitly below, nothing references it and nothing later blocks the
    // user delete either.
    await attempt(() =>
      prisma.product.deleteMany({
        where: { id: { in: created.productIds }, slug: { startsWith: RESERVED_PREFIX } },
      }),
    );
    if (created.fileScanIds.length > 0) {
      await attempt(() =>
        prisma.fileScan.deleteMany({
          where: { id: { in: created.fileScanIds }, storageKey: { startsWith: RESERVED_PREFIX } },
        }),
      );
    }
    // Every delete is scoped by the ids this worker created AND the reserved prefix.
    await attempt(() =>
      prisma.session.deleteMany({
        where: { id: { in: created.sessionIds }, sessionToken: { startsWith: RESERVED_PREFIX } },
      }),
    );
    if (fixtureUserIds.length > 0) {
      await attempt(() =>
        prisma.user.deleteMany({
          where: { id: { in: fixtureUserIds }, email: { startsWith: RESERVED_PREFIX } },
        }),
      );
    }
    await attempt(() => prisma.$disconnect());
    if (failures.length > 0) {
      throw new AggregateError(failures, `Cleanup of ${prefix} rows failed`);
    }
  };

  try {
    const categories = await prisma.category.findMany({ orderBy: { slug: "asc" } });
    const populated = categories[0];
    if (!populated || categories.length < 2) {
      throw new Error(
        "Expected at least two seeded categories (run the database migrations first). Categories are never created by the harness.",
      );
    }
    let empty: (typeof categories)[number] | undefined;
    for (const candidate of [...categories].reverse()) {
      if (candidate.id === populated.id) continue;
      const published = await prisma.product.count({
        where: { categoryId: candidate.id, status: "PUBLISHED" },
      });
      if (published === 0) {
        empty = candidate;
        break;
      }
    }
    if (!empty) {
      throw new Error(
        "No seeded category without published products is available for the empty-category state; refusing to fabricate one.",
      );
    }

    const licences = await prisma.licenseDefinition.findMany({
      orderBy: { sortOrder: "asc" },
      take: 2,
    });
    if (licences.length < 2)
      throw new Error("Expected seeded licence definitions (run the database migrations first).");

    const summary = `Accessibility test fixture ${SEARCH_TERM}. Created by the E2E harness and deleted after the run; not a real listing.`;
    const now = new Date();

    const fullSlug = `${prefix}full`;
    assertReserved("product", fullSlug);
    const full = await prisma.product.create({
      data: {
        slug: fullSlug,
        name: "E2E fixture: full evidence (not a real listing)",
        summary,
        status: "PUBLISHED",
        publishedAt: now,
        categoryId: populated.id,
        licenses: { create: licences.map((licence) => ({ licenseDefinitionId: licence.id })) },
        releases: { create: { version: "1.0.0", publishedAt: now } },
        supportPolicy: {
          create: { status: "CREATOR_SUPPORTED", channel: "https://example.invalid/support" },
        },
        // Only CREATOR_DECLARED is used: the evidence vocabulary is under revision (TD-008) and a
        // fixture must not assign a status the product owner has reserved.
        compatibility: {
          create: [
            {
              platformArea: "POWER_APPS",
              minReleaseYear: 2025,
              minReleaseWave: 2,
              notes: "Fixture note about a requirement.",
              evidenceStatus: "CREATOR_DECLARED",
            },
            {
              platformArea: "POWER_AUTOMATE",
              minReleaseYear: 2025,
              minReleaseWave: 1,
              evidenceStatus: "CREATOR_DECLARED",
            },
            {
              platformArea: "MICROSOFT_FABRIC",
              minReleaseYear: 2026,
              minReleaseWave: 1,
              notes:
                "A longer fixture note, to exercise wrapping in the notes column of the compatibility table.",
              evidenceStatus: "CREATOR_DECLARED",
            },
          ],
        },
      },
    });
    created.productIds.push(full.id);

    const minimalSlug = `${prefix}minimal`;
    assertReserved("product", minimalSlug);
    const minimal = await prisma.product.create({
      data: {
        slug: minimalSlug,
        name: "E2E fixture: minimal evidence (not a real listing)",
        summary,
        status: "PUBLISHED",
        publishedAt: now,
        categoryId: populated.id,
      },
    });
    created.productIds.push(minimal.id);

    // MVP-010 (FR-005): dedicated to the free-entitlement flow's own
    // click-through interaction, isolated from fullProduct and
    // minimalProduct on purpose. seed is worker-scoped (this same fixture
    // user and its products are reused by every test in the worker), and
    // with fullyParallel: true, tests are not guaranteed to run in
    // declaration order — a state that GRANTS an entitlement (product-free-
    // entitled, product-free-granted) must never be able to leak into one
    // that specifically requires no entitlement exists yet
    // (product-free-idle). Three states need three mutually exclusive
    // entitlement conditions for the same kind of page; sharing a product
    // between any two of them is what caused a real, reproduced local
    // failure before this was added.
    const freeGrantSlug = `${prefix}free-grant`;
    assertReserved("product", freeGrantSlug);
    const freeGrant = await prisma.product.create({
      data: {
        slug: freeGrantSlug,
        name: "E2E fixture: free-entitlement flow (not a real listing)",
        summary,
        status: "PUBLISHED",
        publishedAt: now,
        categoryId: populated.id,
      },
    });
    created.productIds.push(freeGrant.id);

    const email = `${prefix}user@example.invalid`;
    assertReserved("user", email);
    const user = await prisma.user.create({
      data: { email, name: "E2E fixture user", emailVerified: now },
    });
    created.userId = user.id;

    // MVP-020 (FR-004): a second identity with role: "ADMIN", created
    // directly here under the reserved prefix — the sanctioned mechanism
    // for test-only admin access (see the FixtureSet.admin doc comment
    // above). Never created by application code.
    const adminEmail = `${prefix}admin@example.invalid`;
    assertReserved("user", adminEmail);
    const admin = await prisma.user.create({
      data: { email: adminEmail, name: "E2E fixture admin", emailVerified: now, role: "ADMIN" },
    });
    created.adminUserId = admin.id;

    // MVP-017 (FR-014): a PUBLISHED Article (visible at /learn/[slug]) and a
    // DRAFT Article (must 404 there, but visible in the admin content list).
    // Authored by the fixture admin — content-publishing authority reuses
    // ADMIN, no EDITOR role exists (docs/final-decisions.md, "MVP-017
    // implementation: content-publishing authorization reuses ADMIN").
    // Titles carry the worker prefix too, not just the slug: the admin
    // content list is a genuine cross-worker query (like
    // listActiveDeletionRequests), so a literal, non-prefixed title would
    // match more than one worker's fixture article under parallel
    // execution and make getByText(title) ambiguous (found running this
    // locally, before any CI push).
    const publishedArticleSlug = `${prefix}published-article`;
    assertReserved("article", publishedArticleSlug);
    const publishedArticle = await prisma.article.create({
      data: {
        slug: publishedArticleSlug,
        title: `E2E fixture: published article ${prefix}(not real content)`,
        type: "TUTORIAL",
        body: "Fixture body content for the accessibility harness.",
        excerpt: "Fixture excerpt.",
        status: "PUBLISHED",
        publishedAt: now,
        authorUserId: admin.id,
      },
    });
    created.articleIds.push(publishedArticle.id);
    await prisma.articlePublishEvent.create({
      data: { articleId: publishedArticle.id, actorUserId: admin.id, action: "PUBLISHED" },
    });

    const draftArticleSlug = `${prefix}draft-article`;
    assertReserved("article", draftArticleSlug);
    const draftArticle = await prisma.article.create({
      data: {
        slug: draftArticleSlug,
        title: `E2E fixture: draft article ${prefix}(not real content)`,
        type: "PATTERN",
        body: "Fixture draft body content for the accessibility harness.",
        excerpt: null,
        authorUserId: admin.id,
      },
    });
    created.articleIds.push(draftArticle.id);

    // MVP-012 (FR-009): admin product/release editor fixtures. Deliberately
    // built with direct Prisma writes, not through the admin API routes --
    // this is fixture setup for the accessibility harness, not the
    // behavior under test (same rationale as submitDeletionRequest/
    // advanceDeletionRequest below).
    const draftAdminProductSlug = `${prefix}admin-draft-product`;
    assertReserved("product", draftAdminProductSlug);
    const draftAdminProduct = await prisma.product.create({
      data: {
        slug: draftAdminProductSlug,
        name: `E2E fixture: admin draft product ${prefix}(not a real listing)`,
        summary,
        categoryId: populated.id,
      },
    });
    created.productIds.push(draftAdminProduct.id);

    const publishedAdminProductSlug = `${prefix}admin-published-product`;
    assertReserved("product", publishedAdminProductSlug);
    const publishedAdminProduct = await prisma.product.create({
      data: {
        slug: publishedAdminProductSlug,
        name: `E2E fixture: admin published product ${prefix}(not a real listing)`,
        summary,
        categoryId: populated.id,
        licenses: { create: [{ licenseDefinitionId: licences[0]!.id }] },
        supportPolicy: {
          create: { status: "PLATFORM_SUPPORTED", channel: "https://example.invalid/support" },
        },
        compatibility: {
          create: [
            {
              platformArea: "POWER_APPS",
              minReleaseYear: 2025,
              minReleaseWave: 1,
              evidenceStatus: "CREATOR_DECLARED",
            },
          ],
        },
      },
    });
    created.productIds.push(publishedAdminProduct.id);

    const adminReleaseFileStorageKey = `${prefix}admin-release-file`;
    assertReserved("fileScan", adminReleaseFileStorageKey);
    const adminReleaseFileScan = await prisma.fileScan.create({
      data: {
        storageKey: adminReleaseFileStorageKey,
        originalFilename: "fixture-package.zip",
        declaredMimeType: "application/zip",
        sizeBytes: 1024,
        status: "CLEAN",
        uploadedByUserId: admin.id,
      },
    });
    created.fileScanIds.push(adminReleaseFileScan.id);

    await prisma.release.create({
      data: {
        productId: publishedAdminProduct.id,
        version: "1.0.0",
        publishedAt: now,
        files: { create: { fileScanId: adminReleaseFileScan.id } },
      },
    });
    await prisma.product.update({
      where: { id: publishedAdminProduct.id },
      data: { status: "PUBLISHED", publishedAt: now },
    });

    const makeSession = async (
      createdAt: Date,
      forUserId: string = user.id,
    ): Promise<SessionRef> => {
      const token = `${prefix}${randomBytes(24).toString("hex")}`;
      assertReserved("session token", token);
      const session = await prisma.session.create({
        data: {
          sessionToken: token,
          userId: forUserId,
          expires: new Date(Date.now() + 24 * HOUR_MS),
          createdAt,
        },
      });
      created.sessionIds.push(session.id);
      return { id: session.id, token, createdAt };
    };

    const currentSession = await makeSession(now);
    // Distinct creation times give distinct "Session started ..." labels on the page.
    const otherSession = await makeSession(new Date(now.getTime() - 90 * 60 * 1000));
    const adminSession = await makeSession(now, admin.id);
    let extras = 0;

    const unsubscribeSecret = process.env["EMAIL_UNSUBSCRIBE_SECRET"];
    if (!unsubscribeSecret) {
      throw new Error(
        "EMAIL_UNSUBSCRIBE_SECRET is not set — playwright.config.ts must set it before the seed fixture is created.",
      );
    }
    const unsubscribeToken = mintUnsubscribeToken(user.id, unsubscribeSecret);

    return {
      prefix,
      populatedCategory: { slug: populated.slug, name: populated.name },
      emptyCategory: { slug: empty.slug, name: empty.name },
      fullProduct: { slug: full.slug, name: full.name },
      minimalProduct: { slug: minimal.slug, name: minimal.name },
      freeGrantProduct: { slug: freeGrant.slug, name: freeGrant.name },
      publishedArticle: {
        id: publishedArticle.id,
        slug: publishedArticle.slug,
        title: publishedArticle.title,
      },
      draftArticle: { id: draftArticle.id, slug: draftArticle.slug, title: draftArticle.title },
      draftAdminProduct: {
        id: draftAdminProduct.id,
        slug: draftAdminProduct.slug,
        name: draftAdminProduct.name,
      },
      publishedAdminProduct: {
        id: publishedAdminProduct.id,
        slug: publishedAdminProduct.slug,
        name: publishedAdminProduct.name,
      },
      user: { id: user.id, email },
      currentSession,
      otherSession,
      admin: { id: admin.id, email: adminEmail },
      adminSession,
      unsubscribeToken,
      createExtraSession: () => makeSession(new Date(now.getTime() - (3 + extras++) * HOUR_MS)),
      grantEntitlement: async (productSlug: string) => {
        const product = await prisma.product.findUniqueOrThrow({ where: { slug: productSlug } });
        try {
          await prisma.entitlement.create({
            data: { userId: user.id, productId: product.id, source: "FREE_POLICY" },
          });
        } catch (error) {
          const alreadyGranted =
            error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
          if (!alreadyGranted) throw error;
        }
      },
      resetEntitlement: async (productSlug: string) => {
        const product = await prisma.product.findUniqueOrThrow({ where: { slug: productSlug } });
        await prisma.entitlement.deleteMany({ where: { userId: user.id, productId: product.id } });
      },
      resetPrivacyState: async (userId: string = user.id) => {
        await prisma.deletionRequestEvent.deleteMany({
          where: { deletionRequest: { userId } },
        });
        await prisma.deletionRequest.deleteMany({ where: { userId } });
        await prisma.consentRecord.deleteMany({ where: { userId } });
      },
      submitDeletionRequest: async (userId: string = user.id) => {
        const request = await prisma.deletionRequest.create({ data: { userId } });
        await prisma.deletionRequestEvent.create({
          data: { deletionRequestId: request.id, toState: "SUBMITTED", actorUserId: userId },
        });
        return { id: request.id };
      },
      advanceDeletionRequest: async (deletionRequestId, toState, actorUserId, reason) => {
        await prisma.deletionRequestEvent.create({
          data: { deletionRequestId, toState, actorUserId, reason: reason ?? null },
        });
      },
      cleanup,
    };
  } catch (error) {
    await cleanup().catch(() => undefined);
    throw error;
  }
}
