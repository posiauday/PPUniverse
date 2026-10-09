import { UPDATE_KIND_LABEL, technologyInfo, type PublishedUpdate } from "@ppu/domain-content";
import { paletteFor } from "../../lib/technology-palette";
import { NewChip } from "./UpdatesVisit";

export function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** One update on /updates, and in an admin's preview of a draft (MVP-050). */
export function UpdateCard({ update }: { update: PublishedUpdate }) {
  const area = update.technology ? technologyInfo(update.technology) : null;
  const palette = paletteFor(update.technology);
  return (
    <li
      id={update.slug}
      className="scroll-mt-28 rounded-[1.375rem] border border-border bg-card px-5.5 py-5"
    >
      <article aria-labelledby={`${update.slug}-title`}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${palette.tint} ${palette.ink}`}
          >
            {area ? area.name : "Power Platform"}
          </span>
          <span className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
            {UPDATE_KIND_LABEL[update.kind]}
          </span>
          <NewChip publishedAt={update.publishedAt.toISOString()} />
          {update.action ? (
            <span className="ml-auto rounded-full bg-highlight px-2.5 py-1 text-xs font-semibold text-highlight-foreground">
              {update.action}
            </span>
          ) : null}
        </div>
        <h3 id={`${update.slug}-title`} className="mt-2.5 font-display text-[1.375rem] font-bold">
          {update.title}
        </h3>
        <p className="mt-1.5 leading-relaxed text-muted-foreground">{update.summary}</p>
        <p className="mt-2 text-[0.8125rem] text-muted-foreground">
          Published {dateLabel(update.publishedAt)} ·{" "}
          <a href={update.sourceUrl} rel="noopener" className="text-foreground underline">
            Microsoft&apos;s announcement
            <span aria-hidden="true"> ↗</span>
          </a>
        </p>
      </article>
    </li>
  );
}
