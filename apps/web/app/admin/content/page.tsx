import { isValidTechnology, type ArticleRecord } from "@ppu/domain-content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLE_KIND } from "../../../lib/article-types";
import { contentRepository } from "../../../lib/content";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { TECHNOLOGY_OPTIONS } from "../../../lib/technology-options";
import { paletteFor } from "../../../lib/technology-palette";
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
import { ArticlePublishControl } from "./ArticlePublishControl";

export const metadata: Metadata = { title: `Guides | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

type Status = "all" | "drafts" | "scheduled" | "published";

function statusOf(article: ArticleRecord): Exclude<Status, "all"> {
  if (article.status === "PUBLISHED") return "published";
  return article.scheduledFor ? "scheduled" : "drafts";
}

const LABEL: Record<Exclude<Status, "all">, StatusLabel> = {
  drafts: "Draft",
  scheduled: "Scheduled",
  published: "Published",
};

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_7.5rem_10rem_17rem]";

type Search = { q?: string | string[]; status?: string | string[]; tech?: string | string[] };
const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : value?.[0];

/**
 * Every guide, as a list with search, status tabs and a technology filter
 * (MVP-052 phase 2; first MVP-017). Each row: the guide, its kind and
 * technology, its status, the last change, and Preview or View, Edit and, for
 * a draft, Publish. Admins only; anyone else gets the site's 404 (the role is
 * read from the database, never the session).
 */
export default async function AdminContentPage({
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

  const articles = await contentRepository.listArticles();
  const needle = query.toLowerCase();
  const matching = articles.filter(
    (article) =>
      (!needle || article.title.toLowerCase().includes(needle) || article.slug.includes(needle)) &&
      (!tech || (tech === "none" ? article.technology === null : article.technology === tech)),
  );
  const count = (key: Status) =>
    key === "all" ? matching.length : matching.filter((a) => statusOf(a) === key).length;
  const shown = status === "all" ? matching : matching.filter((a) => statusOf(a) === status);
  const totals = (key: Exclude<Status, "all">) =>
    articles.filter((a) => statusOf(a) === key).length;

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Guides"
        description={`${totals("published")} published · ${totals("drafts")} drafts · ${totals("scheduled")} scheduled`}
        actions={
          <Link
            href="/admin/content/new"
            className={`${ADMIN_ACTION} bg-primary text-primary-foreground`}
          >
            New guide
          </Link>
        }
      />
      <ListToolbar
        path="/admin/content"
        noun="guides"
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
        <label className="sr-only" htmlFor="guides-tech">
          Technology
        </label>
        <select
          id="guides-tech"
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
        headings={["Guide", "Status", "Last change", "Actions"]}
        columns={COLUMNS}
        empty={
          articles.length === 0 ? (
            <>No guides yet. Start one with New guide.</>
          ) : (
            <>No guides match. Try another search or tab.</>
          )
        }
      >
        {shown.map((article) => {
          const state = statusOf(article);
          const kind = ARTICLE_KIND[article.type];
          const palette = article.technology ? paletteFor(article.technology) : null;
          const area = TECHNOLOGY_OPTIONS.find((option) => option.value === article.technology);
          return (
            <ListRow key={article.id} columns={COLUMNS}>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <Link
                  href={`/admin/content/${article.id}/edit`}
                  className="font-semibold text-foreground no-underline hover:underline"
                >
                  {article.title}
                </Link>
                <p className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
                  <span className={`rounded-full px-2 py-px ${kind.className}`}>{kind.label}</span>
                  {palette && area ? (
                    <span className={`rounded-full px-2 py-px ${palette.tint} ${palette.ink}`}>
                      {area.label}
                    </span>
                  ) : null}
                </p>
              </div>
              <StatusPill status={LABEL[state]} />
              <p className="text-sm text-muted-foreground">
                {state === "published" && article.publishedAt ? (
                  <>Published {DATE.format(article.publishedAt)}</>
                ) : state === "scheduled" && article.scheduledFor ? (
                  <>
                    Goes live <LocalTime iso={article.scheduledFor.toISOString()} />
                  </>
                ) : (
                  <>Edited {DATE.format(article.updatedAt)}</>
                )}
              </p>
              <RowActions>
                {state === "published" ? (
                  <Link
                    href={`/guides/${encodeURIComponent(article.slug)}`}
                    className={ROW_LINK}
                    aria-label={`View ${article.title}`}
                  >
                    View
                  </Link>
                ) : (
                  <Link
                    href={`/preview/guides/${article.id}`}
                    className={ROW_LINK}
                    aria-label={`Preview ${article.title}`}
                  >
                    Preview
                  </Link>
                )}
                <Link
                  href={`/admin/content/${article.id}/edit`}
                  className={ROW_LINK}
                  aria-label={`Edit ${article.title}`}
                >
                  Edit
                </Link>
                {state !== "published" ? <ArticlePublishControl articleId={article.id} /> : null}
              </RowActions>
            </ListRow>
          );
        })}
      </ListFrame>
    </main>
  );
}
