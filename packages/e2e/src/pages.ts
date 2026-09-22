import { expect, type Page } from "@playwright/test";
import { interceptSignInSend, type SignInInterception } from "./auth-intercept.js";
import { type GatedRoute } from "./page-routes.js";
import { NO_MATCH_TERM, SEARCH_TERM, type FixtureSet } from "./seed.js";
import {
  checkObserverLiveness,
  installClickEventTracer,
  recordSignInClickDiagnostics,
  snapshotButtonNode,
  type ButtonSnapshot,
  type ClickEventLogEntry,
  type NativeSubmitLogEntry,
  type ObserverLivenessResult,
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
 * Reads observer liveness (round 2, decision 2026-09-22 "BUG-014 recurrence") and
 * turns a thrown evaluate() into evidence rather than an unhandled rejection: an
 * execution-context-destroyed error is the strongest possible signal of a document
 * replacement happening at that exact moment, so it is recorded as `evaluateError`,
 * not swallowed into a bare null.
 */
async function readObserverLiveness(page: Page): Promise<ObserverLivenessResult> {
  return page.evaluate(checkObserverLiveness).then(
    (snapshot) => ({ ...snapshot, evaluateError: null }),
    (error: unknown) => ({
      atMs: -1,
      tokenPresent: false,
      token: null,
      evaluateError: String(error),
    }),
  );
}

/**
 * Submits the sign-in form. Also gathers click-diagnostics evidence (decisions,
 * 2026-09-21: "Run 7 failure / sign-in submit signature", "Run 8 disposition"; round 2,
 * 2026-09-22, "BUG-014 recurrence") for the CI failures observed on this exact
 * interaction (runs 4, 7, 15, all Firefox, all 320px): whether the click reaches the
 * button (hit test), whether it was hydrated, whether the browser's own click/submit
 * events fire at document AND at React's own root, whether the button is still the
 * SAME node, still connected, and still laid out the same way immediately before the
 * click as it was right after the locator resolved — and, since run 15 showed all of
 * the above can be clean while the observer itself silently died, whether the
 * install-time observer token is still readable immediately before AND immediately
 * after the click, whether a native (unprevented) form submission was seen, and
 * whether the route interceptor was ever actually invoked. Recorded on `window` for
 * `failure-evidence.ts` to attach ONLY if the test ends up failing; adds a few fast,
 * synchronous-in-page evaluate calls regardless (unavoidable, since whether the test
 * will fail is not known in advance).
 */
async function submitSignIn(
  page: Page,
  email: string,
  interception: SignInInterception | null = null,
): Promise<void> {
  const installToken = await page.evaluate(installClickEventTracer);
  const rootContainer = await page.evaluate(
    () =>
      (window as unknown as { __e2eRootInfo?: RootContainerInfo }).__e2eRootInfo ?? {
        found: false,
        description: null,
      },
  );

  const button = page.getByRole("button", { name: SEND_LINK });
  const atResolution = await button
    .evaluate(snapshotButtonNode)
    .catch((): ButtonSnapshot | null => null);

  if (email) await page.getByLabel("Email address").fill(email);

  // Snapshotted AGAIN, after fill() — the specific re-render under suspicion — and
  // immediately before the click, not reused from before it. Its own hit test uses this
  // exact element reference, so the snapshot and the hit test can never disagree about
  // which node they mean.
  const atDispatch = await button
    .evaluate(snapshotButtonNode)
    .catch((): ButtonSnapshot | null => null);

  // Round 2, items 2a/2b: read immediately before AND immediately after the click, not
  // just once — the whole point is to catch a replacement that happens DURING dispatch.
  const observerBeforeClick = await readObserverLiveness(page);

  const clickIssuedAtMs = Date.now();
  await button.click();

  const observerAfterClick = await readObserverLiveness(page);

  const events = await page.evaluate(() => {
    const w = window as unknown as {
      __e2eClickEvents?: ClickEventLogEntry[];
      __e2eRootClickEvents?: ClickEventLogEntry[];
    };
    return { document: w.__e2eClickEvents ?? [], root: w.__e2eRootClickEvents ?? null };
  });

  const nativeSubmitLog = await page
    .evaluate(
      () =>
        (window as unknown as { __e2eNativeSubmitLog?: NativeSubmitLogEntry[] })
          .__e2eNativeSubmitLog ?? [],
    )
    .catch((): NativeSubmitLogEntry[] => []);

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
    interceptionRegisteredAtMs: interception?.registeredAtMs ?? null,
    interceptionInvocationCount: interception?.invocationCount() ?? null,
    clickIssuedAtMs,
    rootContainer,
    installToken,
    observerBeforeClick,
    observerAfterClick,
    atResolution,
    atDispatch,
    nodeReplacedBetweenResolutionAndDispatch,
    rectDelta,
    events,
    nativeSubmitLog,
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
    // MVP-010 (FR-005): guest coverage of the free-entitlement prompt is
    // already exercised by product-full/product-minimal above, both
    // auth: "guest" — a signed-out visitor sees the same "Sign in to get
    // this for free" prompt there, with no separate state needed. These
    // three states cover the signed-in axis, which no existing state does.
    id: "product-free-idle",
    route: "/products/[slug]",
    description: "product page, signed in, not yet entitled: the free-download button",
    auth: "member",
    status: 200,
    path: (seed) => `/products/${seed.minimalProduct.slug}`,
    prepare: async (page) => {
      // Not a no-op: proves this state actually reached "not yet entitled",
      // rather than silently passing regardless of which branch rendered.
      await expect(page.getByRole("button", { name: /get for free/i })).toBeVisible();
    },
  },
  {
    // Deliberately a DIFFERENT product than product-free-idle/product-free-granted
    // (fullProduct, not minimalProduct): `seed` is worker-scoped (the same
    // fixture user and products are reused by every test in a worker), and
    // with fullyParallel: true, tests from different states are not
    // guaranteed to run in declaration order or even on the same worker.
    // Granting an entitlement here must not be able to leak into a state
    // that specifically expects no entitlement yet.
    id: "product-free-entitled",
    route: "/products/[slug]",
    description: "product page, signed in, already entitled",
    auth: "member",
    status: 200,
    path: (seed) => `/products/${seed.fullProduct.slug}`,
    prepare: async (page, seed) => {
      await seed.grantEntitlement(seed.fullProduct.slug);
      await page.reload();
      await expect(page.getByText(/you already have this/i)).toBeVisible();
    },
  },
  {
    id: "product-free-granted",
    route: "/products/[slug]",
    description: "product page, signed in, after granting a free entitlement",
    auth: "member",
    status: 200,
    path: (seed) => `/products/${seed.freeGrantProduct.slug}`,
    prepare: async (page) => {
      await page.getByRole("button", { name: /get for free/i }).click();
      await expect(page.getByRole("status")).toHaveText(/you now have this for free/i);
    },
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
      const interception = await interceptSignInSend(page, "failed");
      await submitSignIn(page, VALID_EMAIL, interception);
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
      const interception = await interceptSignInSend(page, "sent");
      await submitSignIn(page, VALID_EMAIL, interception);
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
