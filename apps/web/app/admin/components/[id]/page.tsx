import { canPublishComponent, categoryName, propertyCounts } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { componentRepository } from "../../../../lib/components";
import { requireAdmin } from "../../../../lib/require-admin";
import { SITE_NAME } from "../../../../lib/seo/site";
import {
  CopyYamlButton,
  PublishComponentButton,
  SettingsForm,
  TestRecordForm,
} from "../ComponentAdminControls";

export const metadata: Metadata = { title: `Component | ${SITE_NAME}` };

const DATE = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "UTC" });

/**
 * One library component in the admin (MVP-049): what it is, its properties
 * (read from its YAML), its paste-test record, its settings and publishing.
 * Its content (YAML, guide, variations) is edited in content/components and
 * arrives with the next release. Admins only.
 */
export default async function AdminComponentPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) notFound();
  const component = await componentRepository.findById((await params).id);
  if (!component) notFound();

  return (
    <main className="flex max-w-4xl flex-col gap-8 pb-10">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">
          <Link href="/admin/components">Component library</Link>
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{component.title}</h1>
        <p className="text-sm text-muted-foreground">
          {component.componentName} · {categoryName(component.category)} · version{" "}
          {component.version} · {component.status === "PUBLISHED" ? "Published" : "Draft"}
          {component.hidden ? " · hidden" : ""}
          {component.status !== "PUBLISHED" && component.comingSoon ? " · coming soon" : ""}
        </p>
        <p className="mt-3">{component.summary}</p>
        <p className="mt-2 text-sm">
          {propertyCounts(component.properties)}
          {" · "}
          {component.variations.length}{" "}
          {component.variations.length === 1 ? "variation" : "variations"}
          {component.needsModernControls ? " · needs modern controls" : ""}
        </p>
      </div>

      <section
        aria-labelledby="test_heading"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 id="test_heading" className="text-lg font-semibold">
          1. Paste-test it
        </h2>
        <p className="mt-1">
          {component.testedAt
            ? `This version was tested on ${DATE.format(component.testedAt)} in Studio ${component.testedStudioVersion ?? ""}.`
            : "This version hasn't been tested yet. Paste it into a test app in your developer environment and run its checklist."}
        </p>
        <div className="mt-3">
          <CopyYamlButton yaml={component.yaml} />
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer font-semibold">Show the YAML to paste</summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-muted p-3 text-xs">
            <code>{component.yaml}</code>
          </pre>
        </details>
        <div className="mt-4">
          <TestRecordForm id={component.id} lastVersion={component.testedStudioVersion} />
        </div>
      </section>

      <section
        aria-labelledby="settings_heading"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 id="settings_heading" className="text-lg font-semibold">
          2. Settings
        </h2>
        <div className="mt-3">
          <SettingsForm
            id={component.id}
            access={component.access}
            hidden={component.hidden}
            comingSoon={component.comingSoon}
            published={component.status === "PUBLISHED"}
          />
        </div>
      </section>

      <section
        aria-labelledby="publish_heading"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <h2 id="publish_heading" className="text-lg font-semibold">
          3. Publish
        </h2>
        {component.status === "PUBLISHED" ? (
          <>
            <p className="mt-1">
              Published {component.publishedAt ? DATE.format(component.publishedAt) : ""}. To take
              it off the site, tick &quot;Hide from the site&quot; above.
            </p>
            <p className="mt-3">
              To show it as <strong>Coming soon</strong> again, tick &quot;Show as Coming soon
              instead&quot; in Settings above and save.
            </p>
          </>
        ) : (
          <>
            <p className="mt-1">
              {canPublishComponent(component)
                ? "Tested: you can publish it."
                : "Record a paste-test first: only tested components can be published."}
            </p>
            {component.comingSoon ? (
              <p className="mt-2">
                It shows as <strong>Coming soon</strong> until you publish it. Publishing makes it a
                normal component that people can try and copy.
              </p>
            ) : null}
            <div className="mt-3">
              <PublishComponentButton
                id={component.id}
                canPublish={canPublishComponent(component)}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
