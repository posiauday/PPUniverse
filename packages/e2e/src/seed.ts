import { randomBytes } from "node:crypto";
import { Prisma, prisma } from "@ppu/db";
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
  user: { id: string; email: string };
  /** The session the browser signs in with. */
  currentSession: SessionRef;
  /** A second session of the same user, which the sessions page lets the user revoke. */
  otherSession: SessionRef;
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
  cleanup(): Promise<void>;
}

const HOUR_MS = 60 * 60 * 1000;

export async function createFixtures(workerIndex: number): Promise<FixtureSet> {
  assertSafeDatabaseTarget();

  const prefix = newWorkerPrefix(workerIndex);
  const created = {
    sessionIds: [] as string[],
    userId: null as string | null,
    productIds: [] as string[],
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
    // Every delete is scoped by the ids this worker created AND the reserved prefix.
    await attempt(() =>
      prisma.session.deleteMany({
        where: { id: { in: created.sessionIds }, sessionToken: { startsWith: RESERVED_PREFIX } },
      }),
    );
    if (created.userId) {
      const userId = created.userId;
      await attempt(() =>
        prisma.user.deleteMany({ where: { id: userId, email: { startsWith: RESERVED_PREFIX } } }),
      );
    }
    await attempt(() =>
      prisma.product.deleteMany({
        where: { id: { in: created.productIds }, slug: { startsWith: RESERVED_PREFIX } },
      }),
    );
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

    const makeSession = async (createdAt: Date): Promise<SessionRef> => {
      const token = `${prefix}${randomBytes(24).toString("hex")}`;
      assertReserved("session token", token);
      const session = await prisma.session.create({
        data: {
          sessionToken: token,
          userId: user.id,
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
    let extras = 0;

    return {
      prefix,
      populatedCategory: { slug: populated.slug, name: populated.name },
      emptyCategory: { slug: empty.slug, name: empty.name },
      fullProduct: { slug: full.slug, name: full.name },
      minimalProduct: { slug: minimal.slug, name: minimal.name },
      freeGrantProduct: { slug: freeGrant.slug, name: freeGrant.name },
      user: { id: user.id, email },
      currentSession,
      otherSession,
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
      cleanup,
    };
  } catch (error) {
    await cleanup().catch(() => undefined);
    throw error;
  }
}
