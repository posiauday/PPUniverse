import type { Metadata } from "next";
import { linkToken } from "../../../lib/password-client";
import { SITE_NAME } from "../../../lib/seo/site";
import { IncompleteLink } from "../IncompleteLink";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: `Choose a new password | ${SITE_NAME}` };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Where the "set your password" email's link lands (MVP-036). Opening it
 * changes nothing; the token is spent only when a new password is saved.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const token = linkToken(await searchParams);
  if (!token) return <IncompleteLink retryHref="/password/forgot" retryText="Request a new link" />;
  return <ResetPasswordForm token={token} />;
}
