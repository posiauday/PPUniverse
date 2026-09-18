import { describe, expect, it } from "vitest";
import { parseClamdResponse } from "./clamav-scan-adapter.js";

describe("parseClamdResponse", () => {
  it("recognizes a clean verdict", () => {
    expect(parseClamdResponse("stream: OK")).toEqual({ verdict: "clean" });
  });

  it("recognizes an infected verdict and extracts the signature", () => {
    expect(parseClamdResponse("stream: Eicar-Test-Signature FOUND")).toEqual({
      verdict: "infected",
      signature: "Eicar-Test-Signature",
    });
  });

  it("treats an unrecognized response as an error rather than silently passing", () => {
    expect(parseClamdResponse("stream: ERROR something broke")).toEqual({
      verdict: "error",
      message: "stream: ERROR something broke",
    });
  });

  it("treats an empty response as an error", () => {
    expect(parseClamdResponse("")).toEqual({
      verdict: "error",
      message: "empty response from clamd",
    });
  });
});
