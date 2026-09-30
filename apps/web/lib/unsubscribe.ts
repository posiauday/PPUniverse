import {
  mintUnsubscribeToken,
  verifyUnsubscribeToken,
  type VerifiedUnsubscribeToken,
} from "@ppu/domain-notifications";

/**
 * EMAIL_UNSUBSCRIBE_SECRET is dedicated — never NEXTAUTH_SECRET, which
 * exists for a different purpose (docs/final-decisions.md, "MVP-018 open
 * question 49"). Verification fails safely (every call returns null, the
 * same outcome as an invalid token) when the secret is absent, rather than
 * throwing — consistent with this story's "never fail to start" stance on
 * missing configuration.
 */
const secret = process.env["EMAIL_UNSUBSCRIBE_SECRET"];

export function mintUnsubscribeLinkToken(userId: string): string {
  if (!secret) {
    throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not configured");
  }
  return mintUnsubscribeToken(userId, secret);
}

export function verifyUnsubscribeLinkToken(token: string): VerifiedUnsubscribeToken | null {
  if (!secret) return null;
  return verifyUnsubscribeToken(token, secret);
}
