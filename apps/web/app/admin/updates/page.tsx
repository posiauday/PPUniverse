import { UPDATE_KIND_LABEL, isValidTechnology, type UpdateRecord } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { TECHNOLOGY_OPTIONS } from "../../../lib/technology-options";
import { paletteFor } from "../../../lib/technology-palette";
import { updateRepository } from "../../../lib/updates";
import {
  ListFrame,
  ListRow,
  ListToolbar,
  ROW_LINK,
  RowActions,
  StatusPill,
  type StatusLabel,
} from "../AdminList";
import { ADMIN_ACTION, AdminPageHeader } from "../AdminPageHeader";
import { LocalTime } from "../LocalTime";
import { UpdatePublishControl } from "./UpdatePublishControl";

export const metadata: Metadata = { title: `Updates | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type Status = "all" | "drafts" | "scheduled" | "published";

function statusOf(update: UpdateRecord): Exclude<Status, "all"> {
  if (update.status === "PUBLISHED") return "published";
  return update.scheduledFor ? "scheduled" : "drafts";
}

const LABEL: Record<Exclude<Status, "all">, StatusLabel> = {
  drafts: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_7.5rem_10rem_23.5rem]";

type Search = { q?: string | string[]; status?: string | string[]; tech?: string | string[] };
const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : value?.[0];

/**
 * The platform updates (MVP-052 phase 2; first MVP-033 slice D): the imported
 * drafts and anything written here, with search, status tabs and a technology
 * filter. Check each draft against its Microsoft source before publishing;
 * published updates appear on /updates and in the header count. Admins only;
 * anyone else gets the site's 404.
 */
export default async function AdminUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  if (!(await requireAdmin())) notFound();
  const params = await searchParams;
  const query = (first(params.q) ?? "").trim().slice(0, 200);
  const statusParam = first(params.status);
  const status: Status =
    statusParam === "drafts" || statusParam === "scheduled" || statusParam === "published"
      ? statusParam
      : "all";
  const techParam = first(params.tech) ?? "";
  const tech = techParam === "none" || isValidTechnology(techParam) ? techParam : "";

  const updates = await updateRepository.listUpdates();
  const needle = query.toLowerCase();
  const matching = updates.filter(
    (update) =>
      (!needle ||
        update.title.toLowerCase().includes(needle) ||
        update.summary.toLowerCase().includes(needle)) &&
      (!tech || (tech === "none" ? update.technology === null : update.technology === tech)),
  );
  const count = (key: Status) =>
    key === "all" ? matching.length : matching.filter((u) => statusOf(u) === key).length;
  const shown = status === "all" ? matching : matching.filter((u) => statusOf(u) === status);
  const totals = (key: Exclude<Status, "all">) => updates.filter((u) => statusOf(u) === key).length;

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Updates"
        description={
          <>
            {totals("published")} published · {totals("drafts")} drafts · {totals("scheduled")}{" "}
            scheduled. Check each draft against its Microsoft source before publishing; published
            updates appear on <Link href="/updates">/updates</Link>.
          </>
        }
        actions={
          <Link
            href="/admin/updates/new"
            className={`${ADMIN_ACTION} bg-primary text-primary-foreground`}
          >
            New update
          </Link>
        }
      />
      <ListToolbar
        path="/admin/updates"
        noun="updates"
        query={query}
        status={status}
        filters={{ tech: tech || undefined }}
        tabs={[
          { key: "all", label: "All", count: count("all") },
          { key: "drafts", label: "Drafts", count: count("drafts") },
          { key: "scheduled", label: "Scheduled", count: count("scheduled") },
          { key: "published", label: "Published", count: count("published") },
        ]}
      >
        <label className="sr-only" htmlFor="updates-tech">
          Technology
        </label>
        <select
          id="updates-tech"
          name="tech"
          defaultValue={tech}
          className="min-h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold"
        >
          <option value="">Any technology</option>
          {TECHNOLOGY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value="none">No technology</option>
        </select>
      </ListToolbar>
      <ListFrame
        headings={["Update", "Status", "Last change", "Actions"]}
        columns={COLUMNS}
        empty={
          updates.length === 0 ? (
            <>No updates yet. Start one with New update.</>
          ) : (
            <>No updates match. Try another search or tab.</>
          )
        }
      >
        {shown.map((update) => {
          const state = statusOf(update);
          const palette = update.technology ? paletteFor(update.technology) : null;
          const area = TECHNOLOGY_OPTIONS.find((option) => option.value === update.technology);
          return (
            <ListRow key={update.id} columns={COLUMNS}>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <Link
                  href={`/admin/updates/${update.id}/edit`}
                  className="font-semibold text-foreground no-underline hover:underline"
                >
                  {update.title}
                </Link>
                <p className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
                  <span className="rounded-full bg-muted px-2 py-px">
                    {UPDATE_KIND_LABEL[update.kind]}
                  </span>
                  {palette && area ? (
                    <span className={`rounded-full px-2 py-px ${palette.tint} ${palette.ink}`}>
                      {area.label}
                    </span>
                  ) : null}
                </p>
              </div>
              <StatusPill status={LABEL[state]} />
              <p className="text-sm text-muted-foreground">
                {state === "published" && update.publishedAt ? (
                  <>Published {DATE.format(update.publishedAt)}</>
                ) : state === "scheduled" && update.scheduledFor ? (
                  <>
                    Goes live <LocalTime iso={update.scheduledFor.toISOString()} />
                  </>
                ) : (
                  <>Edited {DATE.format(update.updatedAt)}</>
                )}
              </p>
              <RowActions>
                {state === "published" ? (
                  <Link
                    href={`/updates#${encodeURIComponent(update.slug)}`}
                    className={ROW_LINK}
                    aria-label={`View ${update.title}`}
                  >
                    View
                  </Link>
                ) : (
                  <Link
                    href={`/preview/updates/${update.id}`}
                    className={ROW_LINK}
                    aria-label={`Preview ${update.title}`}
                  >
                    Preview
                  </Link>
                )}
                <Link
                  href={`/admin/updates/${update.id}/edit`}
                  className={ROW_LINK}
                  aria-label={`Edit ${update.title}`}
                >
                  Edit
                </Link>
                <a
                  href={update.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  className={ROW_LINK}
                  aria-label={`Microsoft source for ${update.title} (opens in a new tab)`}
                >
                  Source ↗
                </a>
                {state !== "published" ? <UpdatePublishControl updateId={update.id} /> : null}
              </RowActions>
            </ListRow>
          );
        })}
      </ListFrame>
    </main>
  );
}
