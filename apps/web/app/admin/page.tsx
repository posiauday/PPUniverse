import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { commentsEnabled } from "../../lib/feature-flags";
import { requireAdmin } from "../../lib/require-admin";
import { SITE_NAME } from "../../lib/seo/site";

export const metadata: Metadata = { title: `Admin | ${SITE_NAME}` };

const AREAS = [
  {
    href: "/admin/content",
    name: "Guides",
    description: "Review imported drafts, edit guides and publish them.",
  },
  {
    href: "/admin/updates",
    name: "Updates",
    description: "Check each platform update against its Microsoft link, then publish.",
  },
  {
    href: "/admin/products",
    name: "Components",
    description: "Marketplace products (hidden on the site until the Components flag is on).",
  },
  {
    href: "/admin/deletion-requests",
    name: "Deletion requests",
    description: "Privacy requests to delete an account.",
  },
  {
    href: "/admin/feedback",
    name: "Feedback",
    description: "Reports from readers, and how they answered Did this fix it?",
  },
  {
    href: "/admin/comments",
    name: "Comments",
    description: "Readers' comments on guides: reported ones first. Remove, restore or accept.",
  },
  { href: "/admin/audit", name: "Audit log", description: "Who did what in the admin, and when." },
];

/**
 * The admin home (MVP-034): one place to reach every admin area. Admins
 * only; everyone else gets the same not-found page as the other admin pages,
 * so the admin area isn't revealed.
 */
export default async function AdminHomePage() {
  if (!(await requireAdmin())) notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <ul className="mt-6 flex flex-col gap-4">
        {AREAS.filter((area) => area.href !== "/admin/comments" || commentsEnabled()).map(
          (area) => (
            <li key={area.href}>
              <Link href={area.href} className="text-lg font-semibold">
                {area.name}
              </Link>
              <p className="text-muted-foreground">{area.description}</p>
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
