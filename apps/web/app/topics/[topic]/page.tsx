import { technologyInfo } from "@ppu/domain-content";
import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { learnEnabled } from "../../../lib/feature-flags";
import { learnRepository } from "../../../lib/learn";
import { homeUrl, topicUrl, topicsIndexUrl } from "../../../lib/seo/canonical";
import { buildBreadcrumbJsonLd } from "../../../lib/seo/json-ld";
import { buildNotFoundMetadata, buildTopicMetadata } from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { getSiteUrl } from "../../../lib/site-url";
import { paletteFor } from "../../../lib/technology-palette";
import { Breadcrumbs } from "../../learn/Breadcrumbs";

interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

export const dynamic = "force-dynamic";

const getTopic = cache(async (slug: string) => {
  if (!learnEnabled()) return null;
  const topic = await learnRepository.findPublishedTopic(slug);
  return topic && topic.lessons.length > 0 ? topic : null;
});

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const topic = await getTopic((await params).topic);
  return topic
    ? buildTopicMetadata({ site: getSiteUrl(), topic })
    : buildNotFoundMetadata("Topic not found");
}

/**
 * A Learn topic (MVP-048, Workspace): what it explains, and its published
 * lessons in order with their reading time. An unknown, unpublished or empty
 * topic is a 404, never a distinguishable response. Behind FEATURE_LEARN.
 */
export default async function TopicPage({ params }: TopicPageProps) {
  const topic = await getTopic((await params).topic);
  if (!topic) notFound();

  const area = technologyInfo(topic.technology);
  const palette = paletteFor(topic.technology);
  const minutes = topic.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const first = topic.lessons[0];
  const site = getSiteUrl();
  const breadcrumbJsonLd = site.ok
    ? buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: homeUrl(site.origin) },
        { name: "Learn", url: topicsIndexUrl(site.origin) },
        { name: topic.title, url: topicUrl(site.origin, topic.slug) },
      ])
    : null;

  return (
    <main className="px-4 pb-16 md:px-6">
      <header
        className={`motion-rise mx-auto mt-4 flex max-w-[77.5rem] flex-col gap-5 rounded-[2.5rem] px-6 py-10 md:px-16 md:py-14 ${palette.tint}`}
      >
        <Breadcrumbs items={[{ name: "Learn", href: "/topics" }, { name: topic.title }]} />
        <h1 className="text-4xl leading-[1.04] font-bold md:text-[3.5rem]">{topic.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed">{topic.summary}</p>
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground">
            {area.name}
          </span>
          <span className="rounded-full bg-card/80 px-3.5 py-1.5">
            {topic.lessons.length} lessons · {minutes} min
          </span>
        </p>
        {first ? (
          <p>
            <Link
              href={`/topics/${encodeURIComponent(topic.slug)}/${encodeURIComponent(first.slug)}`}
              className="motion-press inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground no-underline"
            >
              Start lesson 1 →
            </Link>
          </p>
        ) : null}
      </header>

      <section aria-labelledby="lessons_heading" className="mx-auto mt-12 max-w-[46rem]">
        <h2 id="lessons_heading" className="text-2xl font-bold">
          Lessons
        </h2>
        <ol className="mt-4 flex flex-col gap-3">
          {topic.lessons.map((lesson, index) => (
            <li key={lesson.slug}>
              <Link
                href={`/topics/${encodeURIComponent(topic.slug)}/${encodeURIComponent(lesson.slug)}`}
                className="motion-lift flex items-center gap-4 rounded-[1.25rem] border border-border bg-card p-4 text-foreground no-underline"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display font-bold ${palette.tint} ${palette.ink}`}
                >
                  {index + 1}
                </span>
                <span className="font-display text-lg leading-snug font-bold">
                  <span className="sr-only">Lesson {index + 1}: </span>
                  {lesson.title}
                </span>
                <span className="ml-auto shrink-0 text-sm text-muted-foreground">
                  {lesson.minutes} min
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
