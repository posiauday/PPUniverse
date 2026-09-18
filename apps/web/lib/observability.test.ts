import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const captureException = vi.fn();

vi.mock("./error-monitoring", () => ({
  errorMonitoring: { captureException, captureMessage: vi.fn() },
}));

const { withObservability } = await import("./observability");

describe("withObservability", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    captureException.mockClear();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("passes through a successful response unchanged and logs start/end", async () => {
    const handler = vi.fn(async () => new Response(null, { status: 204 }));
    const wrapped = withObservability("TEST /route", handler);
    const request = new Request("https://example.test/route");

    const response = await wrapped(request);

    expect(response.status).toBe(204);
    expect(handler).toHaveBeenCalledWith(request);
    const events = logSpy.mock.calls.map((call: unknown[]) => JSON.parse(call[0] as string).event);
    expect(events).toEqual(["request.start", "request.end"]);
  });

  it("mints a correlation ID when no inbound header is present", async () => {
    const handler = vi.fn(async () => new Response(null, { status: 200 }));
    const wrapped = withObservability("TEST /route", handler);
    await wrapped(new Request("https://example.test/route"));

    const entry = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(entry.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reuses an inbound x-correlation-id header instead of minting a new one", async () => {
    const handler = vi.fn(async () => new Response(null, { status: 200 }));
    const wrapped = withObservability("TEST /route", handler);
    await wrapped(
      new Request("https://example.test/route", { headers: { "x-correlation-id": "inbound-123" } }),
    );

    const entry = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(entry.correlationId).toBe("inbound-123");
  });

  it("captures an unhandled exception, logs it, and returns a 500 error envelope", async () => {
    const handler = vi.fn(async () => {
      throw new Error("boom");
    });
    const wrapped = withObservability("TEST /route", handler);
    const response = await wrapped(new Request("https://example.test/route"));

    expect(response.status).toBe(500);
    const body: { code: string; correlationId: string } = await response.json();
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(errorSpy).toHaveBeenCalled();
  });
});
