import type { Page, Route } from "@playwright/test";

/**
 * Held requests: freezing an in-flight request so a "submitting" UI state
 * (aria-disabled, a "…" label) can be scanned deterministically, instead of
 * trying to catch a genuinely transient state mid-flight.
 *
 * Every held request is ABORTED when the test ends (see the `heldRequests`
 * auto fixture in fixtures.ts). It is never simply left pending: that was
 * the original design, on the assumption that Playwright discards open
 * routes with the page, and it is wrong. WebKit delivers a still-pending
 * request to the server when the page closes, so the "held" POST really ran
 * (a real deletion request, a real email) during worker teardown, racing
 * the fixture cleanup and failing it (BUG-016).
 */

const held = new WeakMap<Page, Route[]>();

export async function interceptAndHold(page: Page, urlGlob: string): Promise<void> {
  await page.route(urlGlob, (route) => {
    const routes = held.get(page) ?? [];
    routes.push(route);
    held.set(page, routes);
  });
}

/** Aborts every request this page is holding, so none of them ever reaches the server. */
export async function abortHeldRequests(page: Page): Promise<void> {
  const routes = held.get(page) ?? [];
  held.delete(page);
  await Promise.all(routes.map((route) => route.abort().catch(() => undefined)));
}
