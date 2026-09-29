import { catalogRepository } from "../../../../lib/catalog";
import { renderShareImage, shareImageNotFound } from "../../../../lib/seo/share-image";

/** Share image for a PUBLISHED product; the name comes from the database, never the URL (SEO story). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const product = await catalogRepository.findPublishedProductBySlug(slug);
  if (!product) return shareImageNotFound();
  return renderShareImage({ eyebrow: product.category.name, title: product.name });
}
