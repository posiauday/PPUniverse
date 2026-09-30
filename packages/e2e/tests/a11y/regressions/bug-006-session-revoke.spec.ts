import { prisma } from "@ppu/db";
import { tabUntilFocused } from "../../../src/browser.js";
import { expect, test } from "../../../src/fixtures.js";

/**
 * BUG-006 (WCAG 4.1.3 Status Messages, 2.4.3 Focus Order): revoking a session
 * removed its row silently and dropped keyboard focus to the document body, because
 * the button that had focus was removed with the row.
 *
 * The session is created in the database and revoked through the real UI and API,
 * so the server-enforced revoke path is what is exercised.
 */
test.describe("BUG-006: revoking a session keeps focus and announces the outcome", () => {
  test("after a keyboard revoke, focus is on a control inside main and the outcome is announced", async ({
    page,
    seed,
    signedIn,
  }) => {
    void signedIn;
    const extra = await seed.createExtraSession();
    await page.goto("/account/sessions");

    // The live region has to exist BEFORE the change for assistive technology to announce it.
    const status = page.getByRole("status");
    await expect(status).toHaveCount(1);

    const revokeButtons = page.getByRole("button", { name: /^revoke/i });
    const before = await revokeButtons.count();
    const rows = page.getByRole("listitem");
    const rowsBefore = await rows.count();
    expect(before, "the fixture user should have a revocable session").toBeGreaterThan(0);

    await tabUntilFocused(page, revokeButtons.first());
    await page.keyboard.press("Enter");

    // The row is gone. It is removed only after the server refresh that follows the delete, so
    // this waits for the real outcome (the button label changes to "Revoking…" while the request is in flight)...
    await expect(rows).toHaveCount(rowsBefore - 1);
    await expect(revokeButtons).toHaveCount(before - 1);
    expect(
      await prisma.session.count({ where: { id: { in: [extra.id, seed.otherSession.id] } } }),
      "one of the fixture user's other sessions should have been deleted by the server",
    ).toBeLessThan(2);

    // ...focus did not fall to the body...
    const focus = await page.evaluate(() => {
      const element = document.activeElement;
      return {
        isBody: !element || element === document.body || element === document.documentElement,
        insideMain: Boolean(element?.closest("main")),
      };
    });
    expect(focus.isBody, "focus fell to the document body").toBe(false);
    expect(focus.insideMain, "focus should stay inside the main landmark").toBe(true);

    // ...and the outcome was announced through the persistent status region.
    await expect(status).toHaveText(/session revoked/i);
  });
});
