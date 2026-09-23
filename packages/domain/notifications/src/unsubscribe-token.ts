import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A stateless, signed unsubscribe link token (MVP-018, question 5 of the
 * pre-work analysis; docs/final-decisions.md, "MVP-018 open question 49"
 * approves the rest of the design without amendment). No database table:
 * the token itself carries everything needed to verify it, signed with
 * EMAIL_UNSUBSCRIBE_SECRET (a dedicated secret — never NEXTAUTH_SECRET,
 * which exists for a different purpose).
 *
 * Scope, by construction: verifying a token yields exactly one thing it is
 * allowed to do — act on the one (userId, category) pair baked into it.
 * category is hardcoded to MARKETING_EMAIL, the only real optional
 * category (MVP-020) — a decoded token naming anything else is rejected
 * outright, even though nothing else is ever minted today.
 *
 * Every failure mode (bad signature, expired, malformed, wrong category)
 * returns the identical `null` — the caller renders one generic "this link
 * is no longer valid" message regardless of which occurred, so this can
 * never be used to enumerate addresses or reveal whether one is registered
 * (there is no address-shaped input anywhere in this module at all).
 */

const MARKETING_EMAIL_CATEGORY = "MARKETING_EMAIL" as const;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface UnsubscribeTokenPayload {
  userId: string;
  category: typeof MARKETING_EMAIL_CATEGORY;
  exp: number;
}

export interface VerifiedUnsubscribeToken {
  userId: string;
  category: typeof MARKETING_EMAIL_CATEGORY;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

/** Reversible, tunable default — not stored anywhere, so changing it later needs no migration. */
export function mintUnsubscribeToken(
  userId: string,
  secret: string,
  now: Date = new Date(),
  ttlMs: number = THIRTY_DAYS_MS,
): string {
  const payload: UnsubscribeTokenPayload = {
    userId,
    category: MARKETING_EMAIL_CATEGORY,
    exp: Math.floor((now.getTime() + ttlMs) / 1000),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): VerifiedUnsubscribeToken | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload, secret);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  // Length check first: timingSafeEqual throws on mismatched lengths rather
  // than returning false, and a length mismatch is itself not a secret
  // worth timing-protecting (the encoded signature length is fixed).
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as Partial<UnsubscribeTokenPayload>).userId !== "string" ||
    (decoded as Partial<UnsubscribeTokenPayload>).category !== MARKETING_EMAIL_CATEGORY ||
    typeof (decoded as Partial<UnsubscribeTokenPayload>).exp !== "number"
  ) {
    return null;
  }

  const payload = decoded as UnsubscribeTokenPayload;
  if (payload.exp * 1000 < now.getTime()) {
    return null;
  }

  return { userId: payload.userId, category: MARKETING_EMAIL_CATEGORY };
}
