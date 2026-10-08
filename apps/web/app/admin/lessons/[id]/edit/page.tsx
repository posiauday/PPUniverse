import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learnRepository } from "../../../../../lib/learn";
import { requireAdmin } from "../../../../../lib/require-admin";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { LessonForm } from "../../../topics/LearnForms";

export const metadata: Metadata = { title: `Edit lesson | ${SITE_NAME}` };

/** Admins only (MVP-048 slice 1b). An unknown id is the same not-found page. */
export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const lesson = await learnRepository.findLessonById((await params).id);
  if (!lesson) notFound();
  const topic = await learnRepository.findTopicById(lesson.topicId);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Edit lesson</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {lesson.status} · in{" "}
        <Link href={`/admin/topics/${lesson.topicId}/edit`}>{topic?.title ?? "its topic"}</Link>
      </p>
      <LessonForm
        mode="edit"
        topicId={lesson.topicId}
        lessonId={lesson.id}
        initialValues={{
          title: lesson.title,
          slug: lesson.slug,
          position: String(lesson.position),
          minutes: String(lesson.minutes),
          outcomes: lesson.outcomes.join("\n"),
          checkedOn: lesson.checkedOn ? lesson.checkedOn.toISOString().slice(0, 10) : "",
          body: lesson.body,
        }}
      />
    </main>
  );
}
