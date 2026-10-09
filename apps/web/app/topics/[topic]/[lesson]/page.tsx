import { technologyInfo } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { currentUserId } from "../../../../lib/comments";
import { learnEnabled } from "../../../../lib/feature-flags";
import { learnRepository } from "../../../../lib/learn";
import { lessonView, neighbours } from "../../../../lib/lesson-view";
import { buildLessonMetadata, buildNotFoundMetadata } from "../../../../lib/seo/metadata";
import { getSiteUrl } from "../../../../lib/site-url";
import { paletteFor } from "../../../../lib/technology-palette";
import { ArticleBody } from "../../../guides/ArticleBody";
import { Breadcrumbs } from "../../../guides/Breadcrumbs";
import { KnowledgeCheck } from "../../KnowledgeCheck";
import { LessonToc, ReadingRing, Ring } from "../../LessonChrome";
import { MarkDoneButton } from "../../ProgressControls";

interface LessonPageProps {
  params: Promise<{ topic: string; lesson: string }>;
}

export const dynamic = "force-dynamic";

const getLesson = cache(async (topicSlug: string, lessonSlug: string) =>
  learnEnabled() ? learnRepository.findPublishedLesson(topicSlug, lessonSlug) : null,
);

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { topic, lesson } = await params;
  const found = await getLesson(topic, lesson);
  return found
    ? buildLessonMetadata({ site: getSiteUrl(), topic: found.topic, lesson: found.lesson })
    : buildNotFoundMetadata("Lesson not found");
}

const dateLabel = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * A lesson (MVP-048; docs/final-decisions.md, "Learn module design:
 * Workspace"). Three columns on wide screens: the topic's lessons, the
 * current one's ring filling as it is read | the lesson in its fixed shape |
 * "On this page" with the section being read. Below the lg width the lesson
 * list folds into a menu above the lesson, and "On this page" is left out
 * (the sections are short and always the same six). A lesson is public only
 * when it and its topic are both published; anything else is a 404. Behind
 * FEATURE_LEARN.
 *
 * The body is Markdown, rendered by ArticleBody without raw HTML, like guides.
 * "Check yourself" is drawn from the parsed questions as an interactive
 * knowledge check; nothing is stored.
 *
 * Lessons need sign-in (docs/final-decisions.md, 2026-10-08, "Learn: lessons
 * need sign-in; progress saved to the account"). A signed-out visitor sees
 * only the lesson's title, topic and outcomes, and a way to sign in and come
 * back; the page is noindex and carries no article data, since search engines
 * can't read the lesson. A signed-in reader can mark the lesson done; done
 * lessons show a full ring in the lesson list.
 */
export default async function LessonPage({ params }: LessonPageProps) {
  const { topic: topicSlug, lesson: lessonSlug } = await params;
  const found = await getLesson(topicSlug, lessonSlug);
  if (!found) notFound();
  const { topic, lesson } = found;

  const view = lessonView(lesson.body);
  const index = topic.lessons.findIndex((item) => item.slug === lesson.slug);
  const { previous, next } = neighbours(topic.lessons, lesson.position);
  const area = technologyInfo(topic.technology);
  const palette = paletteFor(topic.technology);
  const topicPath = `/topics/${encodeURIComponent(topic.slug)}`;
  const lessonPath = (slug: string) => `${topicPath}/${encodeURIComponent(slug)}`;

  const userId = await currentUserId();
  if (!userId) {
    return (
      <LessonSignIn
        topicTitle={topic.title}
        topicPath={topicPath}
        lessonTitle={lesson.title}
        lessonPath={lessonPath(lesson.slug)}
        outcomes={lesson.outcomes}
        position={index + 1}
        total={topic.lessons.length}
        tint={palette.tint}
      />
    );
  }
  const done = new Set(await learnRepository.listDoneLessonSlugs(userId, topic.slug));

  const lessonList = (
    <ol className="flex flex-col gap-0.5">
      {topic.lessons.map((item, itemIndex) => {
        const current = item.slug === lesson.slug;
        const finished = done.has(item.slug);
        return (
          <li key={item.slug}>
            <Link
              href={lessonPath(item.slug)}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm text-foreground no-underline ${
                current ? `${palette.tint} font-semibold` : "hover:bg-muted"
              }`}
            >
              {finished ? (
                <Ring ratio={1} />
              ) : current ? (
                <ReadingRing />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-[3px] border-muted text-[0.6875rem] font-bold text-muted-foreground"
                >
                  {itemIndex + 1}
                </span>
              )}
              <span>
                <span className="sr-only">Lesson {itemIndex + 1}: </span>
                {item.title}
                {finished ? <span className="sr-only"> (done)</span> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <main className="px-4 pb-16 md:px-6">
      <div className="mx-auto mt-6 grid max-w-[77.5rem] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,44rem)_13rem]">
        <aside aria-labelledby="topic_lessons" className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-3">
            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${palette.tint} ${palette.ink}`}
            >
              {area.name}
            </span>
            <p id="topic_lessons" className="font-display text-base leading-snug font-bold">
              <Link href={topicPath} className="text-foreground no-underline hover:underline">
                {topic.title}
              </Link>
            </p>
            {lessonList}
          </div>
        </aside>

        <article key={lesson.slug} className="motion-rise min-w-0">
          <details className="mb-6 rounded-[1.25rem] border border-border bg-card p-4 lg:hidden">
            <summary className="min-h-11 cursor-pointer font-semibold">
              {topic.title}: lesson {index + 1} of {topic.lessons.length}
            </summary>
            <div className="mt-2">{lessonList}</div>
          </details>
          <Breadcrumbs
            items={[
              { name: "Learn", href: "/topics" },
              { name: topic.title, href: topicPath },
              { name: `Lesson ${index + 1} of ${topic.lessons.length}` },
            ]}
            endsAtCurrentPage={false}
          />
          <h1 className="mt-3 text-[2.125rem] leading-[1.06] font-bold md:text-[2.75rem]">
            {lesson.title}
          </h1>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{lesson.minutes} min</span>
            {lesson.checkedOn ? (
              <span>Checked against Microsoft Learn, {dateLabel(lesson.checkedOn)}</span>
            ) : null}
          </p>

          <section
            aria-labelledby="lesson_outcomes"
            className="mt-6 rounded-[1.25rem] bg-stage p-5"
          >
            <h2 id="lesson_outcomes" className="font-display text-base font-bold">
              What you&apos;ll understand
            </h2>
            <ul className="mt-2 list-disc pl-5">
              {lesson.outcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          </section>

          {view.sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id} className="mt-10">
              <h2 id={section.id} className="scroll-mt-28 text-[1.625rem] font-bold">
                {section.title}
              </h2>
              <div className="mt-3">
                {section.title === "Check yourself" ? (
                  <KnowledgeCheck questions={view.checks} />
                ) : section.title === "The important things" ? (
                  <div className="rounded-[1.25rem] border-l-4 border-highlight bg-card p-5">
                    <ArticleBody markdown={section.markdown} />
                  </div>
                ) : (
                  <ArticleBody markdown={section.markdown} />
                )}
              </div>
            </section>
          ))}

          <MarkDoneButton topic={topic.slug} lesson={lesson.slug} done={done.has(lesson.slug)} />

          <nav aria-label="Lessons" className="mt-6 flex flex-col gap-3">
            {next ? (
              <Link
                href={lessonPath(next.slug)}
                className="motion-lift flex items-center gap-4 rounded-[1.25rem] bg-primary p-5 text-primary-foreground no-underline"
              >
                <span className="flex flex-col">
                  <span className="text-sm opacity-80">Next lesson</span>
                  <span className="font-display text-xl font-bold">{next.title}</span>
                </span>
                <span aria-hidden="true" className="ml-auto text-2xl">
                  →
                </span>
              </Link>
            ) : (
              <Link
                href={topicPath}
                className="motion-lift flex items-center gap-4 rounded-[1.25rem] bg-primary p-5 text-primary-foreground no-underline"
              >
                <span className="flex flex-col">
                  <span className="text-sm opacity-80">That was the last lesson</span>
                  <span className="font-display text-xl font-bold">Back to {topic.title}</span>
                </span>
              </Link>
            )}
            {previous ? (
              <Link
                href={lessonPath(previous.slug)}
                className="self-start py-2 underline underline-offset-4"
              >
                ← {previous.title}
              </Link>
            ) : null}
          </nav>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-28">
            <LessonToc items={view.sections.map(({ id, title }) => ({ id, title }))} />
          </div>
        </aside>
      </div>
    </main>
  );
}

/** What a signed-out visitor sees instead of the lesson: what it teaches, and a way in. */
function LessonSignIn(props: {
  topicTitle: string;
  topicPath: string;
  lessonTitle: string;
  lessonPath: string;
  outcomes: string[];
  position: number;
  total: number;
  tint: string;
}) {
  const back = encodeURIComponent(props.lessonPath);
  return (
    <main className="px-4 pb-16 md:px-6">
      <div
        className={`motion-rise mx-auto mt-6 max-w-[46rem] rounded-[2.5rem] px-6 py-10 md:px-12 ${props.tint}`}
      >
        <Breadcrumbs
          items={[
            { name: "Learn", href: "/topics" },
            { name: props.topicTitle, href: props.topicPath },
            { name: `Lesson ${props.position} of ${props.total}` },
          ]}
          endsAtCurrentPage={false}
        />
        <h1 className="mt-3 text-[2.125rem] leading-[1.06] font-bold md:text-[2.75rem]">
          {props.lessonTitle}
        </h1>
        <section
          aria-labelledby="lesson_outcomes"
          className="mt-6 rounded-[1.25rem] bg-card/80 p-5"
        >
          <h2 id="lesson_outcomes" className="font-display text-base font-bold">
            What you&apos;ll understand
          </h2>
          <ul className="mt-2 list-disc pl-5">
            {props.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </section>
        <p className="mt-6 text-lg">
          Lessons are free. Sign in to read this one and keep track of the lessons you finish.
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={`/signin?callbackUrl=${back}`}
            className="motion-press inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground no-underline"
          >
            Sign in to read
          </Link>
          <Link href="/signup" className="underline underline-offset-4">
            Create a free account
          </Link>
        </p>
      </div>
    </main>
  );
}
