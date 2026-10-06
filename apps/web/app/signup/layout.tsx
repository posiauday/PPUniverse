import type { ReactNode } from "react";
import { AuthFrame } from "../AuthFrame";

/** /signup (MVP-036) in the shared Daylight card. */
export default function SignUpLayout({ children }: { children: ReactNode }) {
  return <AuthFrame panelTitle="Confirm your email">{children}</AuthFrame>;
}
