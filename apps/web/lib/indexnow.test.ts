import { describe, expect, it, vi } from "vitest";
import { INDEXNOW_ENDPOINT, buildIndexNowRequest, indexNowKey, notifyIndexNow } from "./indexnow";

const SITE = { ok: true as const, origin: "https://lowcodestacks.example" };
// A made-up key in the right format; real keys live only in Netlify.
const SAMPLE = "test-key-only";

describe("indexNowKey", () => {
  it("accepts 8 to 128 letters, digits and dashes only", () => {
    expect(indexNowKey(SAMPLE)).toBe(SAMPLE);
    expect(indexNowKey(` ${SAMPLE} `)).toBe(SAMPLE);
    expect(indexNowKey("short")).toBeNull();
    expect(indexNowKey("has spaces in it")).toBeNull();
    expect(indexNowKey("a".repeat(129))).toBeNull();
    expect(indexNowKey(undefined)).toBeNull();
  });
});

describe("buildIndexNowRequest", () => {
  it("names the key file at the site root and keeps only this host's URLs, once each", () => {
    const body = buildIndexNowRequest(SITE.origin, SAMPLE, [
      `${SITE.origin}/guides/a`,
      `${SITE.origin}/guides/a`,
      "https://elsewhere.example/learn/b",
      "not a url",
    ]);
    expect(body).toEqual({
      host: "lowcodestacks.example",
      key: SAMPLE,
      keyLocation: `${SITE.origin}/indexnow-key.txt`,
      urlList: [`${SITE.origin}/guides/a`],
    });
  });
});

describe("notifyIndexNow", () => {
  it("posts the request as JSON and reports 200 and 202 as sent", async () => {
    for (const status of [200, 202]) {
      const fetchImpl = vi.fn(async () => new Response(null, { status }));
      await expect(
        notifyIndexNow([`${SITE.origin}/guides/a`], { site: SITE, key: SAMPLE, fetchImpl }),
      ).resolves.toBe("sent");
      const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe(INDEXNOW_ENDPOINT);
      expect(init.method).toBe("POST");
      expect(JSON.parse(String(init.body))).toMatchObject({
        key: SAMPLE,
        urlList: [`${SITE.origin}/guides/a`],
      });
    }
  });

  it("never throws: a refusal or a network error is reported as failed", async () => {
    const refused = vi.fn(async () => new Response(null, { status: 403 }));
    await expect(
      notifyIndexNow([`${SITE.origin}/x`], { site: SITE, key: SAMPLE, fetchImpl: refused }),
    ).resolves.toBe("failed");
    const broken = vi.fn(async () => {
      throw new TypeError("network down");
    });
    await expect(
      notifyIndexNow([`${SITE.origin}/x`], { site: SITE, key: SAMPLE, fetchImpl: broken }),
    ).resolves.toBe("failed");
  });

  it("sends nothing without a key, for a local or http site, or with no URLs on this host", async () => {
    const fetchImpl = vi.fn();
    const url = [`${SITE.origin}/x`];
    expect(await notifyIndexNow(url, { site: SITE, key: null, fetchImpl })).toBe("skipped");
    expect(
      await notifyIndexNow(["http://localhost:3000/x"], {
        site: { ok: true, origin: "http://localhost:3000" },
        key: SAMPLE,
        fetchImpl,
      }),
    ).toBe("skipped");
    expect(
      await notifyIndexNow(url, { site: { ok: false, reason: "MISSING" }, key: SAMPLE, fetchImpl }),
    ).toBe("skipped");
    expect(
      await notifyIndexNow(["https://elsewhere.example/x"], { site: SITE, key: SAMPLE, fetchImpl }),
    ).toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
