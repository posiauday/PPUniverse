"use client";

import { forwardRef, useId, useState } from "react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "current-password" on sign-in; "new-password" when choosing one, so password managers offer to save it. */
  autoComplete: "current-password" | "new-password";
  hint?: string;
  /** One message, or the list of everything wrong with a new password. */
  error?: string | string[] | null;
}

/**
 * A labelled password input with a Show/Hide button (MVP-036). Pasting is
 * never blocked, so password managers work (WCAG 3.3.8). The hint and the
 * error are tied to the input with aria-describedby.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, value, onChange, autoComplete, hint, error }, ref) {
    const [shown, setShown] = useState(false);
    const inputId = useId();
    const hintId = useId();
    const errorId = useId();
    const errors = error == null ? [] : Array.isArray(error) ? error : [error];
    const describedBy = [hint ? hintId : null, errors.length ? errorId : null]
      .filter(Boolean)
      .join(" ");
    return (
      <div>
        <label htmlFor={inputId}>{label}</label>
        {hint ? <p id={hintId}>{hint}</p> : null}
        {/* The input keeps no class, so it gets the site's plain field style; the
            minmax(0, 1fr) column lets it shrink on a 320px screen. */}
        <div className="grid w-full max-w-[32rem] grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input
            ref={ref}
            id={inputId}
            name={autoComplete === "new-password" ? "new-password" : "password"}
            type={shown ? "text" : "password"}
            autoComplete={autoComplete}
            autoCapitalize="none"
            spellCheck={false}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={describedBy || undefined}
            aria-invalid={errors.length > 0}
          />
          {/* The name follows the visible word ("Show password" / "Hide password", WCAG 2.5.3). */}
          <button type="button" onClick={() => setShown((now) => !now)}>
            {shown ? "Hide" : "Show"}
            <span className="sr-only"> {label.toLowerCase()}</span>
          </button>
        </div>
        {errors.length === 1 ? <p id={errorId}>{errors[0]}</p> : null}
        {errors.length > 1 ? (
          <ul id={errorId}>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  },
);
