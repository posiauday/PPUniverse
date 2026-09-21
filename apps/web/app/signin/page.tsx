"use client";

import { signIn } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const statusId = useId();
  const errorId = useId();

  // After every error, focus goes to the email field once the page shows its message,
  // instead of falling to the document body (BUG-005, WCAG 3.3.1 and 2.4.3).
  useEffect(() => {
    if (errorCount > 0) emailRef.current?.focus();
  }, [errorCount]);

  function fail(message: string) {
    setStatus("error");
    setError(message);
    setErrorCount((count) => count + 1);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    // The form has noValidate, so use the field's own validity to name the problem.
    const field = emailRef.current;
    if (field && !field.validity.valid) {
      fail(
        field.validity.valueMissing
          ? "Enter your email address."
          : "Enter an email address in the format name@example.com.",
      );
      return;
    }

    setStatus("submitting");
    setError(null);
    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/account/sessions",
    });
    if (result?.error) {
      fail("Something went wrong sending the link. Please try again.");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main>
      <h1>Sign in</h1>
      <p>
        Enter your email address. We&rsquo;ll send you a link to sign in — no password needed. New
        here? The same link creates your account and verifies your email.
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor={emailId}>Email address</label>
          <input
            ref={emailRef}
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={status === "error"}
          />
          {error ? <p id={errorId}>{error}</p> : null}
        </div>
        {/* aria-disabled, not disabled: a disabled button that has focus drops focus to the body. */}
        <button type="submit" aria-disabled={status === "submitting"}>
          {status === "submitting" ? "Sending link…" : "Send sign-in link"}
        </button>
      </form>
      <p id={statusId} role="status">
        {status === "sent" &&
          "Check your email for a sign-in link. It expires shortly, so use it soon."}
      </p>
    </main>
  );
}
