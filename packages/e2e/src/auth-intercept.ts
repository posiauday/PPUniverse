import type { Page } from "@playwright/test";

export type SendOutcome = "sent" | "failed";

/**
 * What `interceptSignInSend` hands back: not just when interception was confirmed
 * registered, but (decision, 2026-09-22, "BUG-014 recurrence", item 2e) whether the
 * route handler was ever actually invoked — read directly, not inferred from a
 * separate network log. `page.route()` handlers stay bound to the `Page` for its whole
 * lifetime, including across a same-page navigation; if a request was made and this
 * handler never fired, `invocationCount()` proves that directly.
 */
export interface SignInInterception {
  /** Node wall-clock time (`Date.now()`) at which registration was confirmed. */
  registeredAtMs: number;
  /** How many times this specific route handler has fired so far, read at call time. */
  invocationCount: () => number;
}

/**
 * Intercepts the sign-in "send link" request INSIDE THE TEST so the form can reach
 * its "failed" and "sent" states without sending mail. This is test-side only:
 * nothing in the application changes for tests, and there is no test mode, bypass,
 * environment-gated branch or relaxed authorization anywhere in the product code
 * (decision Q40 and the stop-gate response).
 *
 * next-auth's client reads `error` from the query string of the URL in the JSON body.
 */
export async function interceptSignInSend(
  page: Page,
  outcome: SendOutcome,
): Promise<SignInInterception> {
  let invocations = 0;
  await page.route("**/api/auth/signin/email", async (route) => {
    invocations += 1;
    const origin = new URL(route.request().url()).origin;
    const url =
      outcome === "sent"
        ? `${origin}/api/auth/verify-request?provider=email&type=email`
        : `${origin}/api/auth/error?error=EmailSignin`;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url }),
    });
  });
  return {
    registeredAtMs: Date.now(),
    invocationCount: () => invocations,
  };
}
