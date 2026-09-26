import { prisma } from "@ppu/db";
import { checkProductPublishReadiness } from "@ppu/domain-catalog";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { authOptions } from "../../../../../lib/auth";
import { catalogRepository } from "../../../../../lib/catalog";
import { SITE_NAME } from "../../../../../lib/seo/site";
import { ProductForm } from "../../ProductForm";
import { CompatibilityEditor } from "./CompatibilityEditor";
import { LicensesEditor } from "./LicensesEditor";
import { ProductPublishControl } from "./ProductPublishControl";
import { ReleasesEditor } from "./ReleasesEditor";
import { SupportPolicyEditor } from "./SupportPolicyEditor";

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

  const [categories, licenseDefinitions, evidence, releases, snapshot] = await Promise.all([
    catalogRepository.listCategories(),
    catalogRepository.listLicenseDefinitions(),
    catalogRepository.getProductEvidenceForAdmin(id),
    catalogRepository.listReleasesForAdmin(id),
    catalogRepository.getProductPublishSnapshot(id),
  ]);
  const readiness = checkProductPublishReadiness(snapshot);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <p>Status: {product.status}</p>

      <section aria-labelledby="core-fields-heading">
        <h2 id="core-fields-heading">Core details</h2>
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

      <section aria-labelledby="licenses-heading">
        <h2 id="licenses-heading">Licenses</h2>
        <LicensesEditor
          productId={product.id}
          options={licenseDefinitions}
          initialSelectedIds={evidence.licenseDefinitionIds}
        />
      </section>

      <section aria-labelledby="support-heading">
        <h2 id="support-heading">Support policy</h2>
        <SupportPolicyEditor
          productId={product.id}
          initialStatus={evidence.support?.status ?? null}
          initialChannel={evidence.support?.channel ?? null}
        />
      </section>

      <section aria-labelledby="compatibility-heading">
        <h2 id="compatibility-heading">Compatibility</h2>
        <CompatibilityEditor productId={product.id} entries={evidence.compatibility} />
      </section>

      <section aria-labelledby="releases-heading">
        <h2 id="releases-heading">Releases</h2>
        <ReleasesEditor
          productId={product.id}
          releases={releases}
          productStatus={product.status}
          productLevelMissingFields={readiness.missingFields.filter((field) => field !== "release")}
        />
      </section>

      {product.status === "DRAFT" ? (
        <section aria-labelledby="publish-heading">
          <h2 id="publish-heading">Publish</h2>
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
    </main>
  );
}
