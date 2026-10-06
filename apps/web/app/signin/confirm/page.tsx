import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "../../../lib/seo/site";
import { EMAIL_CALLBACK_PATH, confirmFormFields } from "../../../lib/signin-confirm";

export const metadata: Metadata = { title: `Confirm sign-in | ${SITE_NAME}` };

interface ConfirmPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Where the emailed sign-in link lands (MVP-034). Opening it signs no one in:
 * the "Sign me in" button submits the one-time token to Auth.js. Email link
 * scanners open links but don't submit forms, so they can't use the link up
 * (lib/signin-confirm.ts). The token stays in the address bar, as it did
 * before, and the site-wide Referrer-Policy keeps it out of other sites' logs.
 */
export default async function ConfirmSignInPage({ searchParams }: ConfirmPageProps) {
  const fields = confirmFormFields(await searchParams);
  if (!fields) {
    return (
      <main className="[overflow-wrap:anywhere]">
        <h1>This sign-in link is incomplete</h1>
        <p>
          The link may have been cut off by your email app.{" "}
          <Link href="/signin">Request a new sign-in link</Link>.
        </p>
      </main>
    );
  }
  return (
    <main className="[overflow-wrap:anywhere]">
      <h1>Sign in to {SITE_NAME}</h1>
      <p>
        You&rsquo;re signing in as <strong>{fields.email}</strong>. Press the button to finish. The
        link works once.
      </p>
      <form action={EMAIL_CALLBACK_PATH} method="get">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button type="submit">Sign me in</button>
      </form>
      <p>
        Not you, or didn&rsquo;t ask to sign in? You can close this page; nothing happens until the
        button is pressed.
      </p>
    </main>
  );
}
