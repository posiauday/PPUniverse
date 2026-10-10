import { prisma } from "@ppu/db";
import { formatPrice } from "@ppu/domain-commerce";
import { checkProductPublishReadiness } from "@ppu/domain-catalog";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../../lib/auth";
import { catalogRepository } from "../../../../../lib/catalog";
import { commerceRepository } from "../../../../../lib/commerce";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { ProductForm } from "../../ProductForm";
import { CompatibilityEditor } from "./CompatibilityEditor";
import { LicensesEditor } from "./LicensesEditor";
import { PriceEditor } from "./PriceEditor";
import { ProductPublishControl } from "./ProductPublishControl";
import { ProductStatusControl } from "./ProductStatusControl";
import { ReleasesEditor } from "./ReleasesEditor";
import { SupportPolicyEditor } from "./SupportPolicyEditor";
import { STATUS_WORD, StatusPill } from "../../../AdminList";
import { AdminPageHeader } from "../../../AdminPageHeader";

export const metadata: Metadata = { title: `Edit product | ${SITE_NAME}` };

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

/**
 * The MVP-012 product/release editor (FR-009). Same deny-by-default
 * pattern as apps/web/app/admin/content/[id]/edit/page.tsx: no session,
 * wrong role, or an unknown product id are all the identical Next.js
 * not-found page -- no information about which case it is. Loads every
 * piece of state its sub-editors need server-side (core fields, category
 * list, assigned licenses, support policy, compatibility entries, releases
 * with attached files, and the current publish-readiness snapshot) in one
 * request, matching the ArticleForm/edit precedent's shape.
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
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

  const { id } = await params;
  const product = await catalogRepository.findProductByIdForAdmin(id);
  if (!product) {
    notFound();
  }

  const [categories, licenseDefinitions, evidence, releases, snapshot, price] = await Promise.all([
    catalogRepository.listCategories(),
    catalogRepository.listLicenseDefinitions(),
    catalogRepository.getProductEvidenceForAdmin(id),
    catalogRepository.listReleasesForAdmin(id),
    catalogRepository.getProductPublishSnapshot(id),
    commerceRepository.findProductPrice(id),
  ]);
  const readiness = checkProductPublishReadiness(snapshot);

  return (
    <main className="flex max-w-4xl flex-col gap-6 pb-10">
      <AdminPageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title="Edit product"
        description={product.name}
        actions={<StatusPill status={STATUS_WORD[product.status]} />}
      />

      <section
        aria-labelledby="core-fields-heading"
        className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
      >
        <h2 id="core-fields-heading" className="font-display text-xl font-bold">
          Core details
        </h2>
        <ProductForm
          mode="edit"
          productId={product.id}
          categories={categories}
          initialValues={{
            name: product.name,
            slug: product.slug,
            summary: product.summary,
            categoryId: product.categoryId,
          }}
        />
      </section>

      <section
        aria-labelledby="licenses-heading"
        className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
      >
        <h2 id="licenses-heading" className="font-display text-xl font-bold">
          Licenses
        </h2>
        <LicensesEditor
          productId={product.id}
          options={licenseDefinitions}
          initialSelectedIds={evidence.licenseDefinitionIds}
        />
      </section>

      <section
        aria-labelledby="price-heading"
        className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
      >
        <h2 id="price-heading" className="font-display text-xl font-bold">
          Price
        </h2>
        <PriceEditor
          productId={product.id}
          currentPriceLabel={price ? formatPrice(price.amountCents, price.currency) : null}
        />
      </section>

      <section
        aria-labelledby="support-heading"
        className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
      >
        <h2 id="support-heading" className="font-display text-xl font-bold">
          Support policy
        </h2>
        <SupportPolicyEditor
          productId={product.id}
          initialStatus={evidence.support?.status ?? null}
          initialChannel={evidence.support?.channel ?? null}
        />
      </section>

      <section
        aria-labelledby="compatibility-heading"
        className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
      >
        <h2 id="compatibility-heading" className="font-display text-xl font-bold">
          Compatibility
        </h2>
        <CompatibilityEditor productId={product.id} entries={evidence.compatibility} />
      </section>

      <section
        aria-labelledby="releases-heading"
        className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
      >
        <h2 id="releases-heading" className="font-display text-xl font-bold">
          Releases
        </h2>
        <ReleasesEditor
          productId={product.id}
          releases={releases}
          productStatus={product.status}
          productLevelMissingFields={readiness.missingFields.filter((field) => field !== "release")}
        />
      </section>

      {product.status === "DRAFT" ? (
        <section
          aria-labelledby="publish-heading"
          className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
        >
          <h2 id="publish-heading" className="font-display text-xl font-bold">
            Publish
          </h2>
          <ProductPublishControl
            productId={product.id}
            initialMissingFields={readiness.missingFields}
            eligibleReleases={releases
              .filter(
                (release) =>
                  release.publishedAt === null &&
                  release.files.some((file) => file.status === "CLEAN"),
              )
              .map((release) => ({ id: release.id, version: release.version }))}
          />
        </section>
      ) : null}

      {product.status === "PUBLISHED" || product.status === "SUSPENDED" ? (
        <section
          aria-labelledby="status-heading"
          className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5"
        >
          <h2 id="status-heading" className="font-display text-xl font-bold">
            Status
          </h2>
          <ProductStatusControl productId={product.id} currentStatus={product.status} />
        </section>
      ) : null}
    </main>
  );
}
