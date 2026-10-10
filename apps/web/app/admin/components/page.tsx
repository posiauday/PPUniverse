import { categoryName } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { componentRepository } from "../../../lib/components";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { componentsLibraryOn } from "../../../lib/site-switches";
import { AdminPageHeader } from "../AdminPageHeader";

export const metadata: Metadata = { title: `Component library | ${SITE_NAME}` };

const DATE = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "UTC" });

/**
 * The admin list of the Power Apps component library (MVP-049): the drafts
 * imported from content/components and anything published. A component
 * needs a recorded paste-test before it can be published. Admins only;
 * anyone else gets the same not-found page.
 */
export default async function AdminComponentsPage() {
  if (!(await requireAdmin())) notFound();
  const components = await componentRepository.listForAdmin();

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Component library"
        description={
          <>
            Components come from <code>content/components</code> as drafts on each release.
            Paste-test each one in your developer environment, record the Studio version, then
            publish it.
          </>
        }
      />
      {!(await componentsLibraryOn()) ? (
        <p className="rounded-xl bg-muted p-3">
          The library pages aren&apos;t public yet: <code>FEATURE_COMPONENTS</code> is off.
          Published components appear on the site once it&apos;s on.
        </p>
      ) : null}
      {components.length === 0 ? (
        <p className="rounded-[1.25rem] border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          No components yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {components.map((component) => (
            <li key={component.id} className="rounded-[1.25rem] border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">
                <Link href={`/admin/components/${component.id}`}>{component.title}</Link>
              </h2>
              <p className="text-sm text-muted-foreground">
                {component.componentName} · {categoryName(component.category)} · version{" "}
                {component.version}
              </p>
              <p className="mt-1 text-sm">
                {component.status === "PUBLISHED" ? "Published" : "Draft"}
                {component.hidden ? " · hidden" : ""}
                {component.status !== "PUBLISHED" && component.comingSoon
                  ? " · coming soon"
                  : ""} · {component.access === "MEMBERS" ? "sign-in to copy" : "anyone can copy"} ·{" "}
                {component.testedAt
                  ? `tested ${DATE.format(component.testedAt)} in Studio ${component.testedStudioVersion ?? ""}`
                  : "not tested yet"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
