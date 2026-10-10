import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined }) }));

const { SettingsForm } = await import("./ComponentAdminControls");

describe("SettingsForm: Coming soon in Settings (2026-10-10)", () => {
  it("offers a published component a way back to Coming soon, unticked", () => {
    const html = renderToStaticMarkup(
      <SettingsForm id="c1" access="OPEN" hidden={false} comingSoon published />,
    );
    expect(html).toContain("Show as Coming soon instead");
    expect(html).not.toMatch(
      /<input type="checkbox" checked=""[^>]*\/?>\s*Show as Coming soon instead/,
    );
  });

  it("keeps the draft's own Coming soon box, ticked when it is", () => {
    const html = renderToStaticMarkup(
      <SettingsForm id="c1" access="OPEN" hidden={false} comingSoon published={false} />,
    );
    expect(html).toContain("Show as Coming soon: its card and page");
    expect(html).not.toContain("Show as Coming soon instead");
  });
});
