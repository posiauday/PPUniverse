import { TRACKED_KINDS, trackerLabel } from "@ppu/domain-content";
import type { Metadata } from "next";
import { cache } from "react";
import { buildTechnologySectionMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { updateRepository } from "../../lib/updates";
import { UPDATES_FEED_PATH, UPDATES_FEED_TITLE } from "../../lib/updates-feed";
import { UpdateCard, dateLabel } from "./UpdateCard";
import { NewSinceCount, UpdatesVisit } from "./UpdatesVisit";

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
  const site = getSiteUrl();
  const metadata = buildTechnologySectionMetadata({
    site,
    path: "/updates",
    title: TITLE,
    description: DESCRIPTION,
    hasContent: (await getUpdates()).length > 0,
  });
  if (!site.ok) return metadata;
  // The RSS feed, for feed readers that discover it from the page (open question 66).
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      types: {
        "application/rss+xml": [
          { url: `${site.origin}${UPDATES_FEED_PATH}`, title: UPDATES_FEED_TITLE },
        ],
      },
    },
  };
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
          <p className="mt-5">
            <a
              href={UPDATES_FEED_PATH}
              type="application/rss+xml"
              className="motion-press inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground no-underline"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="currentColor"
              >
                <circle cx="3" cy="13" r="2" />
                <path d="M1 7a8 8 0 0 1 8 8h-2.5A5.5 5.5 0 0 0 1 9.5zM1 1a14 14 0 0 1 14 14h-2.5A11.5 11.5 0 0 0 1 3.5z" />
              </svg>
              Follow with RSS
            </a>
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
                className="on-code-surface rounded-[1.75rem] bg-[#14141a] p-6 text-[#f4f1ea] ring-1 ring-[#2e2e38]"
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
