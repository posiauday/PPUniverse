import type { Adapter, AdapterAccount } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";

/**
 * Google sign-in (MVP-035; docs/final-decisions.md, 2026-10-06, "Sign-in
 * methods"). On only when both values are set in the environment, so local
 * development, CI and deploy previews without them keep working with the
 * email link alone.
 */
export function googleCredentials(
  env: Record<string, string | undefined> = process.env,
): { clientId: string; clientSecret: string } | null {
  const clientId = env["GOOGLE_CLIENT_ID"];
  const clientSecret = env["GOOGLE_CLIENT_SECRET"];
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** What we keep from a Google profile: its stable id, email and name. */
export function profileFromGoogle(profile: { sub: string; email: string; name?: string | null }): {
  id: string;
  email: string;
  name: string | null;
} {
  // No photo: the users table has no image column, and we don't need one.
  // Lowercased like every other sign-in, so one person is one account (site review, 2026-10-10).
  return { id: profile.sub, email: profile.email.trim().toLowerCase(), name: profile.name ?? null };
}

export function googleProvider(credentials: { clientId: string; clientSecret: string }) {
  return GoogleProvider({
    ...credentials,
    // Google verifies the email address it returns, so signing in with Google
    // may attach to an existing account with the same email (someone who
    // signed up with the email link). Auth.js allows this per provider, for
    // providers that verify emails.
    allowDangerousEmailAccountLinking: true,
    profile: profileFromGoogle,
  });
}

/**
 * The accounts row keeps only who the Google account is, never Google's
 * access, refresh or ID tokens: the site never calls Google on anyone's
 * behalf, so storing them would only add risk (data minimisation).
 */
export function accountWithoutTokens(account: AdapterAccount): AdapterAccount {
  return {
    userId: account.userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
  };
}

/** Wraps the Prisma adapter so linking an account never stores tokens. */
export function withoutStoredTokens(adapter: Adapter): Adapter {
  const link = adapter.linkAccount;
  if (!link) return adapter;
  return {
    ...adapter,
    linkAccount: (account: AdapterAccount) => link(accountWithoutTokens(account)),
  };
}

/**
 * Google may only sign someone in when it has verified their email (site
 * review, 2026-10-10). Linking a Google sign-in to an existing account with
 * the same email (allowDangerousEmailAccountLinking) is only safe for a
 * verified address; without this, a Google account carrying someone else's
 * unverified address could sign in as them. Other providers pass.
 */
export function googleEmailVerified(
  account: { provider?: string } | null | undefined,
  profile: unknown,
): boolean {
  if (account?.provider !== "google") return true;
  return (profile as { email_verified?: unknown } | undefined)?.email_verified === true;
}
