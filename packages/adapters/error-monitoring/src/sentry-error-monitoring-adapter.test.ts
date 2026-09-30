import { beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.fn();
const captureException = vi.fn();
const captureMessage = vi.fn();

vi.mock("@sentry/node", () => ({
  init: (...args: unknown[]) => init(...args),
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

const { SentryErrorMonitoringAdapter } = await import("./sentry-error-monitoring-adapter.js");

describe("SentryErrorMonitoringAdapter", () => {
  beforeEach(() => {
    init.mockClear();
    captureException.mockClear();
    captureMessage.mockClear();
  });

  it("initializes the SDK with the given config and disables default PII collection", () => {
    new SentryErrorMonitoringAdapter({ dsn: "https://fake@sentry.example/1", environment: "test" });
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://fake@sentry.example/1",
        environment: "test",
        sendDefaultPii: false,
      }),
    );
  });

  it("passes correlationId as a tag, not as free-form extra data", () => {
    const adapter = new SentryErrorMonitoringAdapter({
      dsn: "https://fake@sentry.example/1",
      environment: "test",
    });
    adapter.captureException(new Error("boom"), { correlationId: "c1", userId: "u1" });
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { correlationId: "c1" }, extra: { userId: "u1" } }),
    );
  });

  it("redacts sensitive context fields before handing them to the SDK", () => {
    const adapter = new SentryErrorMonitoringAdapter({
      dsn: "https://fake@sentry.example/1",
      environment: "test",
    });
    adapter.captureException(new Error("boom"), { token: "secret-value" });
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: { token: "[REDACTED]" } }),
    );
  });

  it("forwards captureMessage with its level", () => {
    const adapter = new SentryErrorMonitoringAdapter({
      dsn: "https://fake@sentry.example/1",
      environment: "test",
    });
    adapter.captureMessage("odd", "warning", { correlationId: "c2" });
    expect(captureMessage).toHaveBeenCalledWith(
      "odd",
      expect.objectContaining({ level: "warning", tags: { correlationId: "c2" } }),
    );
  });
});
