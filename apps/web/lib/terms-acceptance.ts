import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { sameSitePath } from "./same-site-path";

/**
 * Accepting the Terms of use and the Privacy notice when an account is made
 * (docs/final-decisions.md, 2026-10-08, "Accounts accept the Terms when they're
 * made"). One record, the existing TERMS_OF_SERVICE consent, always tied to the
 * current Terms version on the server, never one sent by the browser.
 */
export async function recordTermsAcceptance(
  userId: string,
): Promise<{ policyVersionId: string | null }> {
  const current = await prisma.policyVersion.findFirst({
    where: { documentType: "TERMS_OF_SERVICE" },
    orderBy: { effectiveAt: "desc" },
  });
  const record = await new PrismaPrivacyRepository(prisma).recordConsent({
    userId,
    category: "TERMS_OF_SERVICE",
    granted: true,
    policyVersionId: current?.id ?? null,
  });
  return { policyVersionId: record.policyVersionId };
}

/** Whether the reader's latest Terms decision is an acceptance. */
export async function hasAcceptedTerms(userId: string): Promise<boolean> {
  const latest = await prisma.consentRecord.findFirst({
    where: { userId, category: "TERMS_OF_SERVICE" },
    orderBy: { recordedAt: "desc" },
    select: { granted: true },
  });
  return latest?.granted === true;
}

/**
 * A path on this site to continue to after accepting; anything else, including
 * a repeated callbackUrl, goes to the account page (site review, 2026-10-10:
 * the same rule as the sign-in page, so "/%09/host" can't redirect away).
 */
export function safeContinuePath(value: unknown): string {
  return sameSitePath(value) ?? "/account";
}
