import { technologyInfo, type ArticleSummary } from "@ppu/domain-content";
import Link from "next/link";
import { ARTICLE_TYPE_LABEL } from "../../lib/article-types";
import { paletteFor } from "../../lib/technology-palette";

/**
 * The Daylight home page's middle and closing sections (MVP-031). Each takes
 * real data where it shows any, and the page leaves a section out when it has
 * nothing to show.
 */

/**
 * A slow, edge-faded ribbon of guide titles. Purely decorative: a moving list
 * of links would be hard to use, so it is hidden from assistive technology and
 * holds no links; every one of these guides is a real link elsewhere on the
 * page or one click away on /learn. The list is drawn twice so the loop is
 * seamless.
 */
export function TopicRibbon({ titles }: { titles: readonly string[] }) {
  const items = titles.map((title, index) => (
    <span key={index} className="inline-flex items-center gap-3">
      {title}
      <span className="text-accent">✦</span>
    </span>
  ));
  return (
    <div
      aria-hidden="true"
      className="mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
    >
      <div className="motion-marquee flex w-max gap-11 font-display text-[1.75rem] font-semibold tracking-[-0.02em] whitespace-nowrap md:text-[2.125rem]">
        {items}
        {items}
      </div>
    </div>
  );
}

/**
 * "Every guide shows the broken version first": the three-part shape of every
 * guide, beside a code card that flips between the version that breaks and
 * the fix. The code is the delegation guide's real search-box rewrite. Both
 * versions are in the page for everyone; only the visual flip is motion.
 */
export function BrokenFirst() {
  return (
    <section
      aria-labelledby="home_how"
      className="relative mx-auto mt-20 grid max-w-[77.5rem] items-center gap-12 overflow-hidden rounded-[2.25rem] bg-code px-6 py-12 text-code-foreground md:px-16 md:py-16 lg:grid-cols-[1fr_1.1fr]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-[#6c47ff] opacity-55 blur-[110px]"
      />
      <div className="relative flex flex-col gap-7">
        <h2
          id="home_how"
          className="text-4xl leading-[1.02] font-bold text-white md:text-[3.375rem]"
        >
          Every guide shows the <span className="accent-word text-[#d9f99d]">broken</span> version
          first.
        </h2>
        <ol className="flex flex-col gap-4 text-[1.0625rem] leading-normal">
          {[
            [
              "1",
              "bg-[#ff7a59]",
              "The symptom",
              "you actually see: a gallery stuck at 500 rows, a total that's wrong.",
            ],
            [
              "2",
              "bg-[#a3e635]",
              "The fix,",
              "as code you can paste, next to the version that breaks.",
            ],
            ["3", "bg-[#c4b5fd]", "The why,", "with links to the Microsoft Learn pages behind it."],
          ].map(([number, colour, lead, rest]) => (
            <li key={number} className="flex gap-4">
              <span
                aria-hidden="true"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display font-bold text-[#14141a] ${colour}`}
              >
                {number}
              </span>
              <span>
                <b className="text-white">{lead}</b> {rest}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="relative grid gap-4">
        <figure className="motion-swap-before motion-safe:col-start-1 motion-safe:row-start-1 flex flex-col gap-4 rounded-3xl border border-code-border bg-[#1e1e26] p-7">
          <figcaption className="self-start rounded-full bg-[#ff7a59] px-3 py-1 font-mono text-xs text-[#14141a]">
            Before: searches only the first 500 rows
          </figcaption>
          <pre className="overflow-x-auto font-mono text-lg leading-relaxed whitespace-pre-wrap md:text-xl">
            <span className="text-[#fdba74]">Search</span>(Tasks,{"\n"} txtSearch.Value, Title)
          </pre>
          <p className="mt-auto text-[0.9375rem] text-code-muted">
            No error. Just missing results.
          </p>
        </figure>
        <figure className="motion-swap-after motion-safe:col-start-1 motion-safe:row-start-1 flex flex-col gap-4 rounded-3xl border-2 border-[#a3e635] bg-[#1e1e26] p-7 shadow-[0_0_60px_-10px_rgb(163_230_53/0.4)]">
          <figcaption className="self-start rounded-full bg-[#a3e635] px-3 py-1 font-mono text-xs text-[#14141a]">
            After: searches every row
          </figcaption>
          <pre className="overflow-x-auto font-mono text-lg leading-relaxed whitespace-pre-wrap text-white md:text-xl">
            <span className="text-[#d9f99d]">Filter</span>(Tasks,{"\n"}{" "}
            <span className="text-[#d9f99d]">StartsWith</span>(Title, txtSearch.Value))
          </pre>
          <p className="mt-auto text-[0.9375rem] text-code-muted">
            Delegated to SharePoint. Works at any list size.
          </p>
        </figure>
      </div>
    </section>
  );
}

/** A big article card with an illustrated cover, for "Start here". */
export function StartHereCards({ articles }: { articles: readonly ArticleSummary[] }) {
  return (
    <ul className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-3">
      {articles.map((article) => {
        const palette = paletteFor(article.technology);
        const technology = article.technology ? technologyInfo(article.technology) : null;
        return (
          <li
            key={article.slug}
            className="motion-lift relative flex flex-col overflow-hidden rounded-[1.625rem] border border-border bg-card"
          >
            <div
              aria-hidden="true"
              className={`grid h-[210px] place-items-center overflow-hidden ${palette.tint}`}
            >
              {ARTICLE_COVERS[article.slug] ?? (
                <span className="font-display text-7xl font-extrabold text-foreground opacity-80">
                  {ARTICLE_TYPE_LABEL[article.type].charAt(0)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2.5 p-6">
              <p className={`text-[0.8125rem] font-semibold ${palette.ink}`}>
                {technology ? `${technology.name} · ` : ""}
                {ARTICLE_TYPE_LABEL[article.type]}
              </p>
              <h3 className="font-display text-[1.4375rem] leading-[1.18] font-bold tracking-[-0.01em]">
                <Link
                  href={`/learn/${encodeURIComponent(article.slug)}`}
                  className="text-foreground no-underline after:absolute after:inset-0 after:content-[''] hover:underline"
                >
                  {article.title}
                </Link>
              </h3>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Covers for the three launch guides "Start here" names (fixed illustrations). */
export const ARTICLE_COVERS: Readonly<Record<string, React.ReactNode>> = {
  "power-apps-delegation-500-rows": (
    <span className="relative">
      <span className="block font-display text-[7.5rem] leading-none font-extrabold tracking-[-0.04em] text-tech-apps-ink">
        500
      </span>
      <span className="absolute inset-x-[-10px] top-[52%] h-2.5 -rotate-[8deg] rounded-md bg-foreground" />
    </span>
  ),
  "why-are-my-totals-wrong": (
    <span className="flex items-center gap-4">
      <span className="font-display text-[6.875rem] leading-none font-extrabold text-tech-bi-ink">
        Σ
      </span>
      <span className="flex flex-col gap-2">
        <span className="h-[18px] w-[110px] rounded-md bg-[#fcd34d]" />
        <span className="h-[18px] w-20 rounded-md bg-[#fbbf24]" />
        <span className="h-[18px] w-[130px] rounded-md bg-foreground" />
      </span>
    </span>
  ),
  "approvals-that-dont-stall": (
    <span className="flex items-center gap-3.5">
      <span className="relative h-[70px] w-[70px] rounded-full border-8 border-[#2563eb]" />
      <span className="text-[2.125rem] text-tech-automate-ink">→</span>
      <span className="grid h-[70px] w-[70px] place-items-center rounded-[22px] bg-[#14141a]">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a3e635"
          strokeWidth="3.5"
        >
          <path d="M5 12l5 5 9-10" />
        </svg>
      </span>
    </span>
  ),
};

/** The closing lime band. */
export function ClosingBand() {
  return (
    <section
      aria-labelledby="home_cta"
      className="relative mx-auto mt-20 flex max-w-[77.5rem] flex-col items-center gap-6 overflow-hidden rounded-[2.5rem] bg-highlight px-6 py-20 text-center text-highlight-foreground md:py-24"
    >
      <div aria-hidden="true">
        <span className="shape-sphere motion-bob absolute top-14 left-6 h-16 w-16 md:left-[70px] md:h-[104px] md:w-[104px]" />
        <span className="shape-pill-coral motion-bob-alt absolute right-6 bottom-8 hidden h-[60px] w-[170px] md:right-20 md:bottom-14 md:block" />
        <span className="shape-cube motion-bob absolute top-16 right-8 hidden h-[70px] w-[70px] [animation-duration:9s] md:right-[130px] md:block" />
      </div>
      <h2
        id="home_cta"
        className="relative text-5xl leading-[0.96] font-extrabold md:text-[5.75rem]"
      >
        Learn it properly.
        <br />
        <span className="accent-word">Ship it once.</span>
      </h2>
      <p className="relative text-lg md:text-[1.1875rem]">
        Free guides for every Power Platform technology.
      </p>
      <Link
        href="/learn"
        className="motion-press relative inline-flex min-h-[3.75rem] items-center gap-2.5 rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground no-underline"
      >
        Start learning <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
