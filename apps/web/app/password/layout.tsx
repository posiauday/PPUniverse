import type { ReactNode } from "react";
import { AuthFrame } from "../AuthFrame";

/** /password/* (MVP-036): confirm a new account, or set a password, in the shared Daylight card. */
export default function PasswordLayout({ children }: { children: ReactNode }) {
  return <AuthFrame panelTitle="Your password link">{children}</AuthFrame>;
}
