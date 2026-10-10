import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { learnRepository } from "../../../../../lib/learn";
import { requireAdmin } from "../../../../../lib/require-admin";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { LessonForm } from "../../../topics/LearnForms";
import { STATUS_WORD, StatusPill } from "../../../AdminList";
import { AdminPageHeader } from "../../../AdminPageHeader";

export const metadata: Metadata = { title: `Edit lesson | ${SITE_NAME}` };

/** Admins only (MVP-048 slice 1b). An unknown id is the same not-found page. */
export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const lesson = await learnRepository.findLessonById((await params).id);
  if (!lesson) notFound();
  const topic = await learnRepository.findTopicById(lesson.topicId);

  return (
    <main className="flex max-w-5xl flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: `/admin/topics/${lesson.topicId}/edit`, label: topic?.title ?? "Its topic" }}
        title="Edit lesson"
        actions={<StatusPill status={STATUS_WORD[lesson.status]} />}
      />
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
