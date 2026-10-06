import type { Metadata } from "next";
import { SITE_NAME } from "../../../lib/seo/site";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: `Forgot your password? | ${SITE_NAME}` };

/** Ask for a link to set a new password (MVP-036). */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
