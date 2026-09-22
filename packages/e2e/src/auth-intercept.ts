import type { Page } from "@playwright/test";

export type SendOutcome = "sent" | "failed";

/**
 * Intercepts the sign-in "send link" request INSIDE THE TEST so the form can reach
 * its "failed" and "sent" states without sending mail. This is test-side only:
 * nothing in the application changes for tests, and there is no test mode, bypass,
 * environment-gated branch or relaxed authorization anywhere in the product code
 * (decision Q40 and the stop-gate response).
 *
 * next-auth's client reads `error` from the query string of the URL in the JSON body.
 */
/**
 * Returns the Node wall-clock time (§Date.now()§) at which the route interception was
 * confirmed registered, so a caller can record how long before a subsequent click it
 * was in place (decision, 2026-09-21: "Run 7 failure / sign-in submit signature",
 * item 2d).
 */
export async function interceptSignInSend(page: Page, outcome: SendOutcome): Promise<number> {
  await page.route("**/api/auth/signin/email", async (route) => {
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
  return Date.now();
}
