"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** How far below the top of the window a heading counts as "being read". */
const READING_LINE = 140;

/**
 * Follows the reader through "On this page" (BUG-029): the link for the
 * section being read is marked aria-current="location", which ArticleToc
 * styles as the active bar. Before the first heading nothing is marked; at
 * the very bottom the last section is, so a short closing section can still
 * be reached. Without JavaScript the list is a plain set of links.
 */
export function TocSpy({ ids, children }: { ids: readonly string[]; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = ids.join(" ");

  useEffect(() => {
    const root = ref.current;
    const headings = key
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((heading): heading is HTMLElement => heading !== null);
    if (!root || headings.length === 0) return;

    const update = () => {
      let current: string | null = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > READING_LINE) break;
        current = heading.id;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && headings[0]!.getBoundingClientRect().top <= window.innerHeight) {
        current = headings[headings.length - 1]!.id;
      }
      for (const link of root.querySelectorAll<HTMLAnchorElement>("a[href^='#']")) {
        if (link.getAttribute("href") === `#${current}`)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [key]);

  return <div ref={ref}>{children}</div>;
}
