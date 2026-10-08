import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/require-admin";
import { SITE_NAME } from "../../../../lib/seo/site";
import { TopicForm } from "../LearnForms";

export const metadata: Metadata = { title: `New topic | ${SITE_NAME}` };

/** Admins only (MVP-048 slice 1b); anyone else gets the not-found page. */
export default async function NewTopicPage() {
  if (!(await requireAdmin())) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">New topic</h1>
      <TopicForm mode="create" />
    </main>
  );
}
