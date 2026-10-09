"use client";

import { useEffect, useState } from "react";

const PARTS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

/** "Mon, Oct 12, 2026, 9:00 AM CST" in `timeZone`, or the browser's own zone when omitted. */
export function formatWhen(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", { ...PARTS, ...(timeZone ? { timeZone } : {}) }).format(
    new Date(iso),
  );
}

/**
 * A time in the admin's own time zone (MVP-050). The server can't know that
 * zone, so the first render, on the server and in the browser alike, says it
 * in UTC; the browser then switches to local time.
 */
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(() => formatWhen(iso, "UTC"));
  useEffect(() => setText(formatWhen(iso)), [iso]);
  return <time dateTime={iso}>{text}</time>;
}
