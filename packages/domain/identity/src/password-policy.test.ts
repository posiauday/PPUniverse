import { describe, expect, it } from "vitest";
import { checkPasswordLocally, MAX_PASSWORD_LENGTH } from "./password-policy.js";

const context = { email: "sam.rivers@example.com", siteName: "LowCodeStacks" };

describe("checkPasswordLocally", () => {
  it("accepts a long passphrase with no special characters", () => {
    expect(checkPasswordLocally("green flows run on monday", context)).toEqual([]);
  });

  it("needs 12 characters, counted as a person would (emoji and accents are one each)", () => {
    expect(checkPasswordLocally("short pass", context)).toEqual(["too-short"]);
    expect(checkPasswordLocally("ÉéÉéÉéÉéÉéÉé", context)).toEqual([]);
    expect(checkPasswordLocally("🌿🌿🌿🌿🌿🌿🌿🌿🌿🌿🌿🌱", context)).toEqual([]);
  });

  it("allows up to 128 characters", () => {
    expect(checkPasswordLocally("a".repeat(MAX_PASSWORD_LENGTH - 1) + "b", context)).toEqual([]);
    expect(checkPasswordLocally("ab".repeat(MAX_PASSWORD_LENGTH), context)).toEqual(["too-long"]);
  });

  it("refuses the email's name part, the site name and one repeated character", () => {
    expect(checkPasswordLocally("my name is sam.rivers ok", context)).toEqual([
      "contains-email-name",
    ]);
    expect(checkPasswordLocally("I love Low Code Stacks!", context)).toEqual([
      "contains-site-name",
    ]);
    expect(checkPasswordLocally("zzzzzzzzzzzzzz", context)).toEqual(["one-repeated-character"]);
  });

  it("ignores a very short email name, which would block too much", () => {
    expect(
      checkPasswordLocally("bob builds big flows", { ...context, email: "bob@example.com" }),
    ).toEqual([]);
  });
});
