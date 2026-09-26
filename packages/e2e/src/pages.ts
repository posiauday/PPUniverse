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
  /** "admin" signs in as the worker's ADMIN fixture user (MVP-020) instead of the ordinary member. */
  auth: "guest" | "member" | "admin";
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

/**
 * Registers a route handler that never resolves — freezes an in-flight
 * request so the client's "submitting" UI state (aria-disabled, "…" label)
 * can be scanned deterministically, rather than trying to catch a
 * genuinely transient state mid-flight. Playwright tears down open routes
 * when the test ends; nothing needs to release this.
 */
async function interceptAndHold(page: Page, urlGlob: string): Promise<void> {
  await page.route(urlGlob, () => {
    // Deliberately never calls fulfill/continue/abort.
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
    prepare: async (page, seed) => {
      // Reset first, then reload: this state is tested at every width against the
      // same worker-scoped fixture user and product, so without this only the
      // FIRST width's run would ever see the "not yet entitled" starting point —
      // every later width would find the button already gone from an earlier
      // width's own successful grant (found in CI, not locally, run 1).
      await seed.resetEntitlement(seed.freeGrantProduct.slug);
      await page.reload();
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
    // MVP-020 (FR-004). Six states cover the required list (empty, loading,
    // error, denied, pending-request, already-requested): "denied" and one
    // positive admin state are covered separately below, by the admin
    // surface itself — a signed-in member is denied that page outright, a
    // different kind of "denied" than anything on this account page.
    id: "privacy-empty",
    route: "/account/privacy",
    description: "account privacy page, no consent recorded and no deletion request made",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page, seed) => {
      // Reset first: this state must never see another state's leftover
      // consent/request rows for the same worker-scoped fixture user,
      // regardless of run order (the exact lesson MVP-010's resetEntitlement
      // already proved for this same class of problem).
      await seed.resetPrivacyState();
      await page.reload();
      await expect(
        page.getByRole("button", { name: /accept: the terms of service/i }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /request account deletion/i })).toBeVisible();
    },
  },
  {
    // Also satisfies "already-requested": in this UI, a user who already has
    // an active request sees exactly this pending view, not a separate
    // error — the submit control is not even rendered while one is active
    // (see DeletionRequestPanel), so there is no distinct client-visible
    // "you already requested" moment beyond this one.
    id: "privacy-pending-request",
    route: "/account/privacy",
    description: "account privacy page, a deletion request already submitted and pending",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page, seed) => {
      await seed.resetPrivacyState();
      await seed.submitDeletionRequest();
      await page.reload();
      await expect(page.getByText(/currently: submitted/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /withdraw request/i })).toBeVisible();
    },
  },
  {
    id: "privacy-denied",
    route: "/account/privacy",
    description: "account privacy page, a previous deletion request was denied",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page, seed) => {
      await seed.resetPrivacyState();
      const request = await seed.submitDeletionRequest();
      await seed.advanceDeletionRequest(request.id, "UNDER_REVIEW", seed.admin.id);
      await seed.advanceDeletionRequest(
        request.id,
        "DENIED",
        seed.admin.id,
        "E2E fixture denial reason.",
      );
      await page.reload();
      await expect(page.getByText(/previous request was denied/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /request account deletion again/i }),
      ).toBeVisible();
    },
  },
  {
    id: "privacy-loading",
    route: "/account/privacy",
    description: "account privacy page, deletion-request submission in flight",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page, seed) => {
      await seed.resetPrivacyState();
      await page.reload();
      await interceptAndHold(page, "**/api/account/deletion-requests");
      await page.getByRole("button", { name: /^request account deletion$/i }).click();
      await expect(page.getByRole("button", { name: /requesting…/i })).toBeVisible();
    },
  },
  {
    id: "privacy-error",
    route: "/account/privacy",
    description: "account privacy page, deletion-request submission failed",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page, seed) => {
      await seed.resetPrivacyState();
      await page.reload();
      await page.route("**/api/account/deletion-requests", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: "INTERNAL",
            message: "error",
            correlationId: "e2e-fixture",
          }),
        }),
      );
      await page.getByRole("button", { name: /^request account deletion$/i }).click();
      // Not page.getByRole("status") alone: this page has three status
      // regions at once (two ConsentToggle controls plus the deletion-
      // request panel), so the generic role locator is ambiguous — found
      // running this locally, before any CI push. The message text itself
      // is specific enough.
      await expect(page.getByText(/something went wrong\. please try again/i)).toBeVisible();
    },
  },
  {
    // The positive admin state: proves the surface actually renders a real
    // pending request, not just that it denies a non-admin (below). Asserts
    // only that THIS worker's own fixture request is visible — never a
    // total count — since listActiveDeletionRequests is a genuine
    // cross-user admin query and other workers' own fixture requests may
    // legitimately also be present at the same instant.
    id: "admin-deletion-requests-populated",
    route: "/admin/deletion-requests",
    description: "admin deletion-requests queue, signed in as ADMIN, with a pending request",
    auth: "admin",
    status: 200,
    path: () => "/admin/deletion-requests",
    prepare: async (page, seed) => {
      await seed.resetPrivacyState();
      await seed.submitDeletionRequest();
      await page.reload();
      await expect(page.getByText(seed.user.email)).toBeVisible();
    },
  },
  {
    // "denied": a signed-in MEMBER is refused this page outright — the
    // identical Next.js not-found response an unauthenticated visitor gets
    // (docs/final-decisions.md, "MVP-020 open questions 46, 47 and 48",
    // question 48, constraint 4). route: null, matching the established
    // convention for every 404-outcome state (not-found, not-found-account)
    // — the real page route is already exercised by the populated state above.
    id: "admin-deletion-requests-denied",
    route: null,
    description: "admin deletion-requests page, denied to a signed-in member",
    auth: "member",
    status: 404,
    path: () => "/admin/deletion-requests",
  },
  {
    // MVP-018 (FR-013). "empty": no token at all — a distinct code path
    // from a token being present but rejected (below), even though both
    // render the identical generic message on purpose (docs/final-
    // decisions.md, "MVP-018 open question 49": never disclose which
    // failure occurred).
    id: "unsubscribe-empty",
    route: "/unsubscribe",
    description: "unsubscribe page, no token provided",
    auth: "guest",
    status: 200,
    path: () => "/unsubscribe",
    prepare: async (page) => {
      await expect(page.getByText(/this link is no longer valid/i)).toBeVisible();
    },
  },
  {
    // "denied": a token IS present but does not verify.
    id: "unsubscribe-denied",
    route: "/unsubscribe",
    description: "unsubscribe page, an invalid token",
    auth: "guest",
    status: 200,
    path: () => "/unsubscribe?token=not-a-real-token",
    prepare: async (page) => {
      await expect(page.getByText(/this link is no longer valid/i)).toBeVisible();
    },
  },
  {
    // "unsubscribe-confirmation": a valid token, confirmed by clicking
    // through — GET itself has no side effects (email clients prefetch
    // links), so reaching the confirmation state requires the real POST.
    id: "unsubscribe-confirmation",
    route: "/unsubscribe",
    description: "unsubscribe page, after confirming",
    auth: "guest",
    status: 200,
    path: (seed) => `/unsubscribe?token=${seed.unsubscribeToken}`,
    prepare: async (page) => {
      await expect(
        page.getByRole("button", { name: /unsubscribe from marketing email/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /unsubscribe from marketing email/i }).click();
      await expect(page.getByText(/you have been unsubscribed/i)).toBeVisible();
    },
  },
  {
    id: "unsubscribe-loading",
    route: "/unsubscribe",
    description: "unsubscribe page, confirmation in flight",
    auth: "guest",
    status: 200,
    path: (seed) => `/unsubscribe?token=${seed.unsubscribeToken}`,
    prepare: async (page) => {
      await interceptAndHold(page, "**/api/unsubscribe");
      await page.getByRole("button", { name: /unsubscribe from marketing email/i }).click();
      await expect(page.getByRole("button", { name: /unsubscribing…/i })).toBeVisible();
    },
  },
  {
    id: "unsubscribe-error",
    route: "/unsubscribe",
    description: "unsubscribe page, confirmation failed",
    auth: "guest",
    status: 200,
    path: (seed) => `/unsubscribe?token=${seed.unsubscribeToken}`,
    prepare: async (page) => {
      await page.route("**/api/unsubscribe", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: "INTERNAL",
            message: "error",
            correlationId: "e2e-fixture",
          }),
        }),
      );
      await page.getByRole("button", { name: /unsubscribe from marketing email/i }).click();
      await expect(page.getByText(/something went wrong/i)).toBeVisible();
    },
  },
  {
    // Closes the "saved" required state, and backfills loading/error
    // coverage MVP-020 left implicit for this control (found while writing
    // this story's pre-work analysis, not a new production surface).
    // Direction-agnostic on purpose: whichever label the button currently
    // shows (Accept/Withdraw), clicking it produces the same outcome text.
    id: "privacy-consent-saved",
    route: "/account/privacy",
    description: "account privacy page, marketing-email preference saved",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page) => {
      await page.getByRole("button", { name: /marketing email/i }).click();
      await expect(page.getByText(/^saved\.$/i)).toBeVisible();
    },
  },
  {
    id: "privacy-consent-loading",
    route: "/account/privacy",
    description: "account privacy page, marketing-email preference save in flight",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page) => {
      await interceptAndHold(page, "**/api/account/consent");
      await page.getByRole("button", { name: /marketing email/i }).click();
      await expect(page.getByRole("button", { name: /saving…/i })).toBeVisible();
    },
  },
  {
    id: "privacy-consent-error",
    route: "/account/privacy",
    description: "account privacy page, marketing-email preference save failed",
    auth: "member",
    status: 200,
    path: () => "/account/privacy",
    prepare: async (page) => {
      await page.route("**/api/account/consent", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            code: "INTERNAL",
            message: "error",
            correlationId: "e2e-fixture",
          }),
        }),
      );
      await page.getByRole("button", { name: /marketing email/i }).click();
      await expect(page.getByText(/something went wrong\. please try again\./i)).toBeVisible();
    },
  },
  {
    // MVP-017 (FR-014). "published": the public /learn/[slug] read path.
    id: "learn-published",
    route: "/learn/[slug]",
    description: "published article (tutorial/pattern/comparison) content page",
    auth: "guest",
    status: 200,
    path: (seed) => `/learn/${seed.publishedArticle.slug}`,
  },
  {
    // "draft": a DRAFT article's slug is never publicly reachable — the
    // identical 404 an unknown slug gets, matching the same
    // publicly-visible-only rule the product/category pages already enforce.
    id: "learn-draft-not-found",
    route: null,
    description: "a draft article's slug 404s on the public /learn/[slug] route",
    auth: "guest",
    status: 404,
    path: (seed) => `/learn/${seed.draftArticle.slug}`,
  },
  {
    // The positive admin state: proves the surface actually lists real
    // Articles (one DRAFT, one PUBLISHED), not just that it denies a
    // non-admin (below) — mirrors admin-deletion-requests-populated.
    id: "admin-content-populated",
    route: "/admin/content",
    description: "admin content list, signed in as ADMIN, with draft and published articles",
    auth: "admin",
    status: 200,
    path: () => "/admin/content",
    prepare: async (page, seed) => {
      await expect(page.getByText(seed.draftArticle.title)).toBeVisible();
      await expect(page.getByText(seed.publishedArticle.title)).toBeVisible();
    },
  },
  {
    // "denied": a signed-in MEMBER is refused this page outright — the
    // identical Next.js not-found response an unauthenticated visitor gets
    // (docs/final-decisions.md, "MVP-017 implementation: content-publishing
    // authorization reuses ADMIN"). route: null, matching the established
    // convention for every 404-outcome state.
    id: "admin-content-denied",
    route: null,
    description: "admin content list, denied to a signed-in member",
    auth: "member",
    status: 404,
    path: () => "/admin/content",
  },
  {
    id: "admin-content-new",
    route: "/admin/content/new",
    description: "admin new-article form, signed in as ADMIN",
    auth: "admin",
    status: 200,
    path: () => "/admin/content/new",
  },
  {
    id: "admin-content-new-denied",
    route: null,
    description: "admin new-article form, denied to a signed-in member",
    auth: "member",
    status: 404,
    path: () => "/admin/content/new",
  },
  {
    id: "admin-content-edit",
    route: "/admin/content/[id]/edit",
    description: "admin edit-article form, signed in as ADMIN, pre-filled with an existing draft",
    auth: "admin",
    status: 200,
    path: (seed) => `/admin/content/${seed.draftArticle.id}/edit`,
  },
  {
    // The positive admin state: proves the surface actually lists real
    // Products (one DRAFT, one PUBLISHED), not just that it denies a
    // non-admin (below) — mirrors admin-content-populated.
    id: "admin-products-populated",
    route: "/admin/products",
    description: "admin products list, signed in as ADMIN, with a draft and a published product",
    auth: "admin",
    status: 200,
    path: () => "/admin/products",
    prepare: async (page, seed) => {
      await expect(page.getByText(seed.draftAdminProduct.name)).toBeVisible();
      await expect(page.getByText(seed.publishedAdminProduct.name)).toBeVisible();
    },
  },
  {
    // "denied": mirrors admin-content-denied exactly -- a signed-in MEMBER
    // gets the identical Next.js not-found response an unauthenticated
    // visitor gets (docs/final-decisions.md, "First-party-only publishing
    // model" section 6: first-party product authoring reuses ADMIN).
    id: "admin-products-denied",
    route: null,
    description: "admin products list, denied to a signed-in member",
    auth: "member",
    status: 404,
    path: () => "/admin/products",
  },
  {
    id: "admin-products-new",
    route: "/admin/products/new",
    description: "admin new-product form, signed in as ADMIN",
    auth: "admin",
    status: 200,
    path: () => "/admin/products/new",
  },
  {
    id: "admin-products-new-denied",
    route: null,
    description: "admin new-product form, denied to a signed-in member",
    auth: "member",
    status: 404,
    path: () => "/admin/products/new",
  },
  {
    // The DRAFT edit state: a bare product with none of the mandatory
    // publish fields yet, so the publish control's full missing-field list
    // (license, support policy, compatibility, release) is on screen --
    // the most accessibility-relevant edit-page state, since it is the one
    // with the richest dynamic error/status content.
    id: "admin-products-edit-draft",
    route: "/admin/products/[id]/edit",
    description:
      "admin edit-product form, signed in as ADMIN, a draft still missing every mandatory publish field",
    auth: "admin",
    status: 200,
    path: (seed) => `/admin/products/${seed.draftAdminProduct.id}/edit`,
    prepare: async (page) => {
      await expect(page.getByText(/still needs/i)).toBeVisible();
    },
  },
  {
    // The PUBLISHED edit state (direct product-owner decision, "PR #23
    // blocker corrections" A2/A7): no publish control renders at all (the
    // product is no longer DRAFT), and the one existing release shows as
    // "Published" with no attach/detach controls -- files are immutable.
    id: "admin-products-edit-published",
    route: "/admin/products/[id]/edit",
    description:
      "admin edit-product form, signed in as ADMIN, a published product with an immutable published release",
    auth: "admin",
    status: 200,
    path: (seed) => `/admin/products/${seed.publishedAdminProduct.id}/edit`,
    prepare: async (page) => {
      await expect(page.getByText(/—\s*Published/)).toBeVisible();
      await expect(page.getByText(/files are immutable/i)).toBeVisible();
    },
  },
  {
    id: "admin-products-edit-denied",
    route: null,
    description: "admin edit-product form, denied to a signed-in member",
    auth: "member",
    status: 404,
    path: (seed) => `/admin/products/${seed.draftAdminProduct.id}/edit`,
  },
  {
    // MVP-019 (FR-015/NFR-009): the reinstate-or-archive status control,
    // rendered only for a PUBLISHED or SUSPENDED product -- this fixture is
    // the SUSPENDED case (the PUBLISHED case is already exercised as part
    // of admin-products-edit-published above, which visits a PUBLISHED
    // product's edit page and therefore already renders this same control
    // in its PUBLISHED form -- no separate state needed for that half).
    id: "admin-products-edit-suspended",
    route: "/admin/products/[id]/edit",
    description:
      "admin edit-product form, signed in as ADMIN, a suspended product showing the reinstate/archive status control",
    auth: "admin",
    status: 200,
    path: (seed) => `/admin/products/${seed.suspendedAdminProduct.id}/edit`,
    prepare: async (page) => {
      await expect(page.getByText(/Status:\s*SUSPENDED/)).toBeVisible();
      await expect(page.getByLabel(/change status to/i)).toBeVisible();
      await expect(page.getByLabel(/reason/i)).toBeVisible();
    },
  },
  {
    // The positive admin state: this worker's own suspendedAdminProduct
    // fixture (created via a real ProductStatusEvent, see seed.ts) must be
    // visible -- never a total count, since listRecentProductStatusEvents
    // is a genuine cross-domain, cross-worker admin query and other
    // workers' own fixture events may legitimately also be present
    // (mirrors admin-deletion-requests-populated's identical rationale).
    id: "admin-audit-populated",
    route: "/admin/audit",
    description: "admin audit log, signed in as ADMIN, showing a product status change",
    auth: "admin",
    status: 200,
    path: () => "/admin/audit",
    prepare: async (page, seed) => {
      await expect(page.getByText(seed.suspendedAdminProduct.name)).toBeVisible();
    },
  },
  {
    id: "admin-audit-denied",
    route: null,
    description: "admin audit log, denied to a signed-in member",
    auth: "member",
    status: 404,
    path: () => "/admin/audit",
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
