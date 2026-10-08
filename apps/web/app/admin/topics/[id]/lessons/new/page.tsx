import { LESSON_POSITION_MAX } from "@ppu/domain-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { learnRepository } from "../../../../../../lib/learn";
import { requireAdmin } from "../../../../../../lib/require-admin";
import { SITE_NAME } from "../../../../../../lib/seo/site";
import { LessonForm } from "../../../LearnForms";

export const metadata: Metadata = { title: `New lesson | ${SITE_NAME}` };

/** Adds a lesson to a topic (MVP-048 slice 1b). Admins only; an unknown topic is the same not-found page. */
export default async function NewLessonPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const topic = await learnRepository.findTopicWithLessons((await params).id);
  if (!topic) notFound();
  const taken = new Set(topic.lessons.map((lesson) => lesson.position));
  const next = Array.from({ length: LESSON_POSITION_MAX }, (_, index) => index + 1).find(
    (position) => !taken.has(position),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">New lesson</h1>
      <p className="mt-1 text-sm text-muted-foreground">In “{topic.title}”</p>
      <LessonForm
        mode="create"
        topicId={topic.id}
        initialValues={{
          title: "",
          slug: "",
          position: next ? String(next) : "",
          minutes: "10",
          outcomes: "",
          checkedOn: "",
          body: "",
        }}
      />
    </main>
  );
}
