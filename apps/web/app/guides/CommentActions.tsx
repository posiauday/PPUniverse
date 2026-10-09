"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "../../lib/post-json";

type State = "idle" | "busy" | "reported" | "too-many" | "error";

const MESSAGE: Partial<Record<State, string>> = {
  reported: "Thanks. We'll take a look.",
  "too-many": "You've sent a few reports already. Please try again in an hour.",
  error: "Something went wrong. Please try again.",
};

/**
 * A comment's actions (MVP-040): anyone may report it; its author may delete
 * it. A report keeps the comment up until an admin decides.
 */
export function CommentActions({
  id,
  mine,
  author,
}: {
  id: string;
  mine: boolean;
  /** The author's display name, so each Report button says whose comment it is. */
  author: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const base = `/api/comments/${encodeURIComponent(id)}`;

  async function report() {
    if (state === "busy" || state === "reported") return;
    setState("busy");
    const answer = await postJson(`${base}/report`, {});
    setState(
      answer.status === 200 ? "reported" : answer.error === "too-many" ? "too-many" : "error",
    );
  }

  async function remove() {
    if (state === "busy") return;
    if (!window.confirm("Delete your comment? This can't be undone.")) return;
    setState("busy");
    const answer = await postJson(`${base}/delete`, {});
    if (answer.status === 200) router.refresh();
    else setState("error");
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      {mine ? (
        <button
          type="button"
          onClick={() => void remove()}
          aria-disabled={state === "busy"}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          Delete my comment
        </button>
      ) : state === "reported" ? null : (
        <button
          type="button"
          onClick={() => void report()}
          aria-disabled={state === "busy"}
          aria-label={`Report the comment by ${author}`}
          className="inline-flex min-h-11 items-center font-medium text-muted-foreground underline underline-offset-4"
        >
          Report
        </button>
      )}
      <p role="status" className="empty:hidden">
        {MESSAGE[state] ?? ""}
      </p>
    </div>
  );
}
