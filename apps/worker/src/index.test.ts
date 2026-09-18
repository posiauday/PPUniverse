import { describe, expect, it } from "vitest";
import { describeWorker } from "./index.js";

describe("describeWorker", () => {
  it("returns a boot-readiness message", () => {
    expect(describeWorker()).toBe("worker process ready");
  });
});
