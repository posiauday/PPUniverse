import { describe, expect, it } from "vitest";
import { CONFIRM_PATH, confirmFormFields, confirmLinkFrom } from "./signin-confirm";

const CALLBACK =
  "https://lowcodestacks.com/api/auth/callback/email?callbackUrl=https%3A%2F%2Flowcodestacks.com%2Fguides&token=abc123&email=a%40example.com";

describe("confirmLinkFrom (MVP-034)", () => {
  it("points the email at the confirmation page on the same origin, keeping the three fields", () => {
    const link = new URL(confirmLinkFrom(CALLBACK));
    expect(link.origin).toBe("https://lowcodestacks.com");
    expect(link.pathname).toBe(CONFIRM_PATH);
    expect(link.searchParams.get("token")).toBe("abc123");
    expect(link.searchParams.get("email")).toBe("a@example.com");
    expect(link.searchParams.get("callbackUrl")).toBe("https://lowcodestacks.com/guides");
  });

  it("drops anything that isn't one of the three fields", () => {
    const link = new URL(confirmLinkFrom(`${CALLBACK}&extra=1`));
    expect(link.searchParams.has("extra")).toBe(false);
  });
});

describe("confirmFormFields (MVP-034)", () => {
  it("returns only known, single-valued fields", () => {
    expect(
      confirmFormFields({ token: "t", email: "a@example.com", callbackUrl: "/guides", other: "x" }),
    ).toEqual({ token: "t", email: "a@example.com", callbackUrl: "/guides" });
    expect(
      confirmFormFields({ token: "t", email: "a@example.com", callbackUrl: ["/a", "/b"] }),
    ).toEqual({ token: "t", email: "a@example.com" });
  });

  it("is null without a token or an email, so the page asks for a new link", () => {
    expect(confirmFormFields({ email: "a@example.com" })).toBeNull();
    expect(confirmFormFields({ token: "t" })).toBeNull();
    expect(confirmFormFields({ token: "", email: "a@example.com" })).toBeNull();
  });
});
