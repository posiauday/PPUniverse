import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { contentRepository } from "../../../lib/content";
import { buildLearnMetadata, buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { getSiteUrl } from "../../../lib/site-url";
import { renderGuidePage } from "../guide-page";

interface LearnPageProps {
  params: Promise<{ slug: string }>;
}

// See apps/web/app/page.tsx for why these content pages render per-request
// rather than being statically generated at build time.
export const dynamic = "force-dynamic";

// generateMetadata and the page both need the article; cache() shares one
// query between them for the duration of a request.
const getArticle = cache((slug: string) => contentRepository.findPublishedArticleBySlug(slug));

export async function generateMetadata({ params }: LearnPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return buildNotFoundMetadata("Content not found");
  }
  return buildLearnMetadata({ site: getSiteUrl(), article });
}

/**
 * Published content: tutorials, patterns and comparison pages (MVP-017,
 * FR-014). An unknown slug, or one that exists but is not PUBLISHED, is a
 * 404 — never a distinguishable response, matching the same
 * publicly-visible-only rule the product/category pages already enforce.
 *
 * `body` is Markdown source, stored untrusted (an ADMIN authors it today,
 * but this is public-facing, so it is treated as though anyone could). It is
 * rendered by ArticleBody as real structure -- headings, links, lists,
 * tables, code -- without ever rendering raw HTML (TD-017, resolved by the
 * SEO story). The first pass showed it as escaped plain text; see
 * ArticleBody for why the structured rendering is equally safe.
 *
 * Internal links (SEO story): a breadcrumb back to the /guides hub and a
 * "Keep learning" list of related articles, so readers and crawlers can
 * move through the library instead of hitting a dead end.
 *
 * The page itself is renderGuidePage, shared with the admin's draft preview
 * (MVP-050). Layout (MVP-027 slice 3, the "A + B -- Article page" mockup): the title
 * block, then "On this page" | the article | "Keep learning" as three
 * columns on wide screens and one column, in that order, on narrow ones.
 * Each part is in the page once. The page's own ids contain an underscore,
 * which heading slugs never do, so an article heading cannot collide.
 */
export default async function LearnPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    notFound();
  }

  return renderGuidePage(article);
}
