"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FIRST_VISIT_WINDOW_MS, markVisited, readLastVisit } from "../../lib/updates-visit";

/** The previous visit's time (or the first-visit window's start); undefined before hydration. */
const SinceContext = createContext<number | undefined>(undefined);

/**
 * Opening /updates (MVP-033 slice D): remembers what "new" meant for this
 * visit (the previous last-visit time, read once), then records this visit,
 * which clears the header badge. Stored in this browser only.
 */
export function UpdatesVisit({ children }: { children: ReactNode }) {
  const [since, setSince] = useState<number | undefined>(undefined);
  useEffect(() => {
    const now = Date.now();
    setSince(readLastVisit() ?? now - FIRST_VISIT_WINDOW_MS);
    markVisited(now);
  }, []);
  return <SinceContext.Provider value={since}>{children}</SinceContext.Provider>;
}

/** "3 new since your last visit", or nothing. */
export function NewSinceCount({ publishedTimes }: { publishedTimes: readonly string[] }) {
  const since = useContext(SinceContext);
  if (since === undefined) return null;
  const count = publishedTimes.filter((time) => Date.parse(time) > since).length;
  if (count === 0) return null;
  return (
    <span className="motion-pop rounded-full bg-[#a3e635] px-3 py-1.5 text-[0.8125rem] font-bold text-[#14141a]">
      {count} new since your last visit
    </span>
  );
}

/** The "New" chip on an update published since the last visit. */
export function NewChip({ publishedAt }: { publishedAt: string }) {
  const since = useContext(SinceContext);
  if (since === undefined || Date.parse(publishedAt) <= since) return null;
  return (
    <span className="motion-pop rounded-full bg-[#14141a] px-2 py-0.5 text-[0.6875rem] font-bold text-[#d9f99d]">
      New
    </span>
  );
}
