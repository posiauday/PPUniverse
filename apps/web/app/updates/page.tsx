import {
  TRACKED_KINDS,
  UPDATE_KIND_LABEL,
  technologyInfo,
  trackerLabel,
  type PublishedUpdate,
} from "@ppu/domain-content";
import type { Metadata } from "next";
import { cache } from "react";
import { buildTechnologySectionMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { paletteFor } from "../../lib/technology-palette";
import { updateRepository } from "../../lib/updates";
import { NewChip, NewSinceCount, UpdatesVisit } from "./UpdatesVisit";

// See apps/web/app/page.tsx for why content pages render per-request.
export const dynamic = "force-dynamic";

/** How many published updates the page lists. */
const UPDATES_LIMIT = 60;

const TITLE = "Power Platform updates";
const DESCRIPTION =
  "What changed in Power Platform and whether you need to act, in plain words and linked to Microsoft's announcements, plus a deprecation tracker.";

const getUpdates = cache(() => updateRepository.listPublishedUpdates({ limit: UPDATES_LIMIT }));

export async function generateMetadata(): Promise<Metadata> {
  // noindex until the first update is published.
  return buildTechnologySectionMetadata({
    site: getSiteUrl(),
    path: "/updates",
    title: TITLE,
    description: DESCRIPTION,
    hasContent: (await getUpdates()).length > 0,
  });
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The Updates page (MVP-033 slice D; the approved "Updates" structure board).
 * The feed lists published updates, newest first, each marked "New" when it
 * was published since this browser's last visit. The deprecation tracker lists
 * the deprecations and retirements that have a date. Every item links to
 * Microsoft's own announcement; the agent drafts them and the product owner
 * publishes.
 */
export default async function UpdatesPage() {
  const updates = await getUpdates();
  const now = new Date();
  const tracked = updates
    .filter((update) => TRACKED_KINDS.includes(update.kind) && update.effectiveDate)
    .sort((a, b) => (b.effectiveDate?.getTime() ?? 0) - (a.effectiveDate?.getTime() ?? 0));
  const times = updates.map((update) => update.publishedAt.toISOString());

  return (
    <main className="px-4 pb-6 md:px-6">
      <UpdatesVisit>
        <header className="motion-rise mx-auto mt-2 max-w-[77.5rem] rounded-[2.5rem] bg-tech-bi px-6 py-12 text-foreground md:px-16 md:py-14">
          <p className="font-mono text-xs tracking-widest text-tech-bi-ink uppercase">
            Updates{updates.length > 0 ? ` · latest ${dateLabel(updates[0]!.publishedAt)}` : ""}
          </p>
          <h1 className="mt-2.5 text-5xl leading-[0.98] font-extrabold md:text-[5rem]">
            What changed, <span className="accent-word text-tech-bi-ink">and what it means.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed">
            Microsoft stopped publishing Power Platform release plans in September 2026; new
            capabilities now appear on its AI at Work roadmap. We read Microsoft&apos;s official
            pages and say, per product, what changed and whether you need to act: in our own words,
            always linked to Microsoft&apos;s.
          </p>
        </header>

        {updates.length === 0 ? (
          <p className="mx-auto mt-10 max-w-[77.5rem] text-lg">
            No updates are published yet. The first ones are being checked against Microsoft&apos;s
            pages.
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-[77.5rem] items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
            <section aria-labelledby="latest-updates">
              <div className="mb-3.5 flex flex-wrap items-center gap-3">
                <h2 id="latest-updates" className="text-4xl font-bold">
                  Latest
                </h2>
                <NewSinceCount publishedTimes={times} />
              </div>
              <ul className="flex flex-col gap-3">
                {updates.map((update) => (
                  <UpdateCard key={update.id} update={update} />
                ))}
              </ul>
            </section>

            {tracked.length > 0 ? (
              <section
                aria-labelledby="deprecation-tracker"
                className="rounded-[1.75rem] bg-[#14141a] p-6 text-[#f4f1ea] ring-1 ring-[#2e2e38]"
              >
                <h2 id="deprecation-tracker" className="text-3xl font-bold">
                  Deprecation tracker
                </h2>
                <p className="mt-1.5 mb-3.5 text-sm text-[#b9b9c6]">
                  From Microsoft&apos;s &ldquo;Important changes&rdquo; pages, with what to switch
                  to.
                </p>
                <ul className="list-none p-0">
                  {tracked.map((update) => (
                    <li key={update.id} className="border-t border-[#2e2e38] py-3.5">
                      <div className="flex justify-between gap-2">
                        <a href={`#${update.slug}`} className="font-bold text-[#f4f1ea]">
                          {update.title}
                        </a>
                        <span className="h-fit shrink-0 rounded-full bg-[#ff7a59] px-2.5 py-0.5 text-xs font-bold text-[#14141a]">
                          {trackerLabel(update, now)}
                        </span>
                      </div>
                      <p className="mt-1 text-[0.8125rem] text-[#d9f99d]">
                        {update.replacement ? (
                          <>Switch to: {update.replacement}</>
                        ) : (
                          <>
                            What to do:{" "}
                            <a href={update.sourceUrl} rel="noopener" className="text-[#d9f99d]">
                              see Microsoft&apos;s notice
                            </a>
                          </>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </UpdatesVisit>
    </main>
  );
}

function UpdateCard({ update }: { update: PublishedUpdate }) {
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
