"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { postPasswordApi } from "../../lib/password-client";
import { PasswordField } from "../PasswordField";

type Field = "email" | "password";

/**
 * The sign-up form (MVP-036). A valid request always ends with "check your
 * email", whether or not the address already has an account, so the form
 * can't be used to find out who has one. The password works only after the
 * emailed link is confirmed.
 */
export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[] | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ field: Field; count: number } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const errorId = useId();

  useEffect(() => {
    if (!focusRequest) return;
    (focusRequest.field === "email" ? emailRef : passwordRef).current?.focus();
  }, [focusRequest]);

  function fail(field: Field, messages: string[]) {
    setEmailError(field === "email" ? (messages[0] ?? null) : null);
    setPasswordErrors(field === "password" ? messages : null);
    setSentTo(null);
    setFocusRequest((last) => ({ field, count: (last?.count ?? 0) + 1 }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const field = emailRef.current;
    if (field && !field.validity.valid) {
      return fail("email", [
        field.validity.valueMissing
          ? "Enter your email address."
          : "Enter an email address in the format name@example.com.",
      ]);
    }
    if (!password) return fail("password", ["Choose a password."]);

    setBusy(true);
    const answer = await postPasswordApi("signup", { email, password });
    setBusy(false);
    if (answer.status === 200) {
      setEmailError(null);
      setPasswordErrors(null);
      setSentTo(email);
    } else if (answer.error === "invalid-email") {
      fail("email", ["Enter an email address in the format name@example.com."]);
    } else if (answer.error === "weak-password" && answer.problems?.length) {
      fail("password", answer.problems);
    } else {
      fail("email", ["Something went wrong creating your account. Please try again."]);
    }
  }

  return (
    <main className="[overflow-wrap:anywhere]">
      <h1>Create an account</h1>
      <p>
        Choose a password, then confirm your email: we&rsquo;ll send you a link, and your password
        works once you&rsquo;ve opened it.
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
            aria-describedby={emailError ? errorId : undefined}
            aria-invalid={emailError !== null}
          />
          {emailError ? <p id={errorId}>{emailError}</p> : null}
        </div>
        <PasswordField
          ref={passwordRef}
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint="At least 12 characters. A few unrelated words make a strong password that is easy to remember."
          error={passwordErrors}
        />
        {/* aria-disabled, not disabled: a disabled button that has focus drops focus to the body. */}
        <button type="submit" aria-disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p role="status">
        {sentTo &&
          `Check your email at ${sentTo}. Open the link and press “Confirm” to finish. The link expires in 1 hour.`}
      </p>
      <p>
        Already have an account? <Link href="/signin">Sign in</Link>.
      </p>
      <p>
        We check new passwords against Have I Been Pwned, a public list of leaked passwords. Only
        the first 5 characters of a scrambled copy of your password are sent, never the password.{" "}
        <Link href="/privacy">Privacy notice</Link>.
      </p>
    </main>
  );
}
