"use client";

import { useEffect, useRef, useState } from "react";

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
