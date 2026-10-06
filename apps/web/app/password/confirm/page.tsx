import type { Metadata } from "next";
import { linkToken } from "../../../lib/password-client";
import { SITE_NAME } from "../../../lib/seo/site";
import { IncompleteLink } from "../IncompleteLink";
import { ConfirmSignUpForm } from "./ConfirmSignUpForm";

export const metadata: Metadata = { title: `Confirm your email | ${SITE_NAME}` };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Where the sign-up email's link lands (MVP-036). Like /signin/confirm,
 * opening it does nothing: the "Confirm" button sends the one-time token, so
 * email link scanners can't use it up.
 */
export default async function ConfirmSignUpPage({ searchParams }: PageProps) {
  const token = linkToken(await searchParams);
  if (!token) return <IncompleteLink retryHref="/signup" retryText="Start again" />;
  return <ConfirmSignUpForm token={token} />;
}
