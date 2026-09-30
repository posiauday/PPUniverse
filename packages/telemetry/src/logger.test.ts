import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runWithCorrelationId } from "./correlation.js";
import { logger } from "./logger.js";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("writes info/debug as a JSON line on stdout with the expected shape", () => {
    logger.info("test.event", { foo: "bar" });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(entry).toMatchObject({ level: "info", event: "test.event", foo: "bar" });
    expect(typeof entry.timestamp).toBe("string");
  });

  it("writes warn/error as a JSON line on stderr", () => {
    logger.error("test.error", {});
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("attaches the current correlation ID automatically", () => {
    runWithCorrelationId(() => {
      logger.info("scoped.event");
    }, "corr-abc");
    const entry = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(entry.correlationId).toBe("corr-abc");
  });

  it("redacts sensitive fields before serializing", () => {
    logger.info("login.attempt", { password: "hunter2", userId: "u1" });
    const entry = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(entry.password).toBe("[REDACTED]");
    expect(entry.userId).toBe("u1");
  });
});
