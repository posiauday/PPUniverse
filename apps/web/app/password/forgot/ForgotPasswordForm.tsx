"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { postPasswordApi } from "../../../lib/password-client";

/**
 * "Forgot your password?" (MVP-036). The answer is the same whether or not
 * the email has an account. It also works for accounts that never had a
 * password (made with Google or a sign-in link): the link sets one.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const errorId = useId();

  useEffect(() => {
    if (errorCount > 0) emailRef.current?.focus();
  }, [errorCount]);

  function fail(message: string) {
    setError(message);
    setSentTo(null);
    setErrorCount((count) => count + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const field = emailRef.current;
    if (field && !field.validity.valid) {
      return fail(
        field.validity.valueMissing
          ? "Enter your email address."
          : "Enter an email address in the format name@example.com.",
      );
    }
    setBusy(true);
    const answer = await postPasswordApi("forgot", { email });
    setBusy(false);
    if (answer.status === 200) {
      setError(null);
      setSentTo(email);
    } else {
      fail("Something went wrong sending the link. Please try again.");
    }
  }

  return (
    <main className="[overflow-wrap:anywhere]">
      <h1>Forgot your password?</h1>
      <p>
        Enter your email and we&rsquo;ll send you a link to choose a new password. It also works if
        you&rsquo;ve only ever signed in with Google or a sign-in link.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={emailId}>Email address</label>
          <input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error !== null}
          />
          {error ? <p id={errorId}>{error}</p> : null}
        </div>
        <button type="submit" aria-disabled={busy}>
          {busy ? "Sending link…" : "Email me a link"}
        </button>
      </form>
      <p role="status">
        {sentTo && `If ${sentTo} has an account, we’ve sent it a link. The link expires in 1 hour.`}
      </p>
      <p>
        Remembered it? <Link href="/signin">Sign in</Link>.
      </p>
    </main>
  );
}
