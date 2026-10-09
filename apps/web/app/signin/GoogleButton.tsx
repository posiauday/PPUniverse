"use client";

import { signIn } from "next-auth/react";
import { googleButtonFont } from "../fonts";

/**
 * "Continue with Google", built to Google's branding guidelines
 * (developers.google.com/identity/branding-guidelines, checked 2026-10-06):
 * - the standard four-colour "G", unchanged;
 * - the light theme (#FFFFFF fill, #747775 1px stroke, #1F1F1F text), in
 *   both site themes: the guidelines say the G must "appear on a white
 *   background" and don't say whether the dark theme's #131314 fill counts,
 *   so the light theme is the one that is plainly allowed;
 * - Google Sans Medium 14/20; padding 12px, 10px after the logo, 12px
 *   after the text; pill shape.
 * Styles: .google-button in globals.css. The text names the button, so the
 * G itself is hidden from screen readers.
 */
export function GoogleButton({ callbackUrl }: { callbackUrl: () => string }) {
  return (
    <button
      type="button"
      className={`google-button ${googleButtonFont.className}`}
      onClick={() => void signIn("google", { callbackUrl: callbackUrl() })}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" width="20" height="20">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      <span>Continue with Google</span>
    </button>
  );
}
