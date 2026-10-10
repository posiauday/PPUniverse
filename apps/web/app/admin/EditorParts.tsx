"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { slugify } from "../../lib/slugify";

/**
 * The parts every admin editor shares (MVP-052 phase 4; docs/final-decisions.md,
 * 2026-10-10, "Admin centre: concept A with B's Inbox"): a labelled field with
 * its hint and errors wired to it, a Save bar that stays in view at the bottom
 * of the screen while the form is on it, and a slug that follows the title
 * until it's edited by hand.
 */

/** A text box, select or text area in an editor. The 1.5px edge is 3:1 or better (WCAG 1.4.11). */
export const FIELD_CONTROL =
  "min-h-11 w-full rounded-xl border-[1.5px] border-muted-foreground bg-card px-3 py-2 text-foreground";

export type ControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

/** A labelled field with its hint and every error wired to it (WCAG 1.3.1, 3.3.1). */
export function EditorField({
  id,
  label,
  hint,
  errors = [],
  className = "",
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  errors?: string[];
  className?: string;
  children: (props: ControlProps) => ReactNode;
}) {
  const describedBy =
    [hint ? `${id}-hint` : null, errors.length > 0 ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children({ id, "aria-invalid": errors.length > 0, "aria-describedby": describedBy })}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {errors.length === 1 ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-coral">
          {errors[0]}
        </p>
      ) : errors.length > 1 ? (
        <ul id={`${id}-error`} className="list-disc pl-5 text-sm font-semibold text-coral">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * The form's Save button and its message, in a bar that sticks to the bottom
 * of the screen while the form is in view, so a long guide never has to be
 * scrolled to save. `admin-save-bar` gives the page a bottom scroll padding
 * (globals.css), so a focused field is never hidden behind it (WCAG 2.4.11).
 */
export function SaveBar({
  label,
  submitting,
  error,
  dirty,
  cancelHref,
  saved = false,
}: {
  label: string;
  submitting: boolean;
  error: string | null;
  dirty: boolean;
  cancelHref?: string;
  /** True once a save that stays on the page has worked, until the next change. */
  saved?: boolean;
}) {
  return (
    <div className="admin-save-bar sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
      <div className="min-w-0 text-sm">
        <p role="status" className={error ? "font-semibold text-coral" : "font-semibold"}>
          {error ?? (saved && !dirty ? "Saved." : null)}
        </p>
        {error || (saved && !dirty) ? null : (
          <p className="text-muted-foreground">{dirty ? "Unsaved changes" : "No changes yet"}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground no-underline hover:border-foreground"
          >
            Cancel
          </Link>
        ) : null}
        <button
          type="submit"
          aria-disabled={submitting}
          className="motion-press inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground aria-disabled:cursor-not-allowed"
        >
          {submitting ? "Saving…" : label}
        </button>
      </div>
    </div>
  );
}

/**
 * The slug for a new item follows its title (as `slugify` suggests it) until
 * the slug is typed in by hand; clearing it hands it back to the title. An
 * existing item's slug never changes by itself, since that would change a
 * live address.
 */
export function useSlugFollowsTitle(mode: "create" | "edit", initialSlug: string) {
  const [manual, setManual] = useState(mode === "edit" || initialSlug !== "");
  return {
    /** The slug to store when the title changes, or null to leave it. */
    fromTitle: (title: string) => (manual ? null : slugify(title)),
    /** Call when the slug box is edited. */
    onSlugTyped: (slug: string) => setManual(slug !== ""),
  };
}
