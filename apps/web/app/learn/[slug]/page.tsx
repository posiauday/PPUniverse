import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { contentRepository } from "../../../lib/content";
import { learnUrl } from "../../../lib/seo/canonical";
import { buildArticleJsonLd } from "../../../lib/seo/json-ld";
import { buildLearnMetadata, buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { getSiteUrl } from "../../../lib/site-url";

interface LearnPageProps {
  params: Promise<{ slug: string }>;
}

// See apps/web/app/page.tsx for why these content pages render per-request
// rather than being statically generated at build time.
export const dynamic = "force-dynamic";

// generateMetadata and the page both need the article; cache() shares one
// query between them for the duration of a request.
const getArticle = cache((slug: string) => contentRepository.findPublishedArticleBySlug(slug));

const TYPE_LABEL: Record<string, string> = {
  TUTORIAL: "Tutorial",
  PATTERN: "Pattern",
  COMPARISON: "Comparison",
};

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
 * `body` is Markdown SOURCE, stored untrusted (an ADMIN authors it today,
 * but this is public-facing, so it is treated as though anyone could).
 * Rendered here as plain, PREFORMATTED, escaped text — React escapes every
 * text node automatically, so no HTML in the body can ever execute. This
 * deliberately does not convert Markdown to HTML in this pass (no
 * markdown-rendering or sanitizer dependency is introduced): render-as-
 * escaped-text closes the stored-XSS risk without adding a new dependency
 * or its own security surface, and is the safer, smaller first slice; real
 * Markdown-to-HTML rendering (headings, links, lists) is a reversible
 * follow-up, not a redesign.
 */
export default async function LearnPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    notFound();
  }

  const site = getSiteUrl();
  const jsonLd = site.ok
    ? buildArticleJsonLd({
        url: learnUrl(site.origin, article.slug),
        title: article.title,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-muted-foreground">{TYPE_LABEL[article.type] ?? article.type}</p>
      <h1 className="mt-1 text-2xl font-semibold">{article.title}</h1>
      {article.excerpt ? <p className="mt-4 text-muted-foreground">{article.excerpt}</p> : null}

      <div className="mt-6 whitespace-pre-wrap">{article.body}</div>

      {/* A keyboard stop: the rendered body above is plain text with no
          focusable control of its own (WCAG 2.4.1 — found by the
          accessibility gate's keyboard-traversal check), matching the
          established pattern for the 404 and unsubscribe pages (BUG-008).
          inline-block + vertical padding keeps the link's own clickable box
          at or above the WCAG 2.5.8 24px minimum target size. */}
      <p className="mt-8">
        <Link href="/" className="inline-block py-2">
          Back to the home page
        </Link>
      </p>

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </main>
  );
}
