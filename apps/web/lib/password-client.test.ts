import { describe, expect, it } from "vitest";
import { continuePath, SIGNED_IN_PATH } from "./password-client";

const SITE = "https://www.example.test";
const go = (search: string) => continuePath(search, SITE);

describe("continuePath (BUG-040)", () => {
  it("goes back to the page on this site that asked the reader to sign in", () => {
    expect(go("?callbackUrl=%2Fcomponents%2Fnavigation-shell")).toBe(
      "/components/navigation-shell",
    );
    expect(go("?callbackUrl=%2Fguides%2Ffix-delegation%3Fx%3D1%23comments")).toBe(
      "/guides/fix-delegation?x=1#comments",
    );
  });

  it("falls back to the account without a path on this site", () => {
    expect(go("")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=https%3A%2F%2Fevil.example")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=%2F%2Fevil.example")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=%2F%5Cevil.example")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=javascript%3Aalert(1)")).toBe(SIGNED_IN_PATH);
  });

  it("refuses addresses a browser would read as another site", () => {
    // A slash, a tab or newline and a slash: browsers drop the tab and read "//evil.example".
    expect(go("?callbackUrl=%2F%09%2Fevil.example")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=%2F%0A%2Fevil.example")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=%2F%5C%5Cevil.example")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=%2F%2F%2Fevil.example")).toBe(SIGNED_IN_PATH);
  });

  it("never sends the reader back to the sign-in page", () => {
    expect(go("?callbackUrl=%2Fsignin")).toBe(SIGNED_IN_PATH);
    expect(go("?callbackUrl=%2Fsignin%3FcallbackUrl%3D%2Faccount")).toBe(SIGNED_IN_PATH);
  });
});
