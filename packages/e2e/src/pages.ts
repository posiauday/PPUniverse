import { expect, type Page } from "@playwright/test";
import { interceptSignInSend } from "./auth-intercept.js";
import { type GatedRoute } from "./page-routes.js";
import { NO_MATCH_TERM, SEARCH_TERM, type FixtureSet } from "./seed.js";
import {
  installClickEventTracer,
  recordSignInClickDiagnostics,
  snapshotButtonNode,
  type ButtonSnapshot,
  type ClickEventLogEntry,
  type RootContainerInfo,
} from "./signin-click-diagnostics.js";

/**
 * The page inventory for the accessibility gate: every state of every implemented
 * page that the suite scans (decision Q40 and the story scope). Verified against the
 * repository, not assumed: src/route-coverage.test.ts fails if a page route exists in
 * apps/web/app that is neither gated here nor deliberately excluded.
 *
 * What is NOT in it, on purpose:
 * - /api/*, robots.txt and sitemap.xml: route handlers and metadata files, not pages.
 * - next-auth's built-in pages under /api/auth (error, verify-request): framework-
 *   rendered, not part of this app's own pages. Listed as not verified.
 * - /account: it is not a page (only /account/sessions is). It is covered as a 404.
 *   If /account becomes a real page, that story must add it here.
 */

export interface GatedPage {
  /** Stable id used in test titles and reports. */
  id: string;
  /** The Next.js route pattern this state renders, or null when it is a 404 response. */
  route: GatedRoute | null;
  description: string;
  auth: "guest" | "member";
  status: number;
  path: (seed: FixtureSet) => string;
  /** Drives the page into the state (interaction, network interception) after navigation. */
  prepare?: (page: Page, seed: FixtureSet) => Promise<void>;
}

const SEND_LINK = /send sign-in link/i;
const VALID_EMAIL = "e2e-a11y@example.invalid";

/**
 * Submits the sign-in form. Also gathers click-diagnostics evidence (decisions,
 * 2026-09-21: "Run 7 failure / sign-in submit signature", then "Run 8 disposition") for
 * the two CI failures observed on this exact interaction (run 4 signin-sent, run 7
 * signin-send-failed, both Firefox, both 320px): whether the click reaches the button
 * (hit test), whether it was hydrated, whether the browser's own click/submit events
 * fire at document AND at React's own root, and — because §fill()§'s re-render is a
 * specific, unproven candidate cause — whether the button is still the SAME node,
 * still connected, and still laid out the same way immediately before the click as it
 * was right after the locator resolved. Recorded on §window§ for §failure-evidence.ts§
 * to attach ONLY if the test ends up failing; adds a few fast, synchronous-in-page
 * evaluate calls regardless (unavoidable, since whether the test will fail is not known
 * in advance).
 */
async function submitSignIn(
  page: Page,
  email: string,
  interceptionRegisteredAtMs: number | null = null,
): Promise<void> {
  await page.evaluate(installClickEventTracer);
  const rootContainer = await page.evaluate(
    () => (window as unknown as { __e2eRootInfo?: RootContainerInfo }).__e2eRootInfo ?? { found: false, description: null },
  );

  const button = page.getByRole("button", { name: SEND_LINK });
  const atResolution = await button.evaluate(snapshotButtonNode).catch((): ButtonSnapshot | null => null);

  if (email) await page.getByLabel("Email address").fill(email);

  // Snapshotted AGAIN, after fill() — the specific re-render under suspicion — and
  // immediately before the click, not reused from before it. Its own hit test uses this
  // exact element reference, so the snapshot and the hit test can never disagree about
  // which node they mean.
  const atDispatch = await button.evaluate(snapshotButtonNode).catch((): ButtonSnapshot | null => null);

  const clickIssuedAtMs = Date.now();
  await button.click();

  const events = await page.evaluate(() => {
    const w = window as unknown as {
      __e2eClickEvents?: ClickEventLogEntry[];
      __e2eRootClickEvents?: ClickEventLogEntry[];
    };
    return { document: w.__e2eClickEvents ?? [], root: w.__e2eRootClickEvents ?? null };
  });

  const nodeReplacedBetweenResolutionAndDispatch =
    atResolution && atDispatch ? atResolution.nodeId !== atDispatch.nodeId : null;
  const rectDelta =
    atResolution && atDispatch
      ? {
          dx: atDispatch.rect.x - atResolution.rect.x,
          dy: atDispatch.rect.y - atResolution.rect.y,
          dwidth: atDispatch.rect.width - atResolution.rect.width,
          dheight: atDispatch.rect.height - atResolution.rect.height,
        }
      : null;

  await page.evaluate(recordSignInClickDiagnostics, {
    interceptionRegisteredAtMs,
    clickIssuedAtMs,
    rootContainer,
    atResolution,
    atDispatch,
    nodeReplacedBetweenResolutionAndDispatch,
    rectDelta,
    events,
  });
}

export const GATED_PAGES: readonly GatedPage[] = [
  {
    id: "home",
    route: "/",
    description: "home page",
    auth: "guest",
    status: 200,
    path: () => "/",
  },
  {
    id: "category-populated",
    route: "/categories/[slug]",
    description: "category listing with products",
    auth: "guest",
    status: 200,
    path: (seed) => `/categories/${seed.populatedCategory.slug}`,
  },
  {
    id: "category-empty",
    route: "/categories/[slug]",
    description: "category listing with no published products",
    auth: "guest",
    status: 200,
    path: (seed) => `/categories/${seed.emptyCategory.slug}`,
  },
  {
    id: "product-full",
    route: "/products/[slug]",
    description: "product page with license, version, support and compatibility evidence",
    auth: "guest",
    status: 200,
    path: (seed) => `/products/${seed.fullProduct.slug}`,
  },
  {
    id: "product-minimal",
    route: "/products/[slug]",
    description: "product page with none of that evidence provided",
    auth: "guest",
    status: 200,
    path: (seed) => `/products/${seed.minimalProduct.slug}`,
  },
  {
    id: "search-no-query",
    route: "/search",
    description: "search with no query",
    auth: "guest",
    status: 200,
    path: () => "/search",
  },
  {
    id: "search-results",
    route: "/search",
    description: "search with results",
    auth: "guest",
    status: 200,
    path: () => `/search?q=${SEARCH_TERM}`,
  },
  {
    id: "search-no-results",
    route: "/search",
    description: "search with no results",
    auth: "guest",
    status: 200,
    path: () => `/search?q=${NO_MATCH_TERM}`,
  },
  {
    id: "signin-idle",
    route: "/signin",
    description: "sign-in form, untouched",
    auth: "guest",
    status: 200,
    path: () => "/signin",
  },
  {
    id: "signin-validation-error",
    route: "/signin",
    description: "sign-in form after submitting an empty email",
    auth: "guest",
    status: 200,
    path: () => "/signin",
    prepare: async (page) => {
      await submitSignIn(page, "");
      await expect(page.getByLabel("Email address")).toHaveAttribute("aria-invalid", "true");
    },
  },
  {
    id: "signin-send-failed",
    route: "/signin",
    description: "sign-in form after the link could not be sent",
    auth: "guest",
    status: 200,
    path: () => "/signin",
    prepare: async (page) => {
      const interceptedAtMs = await interceptSignInSend(page, "failed");
      await submitSignIn(page, VALID_EMAIL, interceptedAtMs);
      await expect(page.getByLabel("Email address")).toHaveAccessibleDescription(/try again/i);
    },
  },
  {
    id: "signin-sent",
    route: "/signin",
    description: "sign-in form after the link was sent",
    auth: "guest",
    status: 200,
    path: () => "/signin",
    prepare: async (page) => {
      const interceptedAtMs = await interceptSignInSend(page, "sent");
      await submitSignIn(page, VALID_EMAIL, interceptedAtMs);
      await expect(page.getByRole("status")).toContainText(/check your email/i);
    },
  },
  {
    id: "sessions",
    route: "/account/sessions",
    description: "account sessions, signed in with another session listed",
    auth: "member",
    status: 200,
    path: () => "/account/sessions",
  },
  {
    id: "sessions-after-revoke",
    route: "/account/sessions",
    description: "account sessions right after revoking a session",
    auth: "member",
    status: 200,
    path: () => "/account/sessions",
    prepare: async (page, seed) => {
      await seed.createExtraSession();
      await page.reload();
      await page
        .getByRole("button", { name: /^revoke/i })
        .first()
        .click();
      await expect(page.getByRole("status")).toHaveText(/session revoked/i);
    },
  },
  {
    id: "not-found",
    route: null,
    description: "404 for an unknown URL",
    auth: "guest",
    status: 404,
    path: () => "/no-such-page-e2e",
  },
  {
    id: "not-found-account",
    route: null,
    description: "404 for /account, which is not a page",
    auth: "guest",
    status: 404,
    path: () => "/account",
  },
];
