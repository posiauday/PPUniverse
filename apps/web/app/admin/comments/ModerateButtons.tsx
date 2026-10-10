"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "remove" | "restore" | "keep" | "accept" | "unaccept";

/** A guide's accepted comment is its fix; a component's is the answer (MVP-051). */
function labels(kind: "guide" | "component", compact: boolean): Record<Action, string> {
  const what = kind === "guide" ? "fix" : "answer";
  return {
    remove: "Remove",
    restore: "Restore",
    keep: compact ? "Keep" : "Keep it (clear reports)",
    accept: `Mark as accepted ${what}`,
    unaccept: `Unmark accepted ${what}`,
  };
}

/**
 * Remove or restore a comment, or mark it as its guide's accepted fix (MVP-040)
 * or its component's accepted answer (MVP-051). `compact` (the Overview's
 * Inbox, 2026-10-10) offers only Keep and Remove, with Remove as the strong one.
 */
export function ModerateButtons({
  commentId,
  removed,
  accepted,
  reported,
  kind = "guide",
  compact = false,
}: {
  commentId: string;
  removed: boolean;
  accepted: boolean;
  /** Has reports waiting: offers "Keep it" to clear them. */
  reported: boolean;
  kind?: "guide" | "component";
  compact?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const actions: Action[] = compact
    ? ["keep", "remove"]
    : removed
      ? ["restore"]
      : [
          ...(reported ? (["remove", "keep"] as const) : (["remove"] as const)),
          accepted ? "unaccept" : "accept",
        ];
  const LABEL = labels(kind, compact);

  async function run(action: Action) {
    if (state === "busy") return;
    setState("busy");
    try {
      const response = await fetch(
        `/api/admin/comments/${encodeURIComponent(commentId)}/${action}`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error(String(response.status));
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => void run(action)}
          aria-disabled={state === "busy"}
          className={
            compact
              ? `min-h-10 rounded-full px-4 text-sm font-semibold ${
                  action === "remove"
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-foreground"
                }`
              : undefined
          }
        >
          {LABEL[action]}
        </button>
      ))}
      <p role="status" className="text-sm">
        {state === "error" ? "That didn't work. Please try again." : ""}
      </p>
    </div>
  );
}
