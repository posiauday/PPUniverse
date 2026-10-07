import Link from "next/link";
import type { GuideTrust } from "../../lib/article-trust";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * The trust strip under a guide's title (G1 board, MVP-038 part). It claims
 * only what the guide itself states: "Checked against Microsoft Learn" and
 * the date appear only when the guide carries its dated note; otherwise the
 * strip shows how many sources it lists and when it was last updated.
 */
export function TrustStrip({ trust, updatedAt }: { trust: GuideTrust; updatedAt: Date }) {
  const sources =
    trust.sourceCount > 0
      ? `${trust.sourceCount} ${trust.sourceCount === 1 ? "source" : "sources"}`
      : null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[1.125rem] bg-card/70 px-3.5 py-3 text-sm">
      {trust.checkedOn ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-highlight px-3 py-1 font-semibold text-highlight-foreground">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden="true"
            >
              <path d="M5 12l5 5 9-10" />
            </svg>
            Checked against Microsoft Learn
          </span>
          <span>
            <time dateTime={trust.checkedOn.toISOString().slice(0, 10)}>
              {DATE_FORMAT.format(trust.checkedOn)}
            </time>
            {sources ? ` · ${sources}` : null}
          </span>
        </>
      ) : (
        <span>
          {sources ? `${sources} · ` : null}Updated{" "}
          <time dateTime={updatedAt.toISOString().slice(0, 10)}>
            {DATE_FORMAT.format(updatedAt)}
          </time>
        </span>
      )}
      <Link
        href="/how-we-write"
        className="inline-flex min-h-11 items-center underline underline-offset-[3px] sm:ml-auto md:min-h-0"
      >
        How we write guides
      </Link>
    </div>
  );
}
