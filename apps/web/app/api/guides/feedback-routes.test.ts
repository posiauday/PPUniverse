import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Did this fix it?" and "Something here changed?" (MVP-039, MVP-038): the
 * HTTP layer, with the repositories mocked. The repository itself is tested
 * against Postgres in @ppu/adapter-content.
 */
const content = vi.hoisted(() => ({ findPublishedArticleBySlug: vi.fn() }));
const feedback = vi.hoisted(() => ({
  consumeAllowance: vi.fn(),
  recordVote: vi.fn(),
  recordReport: vi.fn(),
}));
const logs = vi.hoisted(() => ({ info: vi.fn() }));

vi.mock("../../../lib/content", () => ({ contentRepository: content }));
vi.mock("../../../lib/feedback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/feedback")>()),
  feedbackRepository: feedback,
}));
vi.mock("@ppu/db", () => ({ prisma: {} }));
vi.mock("@ppu/telemetry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@ppu/telemetry")>()),
  logger: { info: logs.info, warn: vi.fn(), error: vi.fn() },
}));

const vote = await import("./[slug]/vote/route");
const report = await import("./[slug]/report/route");

const ORIGIN = "https://lowcodestacks.example";
const params = (slug = "a-guide") => ({ params: Promise.resolve({ slug }) });

function post(path: string, body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-nf-client-connection-ip": "203.0.113.5",
  };
  if (origin) headers["Origin"] = origin;
  return new Request(`${ORIGIN}/api/guides/a-guide/${path}`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", ORIGIN);
  content.findPublishedArticleBySlug.mockResolvedValue({ id: "art-1", slug: "a-guide" });
  feedback.consumeAllowance.mockResolvedValue(true);
  feedback.recordVote.mockResolvedValue(undefined);
  feedback.recordReport.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/guides/[slug]/vote", () => {
  it("records a yes vote for a published guide", async () => {
    const response = await vote.POST(post("vote", { helpful: "yes" }), params());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(feedback.recordVote).toHaveBeenCalledWith("art-1", true);
  });

  it("refuses another site, a bad body and an unpublished guide", async () => {
    expect((await vote.POST(post("vote", { helpful: "yes" }, null), params())).status).toBe(403);
    expect((await vote.POST(post("vote", { helpful: "maybe" }), params())).status).toBe(400);
    expect((await vote.POST(post("vote", "nope"), params())).status).toBe(400);
    content.findPublishedArticleBySlug.mockResolvedValueOnce(null);
    expect((await vote.POST(post("vote", { helpful: "no" }), params())).status).toBe(404);
    expect(feedback.recordVote).not.toHaveBeenCalled();
  });

  it("thanks a repeat or over-limit vote but doesn't count it", async () => {
    feedback.consumeAllowance.mockResolvedValueOnce(false);
    const response = await vote.POST(post("vote", { helpful: "yes" }), params());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(feedback.recordVote).not.toHaveBeenCalled();
  });

  it("keys the limits on a hash, never the address itself", async () => {
    await vote.POST(post("vote", { helpful: "yes" }), params());
    const keys = feedback.consumeAllowance.mock.calls.map((call) => String(call[0]));
    expect(keys).toHaveLength(2);
    for (const key of keys) {
      expect(key).toMatch(/^[0-9a-f]{64}$/);
      expect(key).not.toContain("203.0.113.5");
    }
  });
});

describe("POST /api/guides/[slug]/report", () => {
  const MESSAGE = "The 5,000 limit is now 10,000 in the new designer.";

  it("records a tidy note and never logs its text", async () => {
    const response = await report.POST(post("report", { message: `  ${MESSAGE}  ` }), params());
    expect(response.status).toBe(200);
    expect(feedback.recordReport).toHaveBeenCalledWith("art-1", MESSAGE);
    expect(JSON.stringify(logs.info.mock.calls)).not.toContain("10,000");
  });

  it("explains a note that is too short or too long", async () => {
    const short = await report.POST(post("report", { message: "bad" }), params());
    expect(short.status).toBe(400);
    expect(await short.json()).toEqual({ error: "too-short" });
    const long = await report.POST(post("report", { message: "x".repeat(501) }), params());
    expect(await long.json()).toEqual({ error: "too-long" });
    expect(feedback.recordReport).not.toHaveBeenCalled();
  });

  it("answers 429 once an address has sent its hourly reports", async () => {
    feedback.consumeAllowance.mockResolvedValueOnce(false);
    const response = await report.POST(post("report", { message: MESSAGE }), params());
    expect(response.status).toBe(429);
    expect(feedback.recordReport).not.toHaveBeenCalled();
  });

  it("refuses another site", async () => {
    const response = await report.POST(
      post("report", { message: MESSAGE }, "https://evil.example"),
      params(),
    );
    expect(response.status).toBe(403);
  });
});
