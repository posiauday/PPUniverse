import { PrismaPrivacyRepository } from "@ppu/adapter-privacy";
import { prisma } from "@ppu/db";
import { currentDeletionRequestState } from "@ppu/domain-privacy";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { SITE_NAME } from "../../../lib/seo/site";
import { ConsentToggle } from "./ConsentToggle";
import { DeletionRequestPanel } from "./DeletionRequestPanel";

// Authenticated, self-service account content: not indexed, same as every
// other /account page (root layout's default noindex is inherited).
export const metadata: Metadata = { title: `Privacy | ${SITE_NAME}` };

export default async function AccountPrivacyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const repository = new PrismaPrivacyRepository(prisma);
  const [currentConsent, latestRequest] = await Promise.all([
    repository.getCurrentConsent(session.user.id),
    repository.getLatestDeletionRequestForUser(session.user.id),
  ]);

  const termsConsent = currentConsent.find((c) => c.category === "TERMS_OF_SERVICE") ?? null;
  const marketingConsent = currentConsent.find((c) => c.category === "MARKETING_EMAIL") ?? null;
  const requestState = latestRequest ? currentDeletionRequestState(latestRequest) : null;
  const deniedReason =
    requestState === "DENIED" ? (latestRequest?.events.at(-1)?.reason ?? null) : null;

  const dateLabel = (date: Date) =>
    new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);

  return (
    <main>
      <h1>Privacy</h1>
      <p>Signed in as {session.user.email}.</p>

      <section aria-labelledby="consent-heading">
        <h2 id="consent-heading">Consent</h2>
        {/* MVP-032: the Terms being accepted are now a real page. */}
        <p>
          Read the <Link href="/terms">Terms of use</Link> and the{" "}
          <Link href="/privacy">Privacy notice</Link>.
        </p>
        {termsConsent ? (
          <p>Terms of use accepted {dateLabel(termsConsent.recordedAt)}.</p>
        ) : (
          <ConsentToggle category="TERMS_OF_SERVICE" label="the Terms of use" granted={false} />
        )}
        <ConsentToggle
          category="MARKETING_EMAIL"
          label="marketing email"
          granted={marketingConsent?.granted ?? false}
        />
      </section>

      <section aria-labelledby="deletion-heading">
        <h2 id="deletion-heading">Account deletion</h2>
        <p>Submitting a request records it for review. It does not delete anything by itself.</p>
        <DeletionRequestPanel
          requestId={latestRequest?.id ?? null}
          state={requestState}
          deniedReason={deniedReason}
        />
      </section>
    </main>
  );
}
