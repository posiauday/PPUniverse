import type { Page } from "@playwright/test";
import { tabUntilFocused } from "../../../src/browser.js";
import { expect, test } from "../../../src/fixtures.js";

/**
 * BUG-005, error handling (WCAG 3.3.1 Error Identification, 3.3.3 Error
 * Suggestion, 4.1.3 Status Messages, 2.4.3 Focus Order): the sign-in form showed
 * only a generic "something went wrong" for an empty or invalid email, never named
 * the field, and after submitting, keyboard focus fell to the document body.
 *
 * The auth API is intercepted INSIDE THE TEST to reach the "send failed" and "sent"
 * states without sending mail. That is test-side only: nothing in the application
 * changes for tests (decision Q40 and the stop-gate response).
 */

type SendOutcome = "sent" | "failed";

async function interceptSend(page: Page, outcome: SendOutcome): Promise<void> {
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
}

/** Submits the form with the Enter key from the email field: a real key press, as a keyboard user would. */
async function submitFromEmailField(page: Page, value: string): Promise<void> {
  const email = page.getByLabel("Email address");
  await tabUntilFocused(page, email);
  if (value) await page.keyboard.type(value);
  await page.keyboard.press("Enter");
}

/** Types an email, then submits with the Enter key while the submit BUTTON has focus (real key presses). */
async function submitWithButton(page: Page, value: string): Promise<void> {
  await tabUntilFocused(page, page.getByLabel("Email address"));
  if (value) await page.keyboard.type(value);
  await tabUntilFocused(page, page.getByRole("button", { name: /send sign-in link/i }));
  await page.keyboard.press("Enter");
}

test.describe("BUG-005: sign-in errors name the field, are tied to it, and keep focus sensible", () => {
  test("an empty email is reported against the email field and focus moves to it", async ({
    page,
  }) => {
    await page.goto("/signin");
    const email = page.getByLabel("Email address");
    await submitFromEmailField(page, "");

    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAccessibleDescription(/email/i);
    await expect(email).toBeFocused();
  });

  test("a malformed email is reported against the email field and focus moves to it", async ({
    page,
  }) => {
    await page.goto("/signin");
    const email = page.getByLabel("Email address");
    await submitFromEmailField(page, "not-an-email");

    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAccessibleDescription(/email/i);
    await expect(email).toBeFocused();
  });

  test("a failed send keeps the error tied to the field and moves focus back to it", async ({
    page,
  }) => {
    await interceptSend(page, "failed");
    await page.goto("/signin");
    const email = page.getByLabel("Email address");
    await submitWithButton(page, "e2e-a11y@example.invalid");

    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAccessibleDescription(/try again/i);
    await expect(email).toBeFocused();
  });

  test("a successful send announces the outcome and keeps focus on a real control, not the body", async ({
    page,
  }) => {
    await interceptSend(page, "sent");
    await page.goto("/signin");
    const email = page.getByLabel("Email address");
    const submit = page.getByRole("button", { name: /send sign-in link/i });
    await submitWithButton(page, "e2e-a11y@example.invalid");

    await expect(page.getByRole("status")).toContainText(/check your email/i);
    await expect(submit).toBeFocused();
    await expect(email).not.toHaveAttribute("aria-invalid", "true");
  });
});
