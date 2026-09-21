import { expectNoBlockingViolations, runAxe } from "../../src/axe.js";
import {
  allStops,
  collectHeadings,
  expectNoHorizontalOverflow,
  measureBorderContrast,
  measurePlaceholderContrast,
  traverseTabOrder,
} from "../../src/browser.js";
import { describeFocusProblem } from "../../src/focus.js";
import { expect, test } from "../../src/fixtures.js";

/**
 * Negative controls: each test feeds the helper something known to be bad and
 * proves the gate would catch it. A gate that cannot fail is worse than no gate,
 * so these run in every engine on every run. They use inline pages only: no
 * server state, no database.
 */

const doc = (body: string, head = ""): string =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Negative control</title>${head}</head><body>${body}</body></html>`;

const ONE_PIXEL_GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

test.describe("negative controls: the accessibility gate can fail", () => {
  test("axe reports an image with no text alternative as a blocking violation", async ({
    page,
  }) => {
    await page.setContent(doc(`<main><h1>Title</h1><img src="${ONE_PIXEL_GIF}"></main>`));
    const outcome = await runAxe(page);
    expect(outcome.blocking.map((rule) => rule.id)).toContain("image-alt");
  });

  test("axe reports low text contrast as a blocking violation", async ({ page }) => {
    await page.setContent(
      doc(
        `<main><h1>Title</h1><p style="color:#cccccc;background:#ffffff">Barely readable text</p></main>`,
      ),
    );
    const outcome = await runAxe(page);
    expect(outcome.blocking.map((rule) => rule.id)).toContain("color-contrast");
  });

  test("a best-practice finding is advisory and does not fail the gate", async ({
    page,
  }, testInfo) => {
    await page.setContent(doc("<main><h1>Title</h1><h3>Skipped a level</h3></main>"));
    const outcome = await runAxe(page);
    expect(outcome.advisory.map((rule) => rule.id)).toContain("heading-order");
    expect(outcome.blocking).toEqual([]);
    // ...and the gate helper agrees: it records the finding without throwing.
    await expectNoBlockingViolations(page, testInfo, "advisory-only");
  });

  test("the gate helper throws on a blocking violation", async ({ page }, testInfo) => {
    await page.setContent(doc(`<main><h1>Title</h1><img src="${ONE_PIXEL_GIF}"></main>`));
    await expect(expectNoBlockingViolations(page, testInfo, "control")).rejects.toThrow(
      /blocking WCAG A\/AA violation/,
    );
  });

  test("focus checks flag a removed outline, a near-white outline and a dark-on-dark outline, and pass a good one", async ({
    page,
  }) => {
    await page.setContent(
      doc(
        `<main>
          <button id="none">No outline</button>
          <button id="faint">Faint outline</button>
          <button id="good">Good outline</button>
          <div style="background:#111111;padding:16px"><button id="dark">On a dark panel</button></div>
        </main>`,
        `<style>
          #none:focus-visible { outline: none; }
          #faint:focus-visible { outline: 2px solid #fafafa; outline-offset: 2px; }
          #good:focus-visible { outline: 2px solid #1b1d24; outline-offset: 2px; }
          #dark:focus-visible { outline: 2px solid #1b1d24; outline-offset: 2px; }
        </style>`,
      ),
    );
    const { stops, unreached } = await traverseTabOrder(page);
    expect(stops).toHaveLength(4);
    expect(unreached).toEqual([]);

    const problems = stops.map((stop) => describeFocusProblem(stop.indicator));
    expect(problems[0]).toMatch(/no visible outline/);
    expect(problems[1]).toMatch(/below 3:1/);
    expect(problems[2]).toBeNull();
    // The dark panel is the real backdrop: a dark ring on it fails, which a token-only check would miss.
    expect(problems[3]).toMatch(/below 3:1/);
  });

  test("the tab traversal reports a control the keyboard cannot reach", async ({ page }) => {
    await page.setContent(
      doc(
        `<main>
          <button id="a">First</button>
          <button id="b">Skipped</button>
          <button id="c">Third</button>
        </main>
        <script>
          document.getElementById("a").addEventListener("keydown", function (event) {
            if (event.key === "Tab" && !event.shiftKey) {
              event.preventDefault();
              document.getElementById("c").focus();
            }
          });
        </script>`,
      ),
    );
    const { unreached } = await traverseTabOrder(page);
    expect(unreached).toEqual(['button "Skipped"']);
  });

  test("links are either reached by Tab or measured directly, never silently dropped", async ({
    page,
  }) => {
    await page.setContent(
      doc(
        `<main><a href="#one">One</a><button>Two</button></main>`,
        "<style>a:focus-visible { outline: 2px solid #1b1d24; outline-offset: 2px; }</style>",
      ),
    );
    const traversal = await traverseTabOrder(page);
    expect(traversal.unreached).toEqual([]);
    expect(allStops(traversal).map((stop) => stop.indicator.element)).toEqual(
      expect.arrayContaining(['a "One"', 'button "Two"']),
    );
    // WebKit's Tab key skips links, so there the link is measured by moving focus to it.
    if (traversal.tabsToLinks) {
      expect(traversal.linkStops).toEqual([]);
    } else {
      expect(traversal.linkStops).toHaveLength(1);
    }
  });

  test("a tabindex of -1 is deliberate and is not reported as unreachable", async ({ page }) => {
    await page.setContent(
      doc(
        `<main><button>Reachable</button><button tabindex="-1">Not in the tab order</button></main>`,
      ),
    );
    const { stops, unreached } = await traverseTabOrder(page);
    expect(stops).toHaveLength(1);
    expect(unreached).toEqual([]);
  });

  test("the overflow check flags a page wider than a 320px viewport and passes one that fits", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.setContent(
      doc(`<main><div style="width:640px;height:10px;background:#000000"></div></main>`),
    );
    await expect(expectNoHorizontalOverflow(page, "wide page")).rejects.toThrow(
      /horizontal scrolling/,
    );

    await page.setContent(doc("<main><p>This fits.</p></main>"));
    await expectNoHorizontalOverflow(page, "narrow page");
  });

  test("border and placeholder contrast are measured from the rendered element", async ({
    page,
  }) => {
    await page.setContent(
      doc(
        `<main>
          <input id="faint" placeholder="Search" style="border:1px solid #dddddd">
          <input id="strong" placeholder="Search" style="border:1px solid #767676">
        </main>`,
        `<style>
          #faint::placeholder { color: #aaaaaa; }
          #strong::placeholder { color: #595959; }
        </style>`,
      ),
    );
    const faintBorder = await measureBorderContrast(page.locator("#faint"));
    const strongBorder = await measureBorderContrast(page.locator("#strong"));
    expect(faintBorder.ratioOutside).not.toBeNull();
    expect(faintBorder.ratioOutside as number).toBeLessThan(3);
    expect(strongBorder.ratioOutside as number).toBeGreaterThanOrEqual(3);

    const faintPlaceholder = await measurePlaceholderContrast(page.locator("#faint"));
    const strongPlaceholder = await measurePlaceholderContrast(page.locator("#strong"));
    expect(faintPlaceholder.ratio).toBeLessThan(4.5);
    expect(strongPlaceholder.ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("an unbordered control reports no boundary rather than a passing ratio", async ({
    page,
  }) => {
    await page.setContent(doc(`<main><input id="bare" style="border:0"></main>`));
    const boundary = await measureBorderContrast(page.locator("#bare"));
    expect(boundary.ratioOutside).toBeNull();
  });

  test("the heading collector counts visually hidden headings and skips display:none ones", async ({
    page,
  }) => {
    await page.setContent(
      doc(
        `<main>
          <h1>Visible</h1>
          <h2 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">Visually hidden</h2>
          <h3 style="display:none">Removed</h3>
          <div role="heading" aria-level="3">ARIA heading</div>
        </main>`,
      ),
    );
    expect((await collectHeadings(page)).map((heading) => heading.level)).toEqual([1, 2, 3]);
  });
});
