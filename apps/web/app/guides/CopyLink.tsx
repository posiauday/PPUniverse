"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "copied" | "failed";

/**
 * "Copy link" under an article's contents list (MVP-031, "Board fidelity
 * pass": sharing is how a guide travels). Copies the page's canonical
 * address, never the current URL with its #fragment or query. The result is
 * announced through a polite live region, and the button keeps its name, so
 * a screen reader hears "Copy link" then "Link copied".
 *
 * Rendered only after hydration: without scripts there is nothing it can do.
 */
export function CopyLink({ url }: { url: string }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setReady(typeof navigator !== "undefined" && Boolean(navigator.clipboard));
    return () => clearTimeout(timer.current);
  }, []);

  if (!ready) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="motion-press inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-foreground bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
        </svg>
        Copy link
      </button>
      <span role="status" className="text-sm text-muted-foreground">
        {status === "copied" ? "Link copied" : status === "failed" ? "Couldn't copy the link" : ""}
      </span>
    </div>
  );
}
