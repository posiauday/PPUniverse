import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Share-image routes (SEO story): real ImageResponse rendering, mocked
 * repositories. The text on an image must come from a PUBLISHED row looked
 * up by slug; anything else is a plain 404.
 */

const content = vi.hoisted(() => ({ findPublishedArticleBySlug: vi.fn() }));
const catalog = vi.hoisted(() => ({ findPublishedProductBySlug: vi.fn() }));
vi.mock("../../lib/content", () => ({ contentRepository: content }));
vi.mock("../../lib/catalog", () => ({ catalogRepository: catalog }));

import { GET as learnImage } from "./learn/[slug]/route";
import { GET as productImage } from "./products/[slug]/route";
import { GET as siteImage } from "./route";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const context = (slug: string) => ({ params: Promise.resolve({ slug }) });
const request = new Request("https://example.com/og");

async function expectPng(response: Response): Promise<void> {
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(response.headers.get("cache-control")).toContain("max-age=");
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.slice(0, 4)]).toEqual(PNG_SIGNATURE);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("share-image routes", () => {
  it("renders the site-wide image", async () => {
    await expectPng(siteImage());
  }, 20_000);

  it("renders a published article's image, looked up by slug", async () => {
    content.findPublishedArticleBySlug.mockResolvedValue({ title: "Intro", type: "TUTORIAL" });
    await expectPng(await learnImage(request, context("intro")));
    expect(content.findPublishedArticleBySlug).toHaveBeenCalledWith("intro");
  }, 20_000);

  it("renders a published product's image, looked up by slug", async () => {
    catalog.findPublishedProductBySlug.mockResolvedValue({
      name: "Sample Component",
      category: { name: "Power Apps Components" },
    });
    await expectPng(await productImage(request, context("sample-component")));
  }, 20_000);

  it("is a plain 404 for an unknown, draft or unpublished slug", async () => {
    content.findPublishedArticleBySlug.mockResolvedValue(null);
    catalog.findPublishedProductBySlug.mockResolvedValue(null);
    for (const response of [
      await learnImage(request, context("draft")),
      await productImage(request, context("draft")),
    ]) {
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).not.toBe("image/png");
    }
  });
});
