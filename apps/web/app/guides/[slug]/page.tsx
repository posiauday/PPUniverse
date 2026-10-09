import { JsonLd } from "@ppu/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { contentRepository } from "../../../lib/content";
import { loadGuideComments } from "../../../lib/comments";
import { feedbackRepository } from "../../../lib/feedback";
import { outlineOf, readingMinutes } from "../../../lib/article-outline";
import { ARTICLE_KIND, ARTICLE_TYPE_LABEL } from "../../../lib/article-types";
import { readGuideTrust } from "../../../lib/article-trust";
import { HUB_TOPICS } from "../../../lib/technology-hubs";
import { findRelatedArticles } from "../../../lib/related-articles";
import { isAcceptedFix, technologyInfo } from "@ppu/domain-content";
import {
  homeUrl,
  learnIndexUrl,
  learnShareImageUrl,
  learnUrl,
  technologySectionUrl,
} from "../../../lib/seo/canonical";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "../../../lib/seo/json-ld";
import { buildLearnMetadata, buildNotFoundMetadata } from "../../../lib/seo/metadata";
import { SITE_NAME } from "../../../lib/seo/site";
import { getSiteUrl } from "../../../lib/site-url";
import { paletteFor } from "../../../lib/technology-palette";
import { ARTICLE_COVERS } from "../../home/HomeSections";
import { ArticleBody } from "../ArticleBody";
import { GuideComments } from "../GuideComments";
import { GuideFeedback } from "../GuideFeedback";
import { ArticleToc, StickyColumn } from "../ArticleToc";
import { Breadcrumbs } from "../Breadcrumbs";
import { CopyLink } from "../CopyLink";
import { QuickAnswer } from "../QuickAnswer";
import { ReadingProgress } from "../ReadingProgress";
import { TrustStrip } from "../TrustStrip";

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
 * Layout (MVP-027 slice 3, the "A + B -- Article page" mockup): the title
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

  const [related, votes, comments] = await Promise.all([
    findRelatedArticles(contentRepository, article),
    // MVP-039: the counts behind the "Accepted fix" chip. If they can't be
    // read, the page simply shows no chip.
    feedbackRepository.voteSummary(article.id).catch(() => ({ yes: 0, no: 0 })),
    // MVP-040: null while comments are switched off (FEATURE_COMMENTS).
    loadGuideComments(article.id),
  ]);
  const acceptedFix = article.type === "TUTORIAL" && isAcceptedFix(votes);
  const site = getSiteUrl();
  const jsonLd = site.ok
    ? buildArticleJsonLd({
        origin: site.origin,
        url: learnUrl(site.origin, article.slug),
        title: article.title,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        image: learnShareImageUrl(site.origin, article.slug),
      })
    : null;
  // MVP-029: an article in a technology section sits under that section in
  // the trail (LowCodeStacks / Power Apps / title); others under Guides.
  const section = article.technology ? technologyInfo(article.technology) : null;
  const parent = section
    ? { name: section.name, path: `/${section.slug}` }
    : { name: "Guides", path: "/guides" };
  const breadcrumbJsonLd = site.ok
    ? buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: homeUrl(site.origin) },
        {
          name: parent.name,
          url: section
            ? technologySectionUrl(site.origin, parent.path)
            : learnIndexUrl(site.origin),
        },
        { name: article.title, url: learnUrl(site.origin, article.slug) },
      ])
    : null;

  const trust = readGuideTrust(article.body);
  const outline = outlineOf(trust.body);
  const minutes = readingMinutes(article.body);
  const palette = paletteFor(article.technology);
  // The serif accent is the part after the first ": " or "? " (G1 draws
  // "Why didn't my flow trigger? A checklist that finds the cause" that way).
  const split = /[:?] /.exec(article.title);
  const [lead, accent] =
    split && split.index > 0
      ? [article.title.slice(0, split.index + 1), article.title.slice(split.index + 2)]
      : [article.title, ""];
  const cover = ARTICLE_COVERS[article.slug];
  const kind = ARTICLE_KIND[article.type];
  const topic =
    article.technology && article.topic
      ? (HUB_TOPICS[article.technology].find((t) => t.id === article.topic) ?? null)
      : null;
  const sideHeading = article.type === "TUTORIAL" ? "If that wasn't it" : "Keep learning";

  return (
    <main className="px-4 pb-6 md:px-6">
      <ReadingProgress />
      <header
        className={`motion-rise relative mx-auto mt-4 grid max-w-[77.5rem] items-start gap-8 overflow-hidden rounded-[2.5rem] px-6 py-10 md:px-16 md:py-14 ${palette.tint} ${trust.quickAnswer || cover ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12" : ""}`}
      >
        <div className="relative flex flex-col gap-5">
          {/* The G1 trail: area, its section, then the guide's kind. The
              BreadcrumbList JSON-LD below names the area and the guide. */}
          <Breadcrumbs
            items={[
              ...(section
                ? [{ name: section.name, href: parent.path }]
                : [{ name: "Guides", href: "/guides" }]),
              ...(section && topic
                ? [{ name: topic.name, href: `${parent.path}#${topic.id}` }]
                : []),
              { name: kind.label },
            ]}
            endsAtCurrentPage={false}
          />
          <h1 className="text-4xl leading-[1.04] font-bold md:text-[3.5rem]">
            {lead}
            {accent ? (
              <>
                {" "}
                <span className={`accent-word text-[1.08em] ${palette.ink}`}>{accent}</span>
              </>
            ) : null}
          </h1>
          {article.excerpt ? (
            <p className="max-w-3xl text-lg leading-relaxed md:text-[1.1875rem]">
              {article.excerpt}
            </p>
          ) : null}
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {section ? (
              <span className="rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground">
                {section.name}
              </span>
            ) : null}
            <span className="rounded-full bg-card/80 px-3.5 py-1.5">
              {ARTICLE_TYPE_LABEL[article.type]}
            </span>
            <span className="rounded-full bg-card/80 px-3.5 py-1.5">{minutes} min read</span>
            {acceptedFix ? (
              <span className="rounded-full bg-highlight px-3.5 py-1.5 text-highlight-foreground">
                <span aria-hidden="true">✓ </span>Accepted fix
              </span>
            ) : null}
          </p>
          <TrustStrip trust={trust} updatedAt={article.updatedAt} />
        </div>
        {trust.quickAnswer ? (
          <QuickAnswer title={trust.quickAnswer.title} markdown={trust.quickAnswer.markdown} />
        ) : cover ? (
          <div aria-hidden="true" className="relative hidden h-[240px] place-items-center lg:grid">
            {cover}
            <span className="shape-sphere motion-bob absolute top-0 right-0 h-[70px] w-[70px]" />
            <span className="shape-pill motion-bob-alt absolute bottom-2 left-0 h-[34px] w-[90px]" />
          </div>
        ) : null}
      </header>

      {/* Contents | the guide | the side column (G1). Below xl the side
          column follows the guide; it is in the page once either way. */}
      <div className="mx-auto mt-12 grid max-w-[77.5rem] gap-10 lg:grid-cols-[13.75rem_minmax(0,46rem)] lg:gap-14 xl:grid-cols-[13.75rem_minmax(0,45rem)_minmax(0,1fr)]">
        <StickyColumn>
          <ArticleToc items={outline} />
          {site.ok ? <CopyLink url={learnUrl(site.origin, article.slug)} /> : null}
        </StickyColumn>
        <div className="min-w-0">
          <ArticleBody markdown={trust.body} />
          <GuideFeedback slug={article.slug} isFix={article.type === "TUTORIAL"} />
          {comments ? (
            <GuideComments
              slug={article.slug}
              comments={comments.comments}
              viewer={comments.viewer}
            />
          ) : null}
        </div>
        {related.length > 0 ? (
          <aside
            aria-labelledby="related_heading"
            className="flex flex-col gap-3.5 [overflow-wrap:anywhere] lg:col-span-2 xl:sticky xl:top-28 xl:col-span-1 xl:max-h-[calc(100vh-8rem)] xl:self-start xl:overflow-y-auto xl:pr-1"
          >
            <h2
              id="related_heading"
              className="font-mono text-[0.6875rem] font-medium tracking-[0.12em] text-muted-foreground uppercase"
            >
              {sideHeading}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {related.slice(0, 4).map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${encodeURIComponent(guide.slug)}`}
                    className={`motion-lift flex h-full flex-col gap-1.5 rounded-[1.375rem] p-4.5 text-foreground no-underline ${paletteFor(guide.technology).tint}`}
                  >
                    <span
                      className={`self-start rounded-full px-2 py-0.5 font-mono text-[0.6875rem] uppercase ${ARTICLE_KIND[guide.type].className}`}
                    >
                      {ARTICLE_KIND[guide.type].label}
                    </span>
                    <span className="font-display text-[1.0625rem] leading-snug font-bold">
                      {guide.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/guides"
              className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
            >
              All guides →
            </Link>
          </aside>
        ) : null}
      </div>

      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
