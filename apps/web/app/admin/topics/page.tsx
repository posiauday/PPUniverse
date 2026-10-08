import { TOPIC_LESSONS_MIN, technologyInfo } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learnRepository } from "../../../lib/learn";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { LearnPublishControl } from "./LearnForms";

export const metadata: Metadata = { title: `Learn topics | ${SITE_NAME}` };

/**
 * The admin list of Learn topics and their lessons (MVP-048 slice 1b): the
 * agent's imported drafts and anything written here. A lesson shows on the
 * site only when it and its topic are both published. Admins only; anyone
 * else gets the same not-found page.
 */
export default async function AdminTopicsPage() {
  if (!(await requireAdmin())) notFound();
  const topics = await learnRepository.listTopics();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Learn topics</h1>
      <p className="mt-2">
        <Link href="/admin/topics/new">New topic</Link>
      </p>
      <p className="mt-2">
        A topic is {TOPIC_LESSONS_MIN} to 6 lessons. Check each lesson against its sources before
        publishing; a lesson appears on the site only once it and its topic are both published.
      </p>
      {topics.length === 0 ? (
        <p className="mt-8">No topics yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-6">
          {topics.map((topic) => (
            <li key={topic.id} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">
                <Link href={`/admin/topics/${topic.id}/edit`}>{topic.title}</Link>
              </h2>
              <p className="text-sm text-muted-foreground">
                {technologyInfo(topic.technology).name} · {topic.status} · {topic.lessons.length}{" "}
                {topic.lessons.length === 1 ? "lesson" : "lessons"}
              </p>
              {topic.status === "DRAFT" ? (
                <p className="mt-2">
                  <LearnPublishControl
                    endpoint={`/api/admin/topics/${topic.id}/publish`}
                    what="topic"
                  />
                </p>
              ) : null}
              {topic.lessons.length > 0 ? (
                <ol className="mt-3 flex flex-col gap-1">
                  {topic.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex flex-wrap items-center gap-2">
                      <span>
                        {lesson.position}.{" "}
                        <Link href={`/admin/lessons/${lesson.id}/edit`}>{lesson.title}</Link> —{" "}
                        {lesson.status}
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
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
