import { describe, expect, it } from "vitest";
import { EICAR_TEST_STRING, FakeScanAdapter } from "./fake-scan-adapter.js";

describe("FakeScanAdapter", () => {
  it("flags the EICAR test string as infected", async () => {
    const adapter = new FakeScanAdapter();
    const result = await adapter.scan(Buffer.from(EICAR_TEST_STRING, "utf8"));
    expect(result).toEqual({ verdict: "infected", signature: "Eicar-Test-Signature" });
  });

  it("treats ordinary content as clean", async () => {
    const adapter = new FakeScanAdapter();
    const result = await adapter.scan(Buffer.from("just a normal file", "utf8"));
    expect(result).toEqual({ verdict: "clean" });
  });
});
