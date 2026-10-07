"use client";

import { getProviders, signIn } from "next-auth/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { SIGNED_IN_PATH, postPasswordApi } from "../../lib/password-client";
import { PasswordField } from "../PasswordField";
import { GoogleButton } from "./GoogleButton";

type Field = "email" | "password";

export default function SignInPage() {
  // MVP-035: the Google button shows only when the server has Google sign-in
  // turned on (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET set).
  const [googleOn, setGoogleOn] = useState(false);
  useEffect(() => {
    getProviders()
      .then((providers) => setGoogleOn(Boolean(providers?.["google"])))
      .catch(() => setGoogleOn(false));
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"password" | "link" | null>(null);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ field: Field; count: number } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const statusId = useId();
  const errorId = useId();

  // After every error, focus goes to the field with the problem once the page shows its
  // message, instead of falling to the document body (BUG-005, WCAG 3.3.1 and 2.4.3).
  useEffect(() => {
    if (!focusRequest) return;
    (focusRequest.field === "email" ? emailRef : passwordRef).current?.focus();
  }, [focusRequest]);

  function fail(field: Field, message: string) {
    setEmailError(field === "email" ? message : null);
    setPasswordError(field === "password" ? message : null);
    setSent(false);
    setFocusRequest((last) => ({ field, count: (last?.count ?? 0) + 1 }));
  }

  /** The form has noValidate, so use the field's own validity to name the problem. */
  function emailProblem(): string | null {
    const field = emailRef.current;
    if (!field || field.validity.valid) return null;
    return field.validity.valueMissing
      ? "Enter your email address."
      : "Enter an email address in the format name@example.com.";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    // Two buttons share the form: "Sign in" (the default, so Enter uses it) and
    // "Send sign-in link", which ignores the password field.
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const method = submitter?.value === "link" ? "link" : "password";

    const problem = emailProblem();
    if (problem) return fail("email", problem);
    if (method === "password" && !password) {
      return fail(
        "password",
        "Enter your password. No password? Use “Send sign-in link” below instead.",
      );
    }

    setBusy(method);
    setEmailError(null);
    setPasswordError(null);
    if (method === "link") {
      const result = await signIn("email", { email, redirect: false, callbackUrl: SIGNED_IN_PATH });
      setBusy(null);
      if (result?.error) fail("email", "Something went wrong sending the link. Please try again.");
      else setSent(true);
      return;
    }

    const answer = await postPasswordApi("signin", { email, password });
    if (answer.status === 200) {
      window.location.assign(SIGNED_IN_PATH);
      return;
    }
    setBusy(null);
    if (answer.status === 401) {
      fail(
        "password",
        "That email and password don’t match an account. Check both, or use “Forgot your password?”.",
      );
    } else if (answer.status === 429) {
      fail(
        "password",
        "Too many tries. Wait 15 minutes, or use “Send sign-in link” below to sign in now.",
      );
    } else {
      fail("password", "Something went wrong signing in. Please try again.");
    }
  }

  return (
    <main>
      <h1>Sign in</h1>
      {googleOn ? (
        <>
          <div className="mt-6">
            <GoogleButton callbackUrl={SIGNED_IN_PATH} />
          </div>
          <p className="auth-divider">or sign in with email</p>
        </>
      ) : null}
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
          autoComplete="current-password"
          error={passwordError}
        />
        {/* aria-disabled, not disabled: a disabled button that has focus drops focus to the body. */}
        <button type="submit" name="method" value="password" aria-disabled={busy !== null}>
          {busy === "password" ? "Signing in…" : "Sign in"}
        </button>
        <p>
          <Link href="/password/forgot">Forgot your password?</Link>
        </p>
        <p>Or, without a password:</p>
        <button type="submit" name="method" value="link" aria-disabled={busy !== null}>
          {busy === "link" ? "Sending link…" : "Send sign-in link"}
        </button>
      </form>
      <p id={statusId} role="status">
        {sent && "Check your email for a sign-in link. It expires shortly, so use it soon."}
      </p>
      <p>
        New here? <Link href="/signup">Create an account with a password</Link>. A sign-in link
        creates your account too.
      </p>
    </main>
  );
}
