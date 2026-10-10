import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/require-admin";
import { SITE_NAME } from "../../../../lib/seo/site";
import { TopicForm } from "../LearnForms";
import { AdminPageHeader } from "../../AdminPageHeader";

export const metadata: Metadata = { title: `New topic | ${SITE_NAME}` };

/** Admins only (MVP-048 slice 1b); anyone else gets the not-found page. */
export default async function NewTopicPage() {
  if (!(await requireAdmin())) notFound();
  return (
    <main className="flex max-w-3xl flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/topics", label: "Learn topics" }}
        title="New topic"
        description="It's saved as a draft. Add its lessons next, then publish the topic and each lesson."
      />
      <TopicForm mode="create" />
    </main>
  );
}
