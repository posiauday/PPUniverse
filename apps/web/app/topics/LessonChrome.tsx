"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Workspace lesson page's live parts (MVP-048; docs/final-decisions.md,
 * "Learn module design: Workspace"): the current lesson's ring fills as it is
 * read, and "On this page" marks the section being read, with a marker that
 * slides to it and a reading bar. They update from the scroll position at
 * most once per frame. With reduced motion the global rule removes the
 * transitions, so they still track the reader but don't animate.
 */

/** How far down the page the reader is, 0 to 1, updated at most once per frame. */
function useReadRatio(): number {
  const [ratio, setRatio] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setRatio(max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return ratio;
}

const RING_RADIUS = 10;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** A progress ring: `ratio` of it filled. Decorative; the list item says which lesson is current. */
export function Ring({ ratio, className = "" }: { ratio: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 26 26"
      aria-hidden="true"
      className={`h-[26px] w-[26px] shrink-0 -rotate-90 ${className}`}
    >
      <circle
        cx="13"
        cy="13"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="3.5"
        className="stroke-muted"
      />
      <circle
        cx="13"
        cy="13"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - ratio)}
        className="stroke-accent transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}

/** The current lesson's ring, filling as the page is read. */
export function ReadingRing() {
  return <Ring ratio={useReadRatio()} />;
}

/**
 * "On this page" for a lesson: its fixed sections, the one being read marked
 * (aria-current) with a sliding marker, and how much has been read.
 */
export function LessonToc({ items }: { items: ReadonlyArray<{ id: string; title: string }> }) {
  const ratio = useReadRatio();
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    // The section whose top has passed 40% of the window is the one being read.
    const line = window.innerHeight * 0.4;
    let current = 0;
    items.forEach((item, index) => {
      const element = document.getElementById(item.id);
      if (element && element.getBoundingClientRect().top < line) current = index;
    });
    if (ratio >= 0.995) current = items.length - 1;
    setActive(current);
  }, [ratio, items]);

  useEffect(() => {
    const link = listRef.current?.querySelectorAll("li")[active];
    if (link) setMarker({ top: link.offsetTop, height: link.offsetHeight });
  }, [active]);

  return (
    <nav aria-labelledby="lesson_toc_label">
      <p
        id="lesson_toc_label"
        className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        On this page
      </p>
      <ol ref={listRef} className="relative mt-3 border-l-2 border-border text-sm">
        {marker ? (
          <span
            aria-hidden="true"
            className="absolute -left-0.5 w-0.5 bg-accent transition-[transform,height] duration-300 ease-out"
            style={{ transform: `translateY(${marker.top}px)`, height: marker.height, top: 0 }}
          />
        ) : null}
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={index === active ? "location" : undefined}
              className={`flex min-h-10 items-center py-1.5 pr-2 pl-4 leading-snug no-underline hover:text-foreground ${
                index === active ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
      <div className="mt-5" aria-hidden="true">
        <p className="text-xs text-muted-foreground">{Math.round(ratio * 100)}% read</p>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full origin-left rounded-full bg-accent"
            style={{ transform: `scaleX(${ratio})` }}
          />
        </span>
      </div>
    </nav>
  );
}
