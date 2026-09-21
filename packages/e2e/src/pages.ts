import { expect, type Page } from "@playwright/test";
import { interceptSignInSend } from "./auth-intercept.js";
import { type GatedRoute } from "./page-routes.js";
import { NO_MATCH_TERM, SEARCH_TERM, type FixtureSet } from "./seed.js";

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

async function submitSignIn(page: Page, email: string): Promise<void> {
  if (email) await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: SEND_LINK }).click();
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
      await interceptSignInSend(page, "failed");
      await submitSignIn(page, VALID_EMAIL);
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
      await interceptSignInSend(page, "sent");
      await submitSignIn(page, VALID_EMAIL);
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
