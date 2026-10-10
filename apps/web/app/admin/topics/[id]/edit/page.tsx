import { LESSON_POSITION_MAX } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learnRepository } from "../../../../../lib/learn";
import { requireAdmin } from "../../../../../lib/require-admin";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { LearnPublishControl, TopicForm } from "../../LearnForms";
import { STATUS_WORD, StatusPill } from "../../../AdminList";
import { AdminPageHeader } from "../../../AdminPageHeader";

export const metadata: Metadata = { title: `Edit topic | ${SITE_NAME}` };

/** A topic's details and its lessons (MVP-048 slice 1b). Admins only; an unknown id is the same not-found page. */
export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const topic = await learnRepository.findTopicWithLessons((await params).id);
  if (!topic) notFound();

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/topics", label: "Learn topics" }}
        title="Edit topic"
        actions={<StatusPill status={STATUS_WORD[topic.status]} />}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <TopicForm
          mode="edit"
          topicId={topic.id}
          initialValues={{
            slug: topic.slug,
            title: topic.title,
            summary: topic.summary,
            technology: topic.technology,
            sortOrder: String(topic.sortOrder),
          }}
        />

        <section
          aria-labelledby="lessons_heading"
          className="flex flex-col gap-3 rounded-[1.5rem] border border-border bg-card p-5"
        >
          <h2 id="lessons_heading" className="font-display text-xl font-bold">
            Lessons
          </h2>
          {topic.lessons.length === 0 ? (
            <p className="text-muted-foreground">No lessons yet.</p>
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {topic.lessons.map((lesson) => (
                <li key={lesson.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">
                      {lesson.position}.{" "}
                      <Link href={`/admin/lessons/${lesson.id}/edit`}>{lesson.title}</Link>
                    </span>
                    <StatusPill status={STATUS_WORD[lesson.status]} />
                    <span className="text-sm text-muted-foreground">{lesson.minutes} min</span>
                  </span>
                  {lesson.status === "DRAFT" ? (
                    <LearnPublishControl
                      endpoint={`/api/admin/lessons/${lesson.id}/publish`}
                      what="lesson"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          )}
          {topic.lessons.length < LESSON_POSITION_MAX ? (
            <Link
              href={`/admin/topics/${topic.id}/lessons/new`}
              className="inline-flex min-h-11 w-fit items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground no-underline hover:border-foreground"
            >
              Add a lesson
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              This topic has the most lessons a topic can have ({LESSON_POSITION_MAX}).
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
