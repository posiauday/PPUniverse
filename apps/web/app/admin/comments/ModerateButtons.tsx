"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "remove" | "restore" | "accept" | "unaccept";

const LABEL: Record<Action, string> = {
  remove: "Remove",
  restore: "Restore",
  accept: "Mark as accepted fix",
  unaccept: "Unmark accepted fix",
};

/** Remove or restore a comment, or mark it as its guide's accepted fix (MVP-040). */
export function ModerateButtons({
  commentId,
  removed,
  accepted,
}: {
  commentId: string;
  removed: boolean;
  accepted: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const actions: Action[] = removed ? ["restore"] : ["remove", accepted ? "unaccept" : "accept"];

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
