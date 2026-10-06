"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SIGNED_IN_PATH, postPasswordApi } from "../../../lib/password-client";
import { SITE_NAME } from "../../../lib/seo/site";

/** The "Confirm" button for a new account (MVP-036). */
export function ConfirmSignUpForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<"invalid" | "failed" | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // A dead link replaces the button, so focus moves to the new heading instead of the body.
  useEffect(() => {
    if (problem === "invalid") headingRef.current?.focus();
  }, [problem]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const answer = await postPasswordApi("confirm", { token });
    if (answer.status === 200) {
      window.location.assign(SIGNED_IN_PATH);
      return;
    }
    setBusy(false);
    setProblem(answer.error === "invalid-link" ? "invalid" : "failed");
  }

  if (problem === "invalid") {
    return (
      <main className="[overflow-wrap:anywhere]">
        <h1 ref={headingRef} tabIndex={-1}>
          This link has expired or was already used
        </h1>
        <p>
          Links work once and expire after 1 hour. If you already confirmed,{" "}
          <Link href="/signin">sign in</Link>. Otherwise, <Link href="/signup">start again</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="[overflow-wrap:anywhere]">
      <h1>Confirm your email for {SITE_NAME}</h1>
      <p>Press the button to finish creating your account. You&rsquo;ll be signed in.</p>
      <form onSubmit={handleSubmit}>
        <button type="submit" aria-disabled={busy}>
          {busy ? "Confirming…" : "Confirm"}
        </button>
      </form>
      <p role="status">
        {problem === "failed" && "Something went wrong confirming your email. Please try again."}
      </p>
      <p>
        Didn&rsquo;t sign up? You can close this page; nothing happens until the button is pressed.
      </p>
    </main>
  );
}
