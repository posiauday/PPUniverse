import type { Metadata } from "next";
import Link from "next/link";
import { verifyUnsubscribeLinkToken } from "../../lib/unsubscribe";
import { SITE_NAME } from "../../lib/seo/site";
import { UnsubscribeConfirmButton } from "./UnsubscribeConfirmButton";

interface UnsubscribePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// Not session-based on purpose (MVP-018, question 5 of the pre-work
// analysis): authorization is possession of a valid, unexpired, correctly
// scoped token, nothing else. Utility page, inherits the root layout's
// default noindex.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: `Unsubscribe | ${SITE_NAME}` };
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams;
  const token = params["token"];
  const verified = token ? verifyUnsubscribeLinkToken(token) : null;

  return (
    <main>
      <h1>Unsubscribe</h1>
      {verified && token ? (
        <>
          <p>Unsubscribe this account from marketing email?</p>
          <UnsubscribeConfirmButton token={token} />
        </>
      ) : (
        // Identical wording regardless of why verification failed (missing,
        // malformed, expired, tampered, wrong category) — never discloses
        // which occurred (docs/final-decisions.md, "MVP-018 open question 49").
        <p>This link is no longer valid.</p>
      )}
      {/* A way out of this otherwise dead-end page, matching the
          established pattern for the 404 page (BUG-008, WCAG 2.4.1) —
          found while testing this state's own keyboard traversal: neither
          the denied message nor the post-confirmation status text has any
          other focusable control. inline-block + vertical padding: found
          while running the real accessibility scan — a bare inline text
          link's own clickable box was under the WCAG 2.5.8 24px minimum
          target size at this line height. */}
      <p>
        <Link href="/" className="inline-block py-2">
          Back to the home page
        </Link>
      </p>
    </main>
  );
}
