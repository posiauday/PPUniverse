import { LESSON_POSITION_MAX } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learnRepository } from "../../../../../lib/learn";
import { requireAdmin } from "../../../../../lib/require-admin";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { LearnPublishControl, TopicForm } from "../../LearnForms";

export const metadata: Metadata = { title: `Edit topic | ${SITE_NAME}` };

/** A topic's details and its lessons (MVP-048 slice 1b). Admins only; an unknown id is the same not-found page. */
export default async function EditTopicPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const topic = await learnRepository.findTopicWithLessons((await params).id);
  if (!topic) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Edit topic</h1>
      <p className="mt-1 text-sm text-muted-foreground">{topic.status}</p>
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

      <h2 className="mt-10 text-xl font-semibold">Lessons</h2>
      {topic.lessons.length === 0 ? (
        <p className="mt-2">No lessons yet.</p>
      ) : (
        <ol className="mt-2 flex flex-col gap-1">
          {topic.lessons.map((lesson) => (
            <li key={lesson.id} className="flex flex-wrap items-center gap-2">
              <span>
                {lesson.position}.{" "}
                <Link href={`/admin/lessons/${lesson.id}/edit`}>{lesson.title}</Link> —{" "}
                {lesson.status} · {lesson.minutes} min
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
        <p className="mt-4">
          <Link href={`/admin/topics/${topic.id}/lessons/new`}>Add a lesson</Link>
        </p>
      ) : (
        <p className="mt-4">
          This topic has the most lessons a topic can have ({LESSON_POSITION_MAX}).
        </p>
      )}
    </main>
  );
}
