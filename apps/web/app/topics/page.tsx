import { AREAS } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learnEnabled } from "../../lib/feature-flags";
import { learnRepository } from "../../lib/learn";
import { buildTopicsIndexMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { paletteFor } from "../../lib/technology-palette";

// Reads the database, so it renders per request (see apps/web/app/page.tsx).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (!learnEnabled()) return {};
  const topics = await learnRepository.listPublishedTopics();
  return buildTopicsIndexMetadata({ site: getSiteUrl(), hasTopics: topics.length > 0 });
}

/**
 * The Learn home (MVP-048; docs/final-decisions.md, "Learn module design:
 * Workspace"): every published topic, grouped by area, each a short series of
 * lessons that explains how something works. Guides at /learn answer "how do I
 * fix this?"; topics answer "how does this actually work?". Behind
 * FEATURE_LEARN: off, this is a 404.
 */
export default async function TopicsPage() {
  if (!learnEnabled()) notFound();
  const topics = (await learnRepository.listPublishedTopics()).filter(
    (topic) => topic.lessons.length > 0,
  );
  const areas = AREAS.map((area) => ({
    area,
    topics: topics.filter((topic) => topic.technology === area.technology),
  })).filter((group) => group.topics.length > 0);

  return (
    <main className="px-4 pb-16 md:px-6">
      <header className="motion-rise mx-auto mt-4 max-w-[77.5rem] rounded-[2.5rem] bg-stage px-6 py-10 md:px-16 md:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Learn
        </p>
        <h1 className="mt-3 text-4xl leading-[1.04] font-bold md:text-[3.5rem]">
          How Power Platform{" "}
          <span className="accent-word text-[1.08em] text-accent">really works</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">
          Short lessons, about 10 minutes each: the idea, how it works, the important things, a
          small exercise and a quick check. For a fix to a problem in front of you,{" "}
          <Link href="/learn" className="underline underline-offset-4">
            see the guides
          </Link>
          .
        </p>
      </header>

      {areas.length === 0 ? (
        <p className="mx-auto mt-12 max-w-[77.5rem]">The first topics are on their way.</p>
      ) : (
        <div className="mx-auto mt-12 flex max-w-[77.5rem] flex-col gap-12">
          {areas.map(({ area, topics: areaTopics }) => (
            <section key={area.technology} aria-labelledby={`area_${area.slug}`}>
              <h2 id={`area_${area.slug}`} className="text-2xl font-bold">
                {area.name}
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {areaTopics.map((topic) => {
                  const minutes = topic.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
                  const palette = paletteFor(topic.technology);
                  return (
                    <li key={topic.slug}>
                      <Link
                        href={`/topics/${encodeURIComponent(topic.slug)}`}
                        className={`motion-lift flex h-full flex-col gap-2 rounded-[1.5rem] p-5 text-foreground no-underline ${palette.tint}`}
                      >
                        <span className="font-display text-xl leading-snug font-bold">
                          {topic.title}
                        </span>
                        <span className="text-[0.9375rem] leading-relaxed">{topic.summary}</span>
                        <span className={`mt-auto pt-2 text-sm font-medium ${palette.ink}`}>
                          {topic.lessons.length} lessons · {minutes} min
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
