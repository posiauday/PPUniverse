import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/require-admin";
import { SITE_NAME } from "../../../../lib/seo/site";
import { AdminPageHeader } from "../../AdminPageHeader";
import { UpdateForm } from "../UpdateForm";

export const metadata: Metadata = { title: `New update | ${SITE_NAME}` };

/** Admins only (MVP-033 slice D); anyone else gets the not-found page. */
export default async function NewUpdatePage() {
  if (!(await requireAdmin())) notFound();
  return (
    <main className="flex max-w-5xl flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/updates", label: "Updates" }}
        title="New update"
        description="It's saved as a draft. Once it's saved, preview it, schedule it, or publish it from the list."
      />
      <UpdateForm mode="create" />
    </main>
  );
}
