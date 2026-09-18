"use client";

import { signIn } from "next-auth/react";
import { useId, useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const emailId = useId();
  const statusId = useId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/account/sessions",
    });
    setStatus(result?.error ? "error" : "sent");
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
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={statusId}
            aria-invalid={status === "error"}
          />
        </div>
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending link…" : "Send sign-in link"}
        </button>
      </form>
      <p id={statusId} role="status">
        {status === "sent" &&
          "Check your email for a sign-in link. It expires shortly, so use it soon."}
        {status === "error" && "Something went wrong sending the link. Please try again."}
      </p>
    </main>
  );
}
