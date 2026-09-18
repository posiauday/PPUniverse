import { describe, expect, it } from "vitest";
import { getCorrelationId, runWithCorrelationId } from "./correlation.js";

describe("correlation context", () => {
  it("is undefined outside any scope", () => {
    expect(getCorrelationId()).toBeUndefined();
  });

  it("mints a new ID when none is provided", () => {
    runWithCorrelationId(() => {
      expect(getCorrelationId()).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  it("reuses a provided ID instead of minting a new one", () => {
    runWithCorrelationId(() => {
      expect(getCorrelationId()).toBe("fixed-id-123");
    }, "fixed-id-123");
  });

  it("propagates across an async call chain", async () => {
    await runWithCorrelationId(async () => {
      const id = getCorrelationId();
      await new Promise((resolve) => setTimeout(resolve, 1));
      expect(getCorrelationId()).toBe(id);
    }, "async-id");
  });

  it("does not leak between concurrent scopes", async () => {
    const results = await Promise.all([
      runWithCorrelationId(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return getCorrelationId();
      }, "scope-a"),
      runWithCorrelationId(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return getCorrelationId();
      }, "scope-b"),
    ]);
    expect(results).toEqual(["scope-a", "scope-b"]);
  });
});
