import Link from "next/link";
import { componentsEnabled, learnEnabled } from "../lib/feature-flags";
import { buildTechnologyMenu, type TechnologyMenuArea } from "../lib/technology-menu";
import type { Theme } from "../lib/theme";
import { ALL_AREAS } from "./[technology]/OtherAreas";
import { SITE_NAME } from "../lib/seo/site";
import { BrandMark } from "./BrandMark";
import { HeaderSearch } from "./HeaderSearch";
import { MobileMenu } from "./MobileMenu";
import { TechnologiesMenu } from "./TechnologiesMenu";
import { ThemeToggle } from "./ThemeToggle";
import { UpdatesLink } from "./UpdatesLink";

/** MVP-028: the six technology hubs from the one registry, then Governance &
 * admin (MVP-033). The phone menu shows them as tinted tiles. */
const TECHNOLOGY_LINKS = ALL_AREAS.map((area) => ({
  name: area.name,
  href: `/${area.slug}`,
  tint: area.tint,
}));

/** The main links (docs/final-decisions.md, "Top bar names", MVP-045): the
 * two kinds of guide people come for, each opening its section of /learn,
 * and Components only once the catalog has products (feature flag). The
 * other kinds stay one click away: each technology page, and the Power
 * Platform menu's "every guide by goal" link. */
function mainLinks(): Array<{ name: string; href: string }> {
  return [
    { name: "Fixes", href: "/learn#tutorials" },
    { name: "Patterns", href: "/learn#patterns" },
    ...(componentsEnabled() ? [{ name: "Components", href: "/components" }] : []),
  ];
}

const NAV_LINK =
  "inline-flex min-h-11 items-center rounded-full px-3 text-foreground no-underline hover:bg-muted";

/**
 * Site-wide header (MVP-027; Daylight look, MVP-031): a floating pill with
 * the brand, the main sections, search, sign-in, the theme toggle and the
 * "Learn" call to action. No headings here, so every page's own h1
 * stays its first heading. Links keep a 44px row height (WCAG 2.5.8 target
 * size) and wrap on narrow screens rather than scrolling sideways (1.4.10).
 *
 * Sticky only from the md breakpoint, where it is one row: a wrapped,
 * multi-row header pinned to a phone screen would cover too much of it.
 * html's scroll-padding-top (globals.css) keeps a focused or linked-to
 * element clear of it (WCAG 2.4.11, focus not obscured).
 */
export function SiteHeader({
  theme,
  signedIn,
  menu = buildTechnologyMenu(ALL_AREAS, null),
  updateTimes = [],
}: {
  theme: Theme;
  signedIn: boolean;
  /** The Power Platform menu (lib/technology-menu.ts); without it, areas and sections only. */
  menu?: readonly TechnologyMenuArea[];
  /** Newest published update times, for the Updates badge (lib/update-times.ts). */
  updateTimes?: readonly string[];
}) {
  // MVP-048: the Learn button opens the Learn module once it is switched on;
  // until then it keeps opening the guides.
  const learnHref = learnEnabled() ? "/topics" : "/learn";
  const account = signedIn
    ? { name: "Account", href: "/account/sessions" }
    : { name: "Sign in", href: "/signin" };
  const links = mainLinks();
  return (
    <header className="z-30 bg-background px-3 pt-3 pb-2 md:sticky md:top-0 md:px-6 md:pt-3.5">
      <div className="relative mx-auto flex max-w-[77.5rem] flex-wrap items-center gap-x-2 gap-y-1 rounded-3xl border border-border bg-card/85 py-1.5 pr-1.5 pl-3 sm:gap-x-4 sm:pl-4 shadow-[0_10px_30px_-18px_rgb(20_20_26/0.3)] backdrop-blur-md md:rounded-full">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-foreground no-underline md:mr-2 md:gap-2.5"
        >
          <BrandMark size={32} />
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            {SITE_NAME}
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="hidden grow items-center gap-x-1 text-[0.9375rem] font-medium lg:flex"
        >
          <TechnologiesMenu areas={menu} />
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK}>
              {link.name}
            </Link>
          ))}
          {/* MVP-033 slice D: Updates, with its "new" badge. */}
          <UpdatesLink publishedTimes={updateTimes} className={NAV_LINK} />
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <HeaderSearch />
          <Link href={account.href} className={`${NAV_LINK} font-semibold max-lg:hidden`}>
            {account.name}
          </Link>
          <span className="max-lg:hidden">
            <ThemeToggle initialTheme={theme} />
          </span>
          <Link
            href={learnHref}
            className="motion-press hidden min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground no-underline lg:inline-flex"
          >
            Learn
          </Link>
        </div>
        {/* Below lg: the menu button, and its panel as the header's last row. */}
        <MobileMenu
          links={links}
          technologies={TECHNOLOGY_LINKS}
          account={account}
          themeToggle={<ThemeToggle initialTheme={theme} />}
          updateTimes={updateTimes}
          learnHref={learnHref}
        />
      </div>
    </header>
  );
}
