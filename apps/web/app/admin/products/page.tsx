import type { ProductRecord } from "@ppu/domain-catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogRepository } from "../../../lib/catalog";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
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

export const metadata: Metadata = { title: `Products | ${SITE_NAME}` };

// Reads the database per request.
export const dynamic = "force-dynamic";

type Status = "all" | "drafts" | "published" | "suspended" | "archived";

const STATUS_OF: Record<ProductRecord["status"], Exclude<Status, "all">> = {
  DRAFT: "drafts",
  PUBLISHED: "published",
  SUSPENDED: "suspended",
  ARCHIVED: "archived",
};

const LABEL: Record<Exclude<Status, "all">, StatusLabel> = {
  drafts: "Draft",
  published: "Published",
  suspended: "Suspended",
  archived: "Archived",
};

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_7.5rem_11rem_9.5rem]";

type Search = { q?: string | string[]; status?: string | string[] };
const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : value?.[0];

/**
 * The marketplace products (MVP-052 phase 2; first MVP-012), with search and
 * status tabs. Each row: the product, its category, its status, and Edit or,
 * once published, View. Admins only; anyone else gets the site's 404.
 */
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  if (!(await requireAdmin())) notFound();
  const params = await searchParams;
  const query = (first(params.q) ?? "").trim().slice(0, 200);
  const statusParam = first(params.status);
  const status: Status =
    statusParam === "drafts" ||
    statusParam === "published" ||
    statusParam === "suspended" ||
    statusParam === "archived"
      ? statusParam
      : "all";

  const [products, categories] = await Promise.all([
    catalogRepository.listProductsForAdmin(),
    catalogRepository.listCategories().catch(() => []),
  ]);
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));
  const needle = query.toLowerCase();
  const matching = products.filter(
    (product) =>
      !needle ||
      product.name.toLowerCase().includes(needle) ||
      product.slug.includes(needle) ||
      product.summary.toLowerCase().includes(needle),
  );
  const count = (key: Status) =>
    key === "all"
      ? matching.length
      : matching.filter((product) => STATUS_OF[product.status] === key).length;
  const shown =
    status === "all"
      ? matching
      : matching.filter((product) => STATUS_OF[product.status] === status);

  return (
    <main className="flex flex-col gap-6 pb-10">
      <AdminPageHeader
        title="Products"
        description="Marketplace products: drafts, what's live, and what's suspended or archived."
        actions={
          <Link
            href="/admin/products/new"
            className={`${ADMIN_ACTION} bg-primary text-primary-foreground`}
          >
            New product
          </Link>
        }
      />
      <ListToolbar
        path="/admin/products"
        noun="products"
        query={query}
        status={status}
        tabs={[
          { key: "all", label: "All", count: count("all") },
          { key: "drafts", label: "Drafts", count: count("drafts") },
          { key: "published", label: "Published", count: count("published") },
          { key: "suspended", label: "Suspended", count: count("suspended") },
          { key: "archived", label: "Archived", count: count("archived") },
        ]}
      />
      <ListFrame
        headings={["Product", "Status", "Category", "Actions"]}
        columns={COLUMNS}
        empty={
          products.length === 0 ? (
            <>No products yet. Start one with New product.</>
          ) : (
            <>No products match. Try another search or tab.</>
          )
        }
      >
        {shown.map((product) => {
          const state = STATUS_OF[product.status];
          return (
            <ListRow key={product.id} columns={COLUMNS}>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="font-semibold text-foreground no-underline hover:underline"
                >
                  {product.name}
                </Link>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {product.summary}
                </p>
              </div>
              <StatusPill status={LABEL[state]} />
              <p className="text-sm text-muted-foreground">
                {categoryName.get(product.categoryId) ?? "No category"}
              </p>
              <RowActions>
                {state === "published" ? (
                  <Link
                    href={`/products/${encodeURIComponent(product.slug)}`}
                    className={ROW_LINK}
                    aria-label={`View ${product.name}`}
                  >
                    View
                  </Link>
                ) : null}
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className={ROW_LINK}
                  aria-label={`Edit ${product.name}`}
                >
                  Edit
                </Link>
              </RowActions>
            </ListRow>
          );
        })}
      </ListFrame>
    </main>
  );
}
