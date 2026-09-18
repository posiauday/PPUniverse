import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleErrorMonitoringAdapter } from "./console-error-monitoring-adapter.js";

describe("ConsoleErrorMonitoringAdapter", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("logs an exception with its message and stack", () => {
    const adapter = new ConsoleErrorMonitoringAdapter();
    adapter.captureException(new Error("boom"), { correlationId: "c1" });
    const entry = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(entry.message).toBe("boom");
    expect(entry.correlationId).toBe("c1");
    expect(typeof entry.stack).toBe("string");
  });

  it("redacts sensitive context fields", () => {
    const adapter = new ConsoleErrorMonitoringAdapter();
    adapter.captureException(new Error("boom"), { token: "secret-value" });
    const entry = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(entry.token).toBe("[REDACTED]");
  });

  it("logs a plain message with its level", () => {
    const adapter = new ConsoleErrorMonitoringAdapter();
    adapter.captureMessage("something odd", "warning", { correlationId: "c2" });
    const entry = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(entry.message).toBe("something odd");
    expect(entry.level).toBe("warning");
  });
});
