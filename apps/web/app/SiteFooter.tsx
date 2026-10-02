import { TECHNOLOGIES } from "@ppu/domain-content";
import Link from "next/link";
import { ARTICLE_TYPE_SECTIONS, SECTION_ANCHOR } from "../lib/article-types";
import { componentsEnabled } from "../lib/feature-flags";
import { SITE_NAME } from "../lib/seo/site";
import { ALL_AREAS } from "./[technology]/OtherAreas";
import { BrandMark } from "./BrandMark";

/** "Microsoft, Power Apps, Power Automate, ... and Power Pages", from the registry. */
const TRADEMARKS = ["Microsoft", ...TECHNOLOGIES.map((entry) => entry.name)];
const TRADEMARK_LIST = `${TRADEMARKS.slice(0, -1).join(", ")} and ${TRADEMARKS.at(-1)}`;

const COLUMNS: ReadonlyArray<{
  id: string;
  label: string;
  links: ReadonlyArray<{ name: string; href: string }>;
}> = [
  {
    id: "footer-technologies",
    label: "Technologies",
    links: ALL_AREAS.map((area) => ({ name: area.name, href: `/${area.slug}` })),
  },
  {
    id: "footer-learn",
    label: "Guides",
    links: [
      { name: "All guides", href: "/learn" },
      ...ARTICLE_TYPE_SECTIONS.map((section) => ({
        name: section.heading,
        href: `/learn#${SECTION_ANCHOR[section.type]}`,
      })),
    ],
  },
];

const FOOTER_LINK =
  "inline-flex min-h-11 items-center text-foreground no-underline hover:underline md:min-h-9";

/**
 * Site-wide footer (MVP-027; Daylight look, MVP-031; link columns from the
 * "Board fidelity pass", docs/final-decisions.md). Every section of the site
 * gets a plain, descriptive link from every page, which helps readers and
 * crawlers alike. About, Privacy and Terms sit in the notice bar (MVP-032).
 *
 * Carries the standing non-affiliation line: LowCodeStacks never claims
 * Microsoft endorsement, certification or partnership (CLAUDE.md delivery
 * rules), and saying so plainly on every page is the simplest way to keep
 * that true. The trademark notice names exactly the technologies the site
 * covers (the registry). The column labels are not headings, so the footer
 * adds nothing to a page's heading outline.
 */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border px-4 md:px-6">
      <div className="mx-auto grid max-w-[77.5rem] gap-10 py-12 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
        <div className="max-w-md">
          <p className="flex items-center gap-2.5 font-display text-xl font-bold text-foreground">
            <BrandMark size={30} />
            {SITE_NAME}
          </p>
          <p className="mt-3 font-display text-2xl leading-tight font-bold text-foreground">
            Built to <span className="accent-word text-accent">hold up</span>.
          </p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Free Power Platform learning, architecture patterns and reusable components.
          </p>
        </div>
        {/* Two link columns side by side from phone width; from md they join the outer grid. */}
        <div className="grid grid-cols-2 gap-6 md:contents">
          {COLUMNS.map((column) =>
            column.id === "footer-learn" && componentsEnabled()
              ? { ...column, links: [...column.links, { name: "Components", href: "/search" }] }
              : column,
          ).map((column) => (
            <nav key={column.id} aria-labelledby={column.id}>
              <p
                id={column.id}
                className="font-mono text-xs tracking-widest text-muted-foreground uppercase"
              >
                {column.label}
              </p>
              <ul className="mt-3 flex flex-col text-[0.9375rem]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={FOOTER_LINK}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="mx-auto flex max-w-[77.5rem] flex-col gap-3 border-t border-border py-6 text-[0.8125rem] leading-relaxed text-muted-foreground md:flex-row md:items-start md:justify-between md:gap-10">
        <p className="max-w-3xl">
          © {new Date().getFullYear()} {SITE_NAME}. Independent site. Not affiliated with, endorsed
          by or certified by Microsoft. {TRADEMARK_LIST} are trademarks of the Microsoft group of
          companies.
        </p>
        {/* MVP-032: who runs the site and the rules, on every page, as the canvas draws them. */}
        <nav aria-label="About and policies">
          <ul className="flex gap-x-5">
            {[
              { name: "About", href: "/about" },
              { name: "Privacy", href: "/privacy" },
              { name: "Terms", href: "/terms" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-foreground underline underline-offset-4 md:min-h-0"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
