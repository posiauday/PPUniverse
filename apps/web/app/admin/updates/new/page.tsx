import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/require-admin";
import { SITE_NAME } from "../../../../lib/seo/site";
import { UpdateForm } from "../UpdateForm";

export const metadata: Metadata = { title: `New update | ${SITE_NAME}` };

/** Admins only (MVP-033 slice D); anyone else gets the not-found page. */
export default async function NewUpdatePage() {
  if (!(await requireAdmin())) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">New update</h1>
      <UpdateForm mode="create" />
    </main>
  );
}
