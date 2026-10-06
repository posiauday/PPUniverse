import Link from "next/link";

/** Shown when an emailed /password/* link arrives without a usable token (MVP-036). */
export function IncompleteLink({ retryHref, retryText }: { retryHref: string; retryText: string }) {
  return (
    <main className="[overflow-wrap:anywhere]">
      <h1>This link is incomplete</h1>
      <p>
        The link may have been cut off by your email app. <Link href={retryHref}>{retryText}</Link>.
      </p>
    </main>
  );
}
