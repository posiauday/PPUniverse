"use client";

import { useState } from "react";

/**
 * "Copy" for an article's code panel (MVP-027 slice 3). The accessible name
 * is "Copy code", which contains the visible label (WCAG 2.5.3, label in
 * name). The result is announced through a polite live region rather than
 * by renaming the button, so focus and name stay stable.
 */
export function CopyCodeButton({ code }: { code: string }) {
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Copied");
    } catch {
      // The Clipboard API can be blocked (permissions policy, an embedding
      // frame, older browsers); the long-standing selection-based copy often
      // still works there.
      setStatus(
        copyBySelection(code) ? "Copied" : "Copy failed. Select the code and copy it instead.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="inline-flex min-h-8 items-center rounded-md border border-code-border px-2.5 font-sans text-xs font-semibold text-code-foreground hover:bg-white/10"
      >
        {status === "Copied" ? "Copied" : "Copy"}
      </button>
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}

/** Copies through a temporary off-screen textarea; true only if the browser says it copied. */
function copyBySelection(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-9999px";
  document.body.append(area);
  const active = document.activeElement as HTMLElement | null;
  area.select();
  let copied: boolean;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  active?.focus();
  return copied;
}
