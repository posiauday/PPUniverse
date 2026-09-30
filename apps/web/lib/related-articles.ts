import type { ArticleSummary, ArticleType, ContentRepository } from "@ppu/domain-content";

export const RELATED_ARTICLE_LIMIT = 4;

/**
 * "Keep learning" links under an article (SEO story): internal links let
 * readers -- and crawlers -- move from one article to the next instead of
 * leaving. Same-type articles come first (a tutorial reader gets more
 * tutorials), topped up with the newest articles of any type when there are
 * not enough. Never the article itself, never a duplicate.
 */
export async function findRelatedArticles(
  repository: Pick<ContentRepository, "listPublishedArticleSummaries">,
  article: { slug: string; type: ArticleType },
  limit: number = RELATED_ARTICLE_LIMIT,
): Promise<ArticleSummary[]> {
  const sameType = await repository.listPublishedArticleSummaries({
    limit,
    type: article.type,
    excludeSlug: article.slug,
  });
  if (sameType.length >= limit) return sameType;

  const newest = await repository.listPublishedArticleSummaries({
    limit,
    excludeSlug: article.slug,
  });
  const seen = new Set(sameType.map((summary) => summary.slug));
  const topUp = newest.filter((summary) => !seen.has(summary.slug));
  return [...sameType, ...topUp].slice(0, limit);
}
