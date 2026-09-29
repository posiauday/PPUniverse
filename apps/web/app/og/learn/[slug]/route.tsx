import { ARTICLE_TYPE_LABEL } from "../../../../lib/article-types";
import { contentRepository } from "../../../../lib/content";
import { renderShareImage, shareImageNotFound } from "../../../../lib/seo/share-image";

/** Share image for a PUBLISHED article; the title comes from the database, never the URL (SEO story). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const article = await contentRepository.findPublishedArticleBySlug(slug);
  if (!article) return shareImageNotFound();
  return renderShareImage({ eyebrow: ARTICLE_TYPE_LABEL[article.type], title: article.title });
}
