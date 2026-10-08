import { categoryName } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { componentRepository } from "../../../lib/components";
import { componentsEnabled } from "../../../lib/feature-flags";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";

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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Component library</h1>
      <p className="mt-2">
        Components come from <code>content/components</code> as drafts on each release. Paste-test
        each one in your developer environment, record the Studio version, then publish it.
      </p>
      {!componentsEnabled() ? (
        <p className="mt-2 rounded-xl bg-muted p-3">
          The library pages aren&apos;t public yet: <code>FEATURE_COMPONENTS</code> is off.
          Published components appear on the site once it&apos;s on.
        </p>
      ) : null}
      {components.length === 0 ? (
        <p className="mt-8">No components yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {components.map((component) => (
            <li key={component.id} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold">
                <Link href={`/admin/components/${component.id}`}>{component.title}</Link>
              </h2>
              <p className="text-sm text-muted-foreground">
                {component.componentName} · {categoryName(component.category)} · version{" "}
                {component.version}
              </p>
              <p className="mt-1 text-sm">
                {component.status === "PUBLISHED" ? "Published" : "Draft"}
                {component.hidden ? " · hidden" : ""} ·{" "}
                {component.access === "MEMBERS" ? "sign-in to copy" : "anyone can copy"} ·{" "}
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
