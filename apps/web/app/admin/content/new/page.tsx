import { prisma } from "@ppu/db";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../lib/auth";
import { SITE_NAME } from "../../../../lib/seo/site";
import { AdminPageHeader } from "../../AdminPageHeader";
import { ArticleForm } from "../ArticleForm";

export const metadata: Metadata = { title: `New guide | ${SITE_NAME}` };

/** Same deny-by-default pattern as apps/web/app/admin/content/page.tsx. */
export default async function NewArticlePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    notFound();
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (actor?.role !== "ADMIN") {
    notFound();
  }

  return (
    <main className="flex max-w-5xl flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/content", label: "Guides" }}
        title="New guide"
        description="It's saved as a draft. Once it's saved, preview it, schedule it, or publish it from the list."
      />
      <ArticleForm mode="create" />
    </main>
  );
}
