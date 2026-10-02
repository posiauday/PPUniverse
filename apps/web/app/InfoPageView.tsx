import { JsonLd } from "@ppu/ui";
import type { InfoPage } from "../lib/legal/pages";
import { outlineOf } from "../lib/article-outline";
import { homeUrl, infoPageUrl } from "../lib/seo/canonical";
import { buildBreadcrumbJsonLd } from "../lib/seo/json-ld";
import { SITE_NAME } from "../lib/seo/site";
import { getSiteUrl } from "../lib/site-url";
import { ArticleBody } from "./learn/ArticleBody";
import { ArticleToc } from "./learn/ArticleToc";

/**
 * About, Privacy and Terms (MVP-032): a Daylight header like the guides
 * library's, then the text in the article layout (contents list | body), so
 * long legal text is as easy to scan as a guide. The text is Markdown from
 * lib/legal/pages.ts, rendered without raw HTML.
 */
export function InfoPageView({ page }: { page: InfoPage }) {
  const site = getSiteUrl();
  const breadcrumbJsonLd = site.ok
    ? buildBreadcrumbJsonLd([
        { name: SITE_NAME, url: homeUrl(site.origin) },
        { name: page.title, url: infoPageUrl(site.origin, page.path) },
      ])
    : null;

  return (
    <main className="px-4 pb-6 md:px-6">
      <header className="motion-rise relative mx-auto mt-2 max-w-[77.5rem] overflow-hidden rounded-[2.5rem] bg-muted px-6 py-12 md:px-16 md:py-16">
        <div aria-hidden="true">
          <span className="shape-sphere motion-bob absolute top-10 right-20 hidden h-[96px] w-[96px] md:block" />
          <span className="shape-pill motion-bob-alt absolute right-44 bottom-12 hidden h-[46px] w-[130px] lg:block" />
        </div>
        <div className="relative flex max-w-3xl flex-col gap-4">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {page.eyebrow}
          </p>
          {/* 2.25rem on phones: "LowCodeStacks," is one long word and must fit 320px. */}
          <h1 className="text-[2.25rem] leading-[0.98] font-extrabold sm:text-5xl md:text-[4.5rem]">
            {page.title}, <span className="accent-word text-accent">{page.accent}.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {page.description}
          </p>
        </div>
      </header>

      <div className="mx-auto mt-12 grid max-w-[77.5rem] gap-10 lg:grid-cols-[15rem_minmax(0,46rem)] lg:gap-16">
        <div>
          <ArticleToc items={outlineOf(page.markdown)} />
        </div>
        <div className="min-w-0">
          <ArticleBody markdown={page.markdown} />
        </div>
      </div>

      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
    </main>
  );
}
