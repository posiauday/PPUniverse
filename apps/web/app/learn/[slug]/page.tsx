import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { contentRepository } from "../../../lib/content";
import { ARTICLE_TYPE_LABEL } from "../../../lib/article-types";
import { findRelatedArticles } from "../../../lib/related-articles";
import { homeUrl, learnIndexUrl, learnUrl } from "../../../lib/seo/canonical";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "../../../lib/seo/json-ld";
import { buildLearnMetadata, buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { getSiteUrl } from "../../../lib/site-url";
import { ArticleBody } from "../ArticleBody";
import { ArticleList } from "../ArticleList";
import { Breadcrumbs } from "../Breadcrumbs";

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
 * Internal links (SEO story): a breadcrumb back to the /learn hub and a
 * "Keep learning" list of related articles, so readers and crawlers can
 * move through the library instead of hitting a dead end.
 */
export default async function LearnPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    notFound();
  }

  const related = await findRelatedArticles(contentRepository, article);
  const site = getSiteUrl();
  const jsonLd = site.ok
    ? buildArticleJsonLd({
        origin: site.origin,
        url: learnUrl(site.origin, article.slug),
        title: article.title,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
      })
    : null;
  const breadcrumbJsonLd = site.ok
    ? buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: homeUrl(site.origin) },
        { name: "Learn", url: learnIndexUrl(site.origin) },
        { name: article.title, url: learnUrl(site.origin, article.slug) },
      ])
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: SITE_NAME, href: "/" },
          { name: "Learn", href: "/learn" },
          { name: article.title },
        ]}
      />
      <p className="mt-4 text-sm text-muted-foreground">{ARTICLE_TYPE_LABEL[article.type]}</p>
      <h1 className="mt-1 text-2xl font-semibold">{article.title}</h1>
      {article.excerpt ? <p className="mt-4 text-muted-foreground">{article.excerpt}</p> : null}

      <ArticleBody markdown={article.body} />

      {related.length > 0 ? (
        <section aria-labelledby="keep-learning" className="mt-12">
          <h2 id="keep-learning" className="text-lg font-semibold">
            Keep learning
          </h2>
          <ArticleList articles={related} headingLevel={3} />
        </section>
      ) : null}

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
