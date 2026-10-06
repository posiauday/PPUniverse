"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VISITED_EVENT, badgeText, countNew, readLastVisit } from "../lib/updates-visit";

/**
 * The header's "Updates" link with its lime "new" badge (MVP-033 slice D).
 * The count is worked out in the browser from the published times the server
 * passes in and the last-visit time in localStorage, so the server never
 * learns anything about the visitor. Before hydration (and with no new
 * updates) it is a plain link. Screen readers hear "Updates, 3 new"; the
 * badge itself is hidden from them. It clears when /updates is opened.
 */
export function UpdatesLink({
  publishedTimes,
  className,
  onNavigate,
}: {
  publishedTimes: readonly string[];
  className: string;
  onNavigate?: () => void;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(countNew(publishedTimes, readLastVisit(), Date.now()));
    refresh();
    window.addEventListener(VISITED_EVENT, refresh);
    return () => window.removeEventListener(VISITED_EVENT, refresh);
  }, [publishedTimes]);

  return (
    <Link
      href="/updates"
      onClick={onNavigate}
      aria-label={count > 0 ? `Updates, ${count} new` : undefined}
      className={`${className} gap-2`}
    >
      Updates
      {count > 0 ? (
        <span className="updates-badge" aria-hidden="true">
          {badgeText(count)}
        </span>
      ) : null}
    </Link>
  );
}
