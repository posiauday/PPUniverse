import { describe, expect, it } from "vitest";
import { continuePath, SIGNED_IN_PATH } from "./password-client";

describe("continuePath (BUG-040)", () => {
  it("goes back to the page on this site that asked the reader to sign in", () => {
    expect(continuePath("?callbackUrl=%2Fcomponents%2Fnavigation-shell")).toBe(
      "/components/navigation-shell",
    );
    expect(continuePath("?callbackUrl=%2Fguides%2Ffix-delegation%3Fx%3D1%23comments")).toBe(
      "/guides/fix-delegation?x=1#comments",
    );
  });

  it("falls back to the account without a path on this site", () => {
    expect(continuePath("")).toBe(SIGNED_IN_PATH);
    expect(continuePath("?callbackUrl=")).toBe(SIGNED_IN_PATH);
    expect(continuePath("?callbackUrl=https%3A%2F%2Fevil.example")).toBe(SIGNED_IN_PATH);
    expect(continuePath("?callbackUrl=%2F%2Fevil.example")).toBe(SIGNED_IN_PATH);
    expect(continuePath("?callbackUrl=%2F%5Cevil.example")).toBe(SIGNED_IN_PATH);
    expect(continuePath("?callbackUrl=javascript%3Aalert(1)")).toBe(SIGNED_IN_PATH);
  });

  it("never sends the reader back to the sign-in page", () => {
    expect(continuePath("?callbackUrl=%2Fsignin")).toBe(SIGNED_IN_PATH);
    expect(continuePath("?callbackUrl=%2Fsignin%3FcallbackUrl%3D%2Faccount")).toBe(SIGNED_IN_PATH);
  });
});
