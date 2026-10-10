import { TOPIC_LESSONS_MIN, technologyInfo } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { learnRepository } from "../../../lib/learn";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { LearnPublishControl } from "./LearnForms";
import { ADMIN_ACTION, AdminPageHeader } from "../AdminPageHeader";

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
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Learn topics"
        description={`A topic is ${TOPIC_LESSONS_MIN} to 6 lessons. Check each lesson against its sources before publishing; a lesson appears on the site only once it and its topic are both published.`}
        actions={
          <Link
            href="/admin/topics/new"
            className={`${ADMIN_ACTION} bg-primary text-primary-foreground`}
          >
            New topic
          </Link>
        }
      />
      {topics.length === 0 ? (
        <p className="rounded-[1.25rem] border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          No topics yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {topics.map((topic) => (
            <li key={topic.id} className="rounded-[1.25rem] border border-border bg-card p-5">
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
