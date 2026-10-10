import type { ReactNode } from "react";

/** A pill link or button in an admin page's header (primary: filled; otherwise outlined). */
export const ADMIN_ACTION =
  "motion-press inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold no-underline";

/**
 * The top of every admin page (admin centre redesign, docs/final-decisions.md,
 * 2026-10-10): the same eyebrow, title size and spacing everywhere, a one-line
 * description, and the page's main actions on the right.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted-foreground">Admin</p>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
