import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendEmailAdapter } from "./resend-email-adapter.js";

describe("ResendEmailAdapter", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to Resend's API with the bearer token and message fields", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const adapter = new ResendEmailAdapter({ apiKey: "re_test_key", from: "no-reply@example.com" });

    await adapter.send({ to: "person@example.com", subject: "Sign in", text: "Click here" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer re_test_key");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toMatchObject({
      from: "no-reply@example.com",
      to: "person@example.com",
      subject: "Sign in",
      text: "Click here",
    });
    expect(body["html"]).toBeUndefined();
  });

  it("includes html only when provided", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const adapter = new ResendEmailAdapter({ apiKey: "re_test_key", from: "no-reply@example.com" });

    await adapter.send({
      to: "person@example.com",
      subject: "Sign in",
      text: "Click here",
      html: "<p>Click here</p>",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["html"]).toBe("<p>Click here</p>");
  });

  it("throws on a non-2xx response, without leaking the response body", async () => {
    fetchMock.mockResolvedValue(new Response("sensitive body", { status: 422 }));
    const adapter = new ResendEmailAdapter({ apiKey: "re_test_key", from: "no-reply@example.com" });

    await expect(
      adapter.send({ to: "person@example.com", subject: "Sign in", text: "Click here" }),
    ).rejects.toThrow(/422/);
  });

  it("propagates a network failure", async () => {
    fetchMock.mockRejectedValue(new Error("network unreachable"));
    const adapter = new ResendEmailAdapter({ apiKey: "re_test_key", from: "no-reply@example.com" });

    await expect(
      adapter.send({ to: "person@example.com", subject: "Sign in", text: "Click here" }),
    ).rejects.toThrow(/network unreachable/);
  });
});
