import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { describe, expect, it, vi } from "vitest";
import {
  accountWithoutTokens,
  googleCredentials,
  googleEmailVerified,
  profileFromGoogle,
  withoutStoredTokens,
} from "./google-auth";

const ACCOUNT: AdapterAccount = {
  userId: "u1",
  type: "oauth",
  provider: "google",
  providerAccountId: "123",
  access_token: "secret-access",
  refresh_token: "secret-refresh",
  id_token: "secret-id",
  expires_at: 1,
  token_type: "Bearer",
  scope: "openid email profile",
};

describe("Google sign-in (MVP-035)", () => {
  it("is on only when both the client id and secret are set", () => {
    expect(googleCredentials({})).toBeNull();
    expect(googleCredentials({ GOOGLE_CLIENT_ID: "id" })).toBeNull();
    expect(googleCredentials({ GOOGLE_CLIENT_SECRET: "s" })).toBeNull();
    expect(googleCredentials({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s" })).toEqual({
      clientId: "id",
      clientSecret: "s",
    });
  });

  it("keeps only the Google id, email and name, never the photo", () => {
    expect(
      profileFromGoogle({ sub: "123", email: "a@example.com", name: "Ada", picture: "x" } as never),
    ).toEqual({ id: "123", email: "a@example.com", name: "Ada" });
    expect(profileFromGoogle({ sub: "1", email: "b@example.com" })).toEqual({
      id: "1",
      email: "b@example.com",
      name: null,
    });
  });

  // Site review, 2026-10-10.
  it("lowercases the email like every other sign-in", () => {
    expect(profileFromGoogle({ sub: "2", email: " Avery@Contoso.com " }).email).toBe(
      "avery@contoso.com",
    );
  });

  it("signs in with Google only when Google verified the email", () => {
    const google = { provider: "google" };
    expect(googleEmailVerified(google, { email_verified: true })).toBe(true);
    expect(googleEmailVerified(google, { email_verified: false })).toBe(false);
    expect(googleEmailVerified(google, { email_verified: "true" })).toBe(false);
    expect(googleEmailVerified(google, {})).toBe(false);
    expect(googleEmailVerified(google, undefined)).toBe(false);
    expect(googleEmailVerified({ provider: "email" }, undefined)).toBe(true);
    expect(googleEmailVerified(null, undefined)).toBe(true);
  });

  it("never stores Google's tokens when linking an account", async () => {
    expect(accountWithoutTokens(ACCOUNT)).toEqual({
      userId: "u1",
      type: "oauth",
      provider: "google",
      providerAccountId: "123",
    });
    const linkAccount = vi.fn();
    await withoutStoredTokens({ linkAccount } as unknown as Adapter).linkAccount?.(ACCOUNT);
    expect(linkAccount).toHaveBeenCalledWith(accountWithoutTokens(ACCOUNT));
  });
});
