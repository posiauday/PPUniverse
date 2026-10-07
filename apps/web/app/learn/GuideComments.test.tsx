import type { GuideComment } from "@ppu/domain-content";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; children?: unknown; className?: string }) =>
      createElement("a", { href: props.href, className: props.className }, props.children as never),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { GuideComments } from "./GuideComments";

function comment(overrides: Partial<GuideComment> = {}): GuideComment {
  return {
    id: "c-1",
    body: "A plain comment.",
    createdAt: new Date("2026-10-07T10:00:00Z"),
    accepted: false,
    mine: false,
    displayName: "Tidy Trigger 418",
    avatarSeed: "seed",
    ...overrides,
  };
}

const render = (comments: GuideComment[], signedIn = false) =>
  renderToStaticMarkup(
    <GuideComments
      slug="a-guide"
      comments={comments}
      viewer={signedIn ? { displayName: "Swift Canvas 207", avatarSeed: "v" } : null}
    />,
  );

describe("GuideComments (MVP-040)", () => {
  it("escapes HTML, and marks links as user content", () => {
    const html = render([
      comment({ body: "<script>alert(1)</script> see https://learn.microsoft.com/x for more" }),
    ]);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('href="https://learn.microsoft.com/x" rel="ugc nofollow noopener"');
  });

  it("shows code blocks as focusable, labelled scroll regions", () => {
    const html = render([comment({ body: "Try this:\n\n```\nSet(x, 1)\n```" })]);
    expect(html).toContain('tabindex="0" aria-label="Code, scrollable"');
    expect(html).toContain("<code>Set(x, 1)</code>");
  });

  it("shows the accepted fix badge, the count, and only display names", () => {
    const html = render([
      comment({ accepted: true }),
      comment({ id: "c-2", displayName: "Bold Flow 300" }),
    ]);
    expect(html).toContain("Comments (2)");
    expect(html).toContain("Accepted fix");
    expect(html).toContain("Tidy Trigger 418");
    expect(html).toContain("Bold Flow 300");
  });

  it("asks a guest to sign in, and gives a signed-in reader the form", () => {
    const guest = render([]);
    expect(guest).toContain("No comments yet");
    expect(guest).toContain('href="/signin?callbackUrl=%2Flearn%2Fa-guide%23reader_comments"');
    expect(guest).not.toContain("<textarea");
    const member = render([], true);
    expect(member).toContain("<textarea");
    expect(member).toContain("as Swift Canvas 207");
  });

  it("offers Delete on the reader's own comment and a named Report on others'", () => {
    const html = render(
      [comment({ mine: true }), comment({ id: "c-2", displayName: "Bold Flow 300" })],
      true,
    );
    expect(html).toContain("Delete my comment");
    expect(html).toContain('aria-label="Report the comment by Bold Flow 300"');
  });
});
