import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { SITE_NAME } from "../../../lib/seo/site";
import { hasAcceptedTerms, safeContinuePath } from "../../../lib/terms-acceptance";
import { AcceptTermsForm } from "./AcceptTermsForm";

export const metadata: Metadata = { title: `Welcome | ${SITE_NAME}` };

export const dynamic = "force-dynamic";

/**
 * The first page of a new account made with an emailed link or Google
 * (docs/final-decisions.md, 2026-10-08, "Accounts accept the Terms when
 * they're made"): agree to the Terms of use and the Privacy notice, then go on
 * to where they were headed. Anyone who has already agreed goes straight on.
 * Sign-ups with a password agree on the sign-up form instead.
 */
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const next = safeContinuePath((await searchParams).callbackUrl);
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent("/account/welcome")}`);
  if (await hasAcceptedTerms(session.user.id)) redirect(next);

  return (
    <main>
      <h1>Welcome to {SITE_NAME}</h1>
      <p>
        One step before you start: please read the <Link href="/terms">Terms of use</Link> and the{" "}
        <Link href="/privacy">Privacy notice</Link>, and agree to them.
      </p>
      <AcceptTermsForm next={next} />
    </main>
  );
}
