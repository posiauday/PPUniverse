"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SIGNED_IN_PATH, postPasswordApi } from "../../../lib/password-client";
import { PasswordField } from "../../PasswordField";

/**
 * Choose a new password from an emailed link (MVP-036). Saving it signs out
 * every other device, then signs this browser in.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [deadLink, setDeadLink] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (errorCount > 0) passwordRef.current?.focus();
  }, [errorCount]);
  // A dead link replaces the form, so focus moves to the new heading instead of the body.
  useEffect(() => {
    if (deadLink) headingRef.current?.focus();
  }, [deadLink]);

  function fail(messages: string[]) {
    setErrors(messages);
    setErrorCount((count) => count + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!password) return fail(["Choose a password."]);
    setBusy(true);
    const answer = await postPasswordApi("reset", { token, password });
    if (answer.status === 200) {
      window.location.assign(SIGNED_IN_PATH);
      return;
    }
    setBusy(false);
    if (answer.error === "invalid-link") setDeadLink(true);
    else if (answer.error === "weak-password" && answer.problems?.length) fail(answer.problems);
    else fail(["Something went wrong saving your password. Please try again."]);
  }

  if (deadLink) {
    return (
      <main className="[overflow-wrap:anywhere]">
        <h1 ref={headingRef} tabIndex={-1}>
          This link has expired or was already used
        </h1>
        <p>
          Links work once and expire after 1 hour.{" "}
          <Link href="/password/forgot">Request a new link</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="[overflow-wrap:anywhere]">
      <h1>Choose a new password</h1>
      <p>Saving it signs you out on every other device, then signs you in here.</p>
      <form onSubmit={handleSubmit} noValidate>
        <PasswordField
          ref={passwordRef}
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint="At least 12 characters. A few unrelated words make a strong password that is easy to remember."
          error={errors}
        />
        <button type="submit" aria-disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
