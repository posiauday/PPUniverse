"use client";

import { useEffect, useRef, useState } from "react";
import { SITE_NAME } from "../../../lib/seo/site";

/**
 * The page heading plus a persistent status region for the sessions list (BUG-006).
 *
 * Revoking a session removes its row, and the Revoke button that had keyboard focus
 * goes with it, so focus fell to the document body and nothing told assistive
 * technology what had happened (WCAG 2.4.3, 4.1.3). This component stays mounted
 * across the server refresh that follows a revoke. When the number of sessions it is
 * given drops, it announces the outcome through its live region and moves focus to
 * the heading: a stable place inside the page's main landmark.
 */

// BUG-013 mitigation (WCAG 2.4.2) — a mitigation that closes the observed window, not a
// root fix; see planning/bugs/BUG-013.md and planning/tech-debt/TD-013.md for the
// underlying gap. Must match the metadata title this route declares in ./page.tsx
// exactly, or the two will drift.
const EXPECTED_TITLE = `Active sessions | ${SITE_NAME}`;
const TITLE_FALLBACK_MARKER = "data-bug-013-fallback";

/**
 * Decides what a title-repair pass should do, given the current <title> element's state
 * (or null if none exists) and the expected text. Pure, so BUG-013's absent-vs-wrong-text
 * handling is unit-tested without a DOM (see SessionsHeading.test.ts for why: the
 * underlying browser race could not be made to fail deterministically).
 */
export function computeTitleFallback(
  current: { text: string } | null,
  expectedTitle: string,
): { action: "create" | "update" | "none"; text: string } {
  if (!current) return { action: "create", text: expectedTitle };
  if (current.text !== expectedTitle) return { action: "update", text: expectedTitle };
  return { action: "none", text: expectedTitle };
}

export function SessionsHeading({ sessionCount }: { sessionCount: number }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousCount = useRef(sessionCount);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (sessionCount < previousCount.current) {
      // The remaining count is part of the text so that a second revoke is announced
      // as well: a live region only speaks when its text changes.
      const remain = sessionCount === 1 ? "remains" : "remain";
      const noun = sessionCount === 1 ? "session" : "sessions";
      setMessage(`Session revoked. ${sessionCount} active ${noun} ${remain}.`);
      headingRef.current?.focus();
    }
    previousCount.current = sessionCount;
  }, [sessionCount]);

  // BUG-013 mitigation (WCAG 2.4.2): router.refresh() has been observed (Firefox, CI) to
  // remove the <title> element from <head> entirely for a brief window while this page
  // re-renders with fresh data, leaving document.title empty and Next's own route
  // announcer falling back to the bare heading text. This closes that window on every
  // re-render this component sees, for as long as it stays mounted.
  useEffect(() => {
    const existing = document.querySelector("title");
    const decision = computeTitleFallback(
      existing ? { text: existing.textContent ?? "" } : null,
      EXPECTED_TITLE,
    );
    let created: HTMLTitleElement | null = null;
    if (decision.action === "create") {
      created = document.createElement("title");
      created.setAttribute(TITLE_FALLBACK_MARKER, "");
      created.textContent = decision.text;
      document.head.appendChild(created);
    } else if (decision.action === "update" && existing) {
      existing.textContent = decision.text;
    }

    return () => {
      // Only remove a node this effect created itself; never touch one the framework owns.
      if (created?.isConnected && created.hasAttribute(TITLE_FALLBACK_MARKER)) {
        created.remove();
      }
    };
  }, [sessionCount]);

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Active sessions
      </h1>
      <p role="status" className="sr-only">
        {message}
      </p>
    </>
  );
}
