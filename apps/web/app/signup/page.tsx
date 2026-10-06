import type { Metadata } from "next";
import { SITE_NAME } from "../../lib/seo/site";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: `Create an account | ${SITE_NAME}` };

/** Create an account with an email and password (MVP-036). */
export default function SignUpPage() {
  return <SignUpForm />;
}
