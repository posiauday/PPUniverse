"use client";

import { useEffect, useRef } from "react";

/**
 * A slim bar under the header that fills as the article is read (MVP-031,
 * Daylight). Decorative: the scroll position is already plain to everyone,
 * so it is hidden from assistive technology rather than announced. It
 * updates a transform only (no layout), at most once per frame, and with
 * reduced motion it still tracks the scroll -- it moves only when the reader
 * does.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none sticky top-0 z-40 h-1 w-full overflow-hidden bg-transparent md:top-[5.25rem]"
    >
      <span
        ref={barRef}
        className="block h-full w-full origin-left scale-x-0 bg-gradient-to-r from-[#7c3aed] via-[#ff7a59] to-[#a3e635]"
      />
    </div>
  );
}
