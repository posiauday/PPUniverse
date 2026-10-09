import { categoryName, type ComponentTeaser } from "@ppu/domain-content";
import Link from "next/link";
import { Breadcrumbs } from "../guides/Breadcrumbs";
import { ComponentArt } from "./ComponentArt";

/**
 * The picture of a component that isn't ready yet, blurred and greyed
 * (docs/final-decisions.md, 2026-10-09, "Coming soon"). Decorative, like
 * ComponentArt itself (aria-hidden); the text around it says what it is.
 *
 * Its few words are blurred on purpose so they can't be read: incidental text
 * in a decorative picture, which WCAG 1.4.3 exempts from contrast. It fades
 * through one CSS filter, not the opacity property, because axe measures
 * opacity but not filters and would otherwise flag the deliberately faded
 * words. Readable text on the card and page keeps full contrast.
 */
export function TeaserArt({
  componentName,
  size = "card",
}: {
  componentName: string;
  size?: "card" | "page";
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none block select-none ${
        size === "page"
          ? "scale-[1.6] [filter:grayscale(1)_blur(5px)_opacity(0.55)]"
          : "[filter:grayscale(1)_blur(2.5px)_opacity(0.6)]"
      }`}
    >
      <ComponentArt componentName={componentName} />
    </span>
  );
}

export function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background ${className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-highlight" />
      Coming soon
    </span>
  );
}

/**
 * A component's page while it's marked Coming soon (docs/final-decisions.md,
 * 2026-10-09): what it is, and a blurred picture of it. Nothing to copy, no
 * live preview and no guide until it's paste-tested and published.
 */
export function ComingSoonComponent({ teaser }: { teaser: ComponentTeaser }) {
  return (
    <main className="mx-auto max-w-[76rem] px-4 py-8 md:px-6">
      <Breadcrumbs items={[{ name: "Components", href: "/components" }, { name: teaser.title }]} />
      <header className="relative mt-4 overflow-hidden rounded-[2rem] bg-stage px-5 py-8 md:px-10 md:py-10">
        <span
          aria-hidden="true"
          className="motion-drift pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-tech-apps opacity-70 blur-3xl"
        />
        <div className="relative max-w-[52rem]">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <ComingSoonBadge />
            <span className="rounded-full bg-card px-3 py-1">Power Apps · canvas component</span>
            <span className="rounded-full bg-card px-3 py-1">{categoryName(teaser.category)}</span>
          </p>
          <h1 className="motion-rise mt-4 font-display text-4xl font-bold md:text-6xl">
            {teaser.title}
          </h1>
          <p className="mt-3 text-lg md:text-xl">{teaser.summary}</p>
        </div>
      </header>

      <section
        aria-labelledby="soon_heading"
        className="relative mt-8 grid min-h-[22rem] place-items-center overflow-hidden rounded-[2rem] border border-border bg-card px-6 py-12"
      >
        <TeaserArt componentName={teaser.componentName} size="page" />
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="max-w-md rounded-[1.5rem] border border-border bg-card/95 p-6 text-center shadow-[0_24px_48px_-24px_rgb(20_20_26/0.45)]">
            <h2 id="soon_heading" className="font-display text-2xl font-bold">
              Coming soon
            </h2>
            <p className="mt-2">
              We&rsquo;re testing {teaser.title} in Power Apps Studio. When it&rsquo;s ready,
              you&rsquo;ll try it live here and copy its YAML
              {teaser.access === "MEMBERS" ? " with a free account" : ""}.
            </p>
            <Link
              href="/components"
              className="mt-4 inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-5 font-semibold no-underline hover:bg-muted"
            >
              See the components you can copy now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
