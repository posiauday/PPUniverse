import Link from "next/link";
import type { ViewerSummary } from "../lib/viewer";
import { Avatar } from "./Avatar";
import { learnEnabled } from "../lib/feature-flags";
import { buildTechnologyMenu, type TechnologyMenuArea } from "../lib/technology-menu";
import type { Theme } from "../lib/theme";
import { ALL_AREAS } from "./[technology]/OtherAreas";
import { SITE_NAME } from "../lib/seo/site";
import { BrandMark } from "./BrandMark";
import { GuidesMenu } from "./GuidesMenu";
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

/** The links after the Power Platform and Guides menus (docs/final-decisions.md,
 * 2026-10-09, "Top bar: a Guides menu, Learn coming soon"): Learn, marked Soon
 * until the Learn module is switched on, and Components while the library is
 * switched on. */
export function mainLinks(
  componentsOn: boolean,
  learnOn: boolean,
): Array<{ name: string; href: string; soon?: boolean }> {
  return [
    { name: "Learn", href: "/topics", ...(learnOn ? {} : { soon: true }) },
    ...(componentsOn ? [{ name: "Components", href: "/components" }] : []),
  ];
}

/** The "Soon" mark beside Learn: part of the link's name, so it's read out too. */
function SoonMark() {
  return (
    <span className="ml-1.5 rounded-full bg-highlight px-1.5 py-px text-[0.6875rem] font-semibold text-highlight-foreground">
      Soon
    </span>
  );
}

const NAV_LINK =
  "inline-flex min-h-11 items-center rounded-full px-2.5 text-foreground no-underline hover:bg-muted";

/**
 * Site-wide header (MVP-027; Daylight look, MVP-031): a floating pill with
 * the brand; Power Platform, Guides, Learn (Soon), Components and Updates;
 * then the theme icon, search, and sign-in (or, signed in, the reader's
 * avatar, which opens their account and, for admins, Admin)
 * (docs/final-decisions.md, 2026-10-09, "Top bar"). No headings here, so every page's own h1
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
  viewer = null,
  menu = buildTechnologyMenu(ALL_AREAS, null),
  updateTimes = [],
  componentsOn = false,
}: {
  theme: Theme;
  signedIn: boolean;
  /** The signed-in reader's avatar, name and admin flag (lib/viewer.ts). */
  viewer?: ViewerSummary | null;
  /** The Power Platform menu (lib/technology-menu.ts); without it, areas and sections only. */
  menu?: readonly TechnologyMenuArea[];
  /** Newest published update times, for the Updates badge (lib/update-times.ts). */
  updateTimes?: readonly string[];
  /** The component library's admin switch (lib/site-switches.ts): adds the Components link. */
  componentsOn?: boolean;
}) {
  const account = signedIn
    ? { name: "Account", href: "/account" }
    : { name: "Sign in", href: "/signin" };
  const links = mainLinks(componentsOn, learnEnabled());
  return (
    <header className="z-30 bg-background px-3 pt-3 pb-2 md:sticky md:top-0 md:px-6 md:pt-3.5">
      <div className="relative mx-auto flex max-w-[77.5rem] flex-wrap items-center gap-x-2 gap-y-1 rounded-3xl border border-border bg-card/85 py-1.5 pr-1.5 pl-3 sm:gap-x-3 sm:pl-4 shadow-[0_10px_30px_-18px_rgb(20_20_26/0.3)] backdrop-blur-md md:rounded-full">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-foreground no-underline md:mr-2 md:gap-2.5"
        >
          <BrandMark size={32} />
          {/* Between lg and xl the wordmark is for screen readers only, so the one-row
              bar fits with every link, the badge and the account button. */}
          <span className="font-display text-base font-bold tracking-tight sm:text-lg lg:max-xl:sr-only">
            {SITE_NAME}
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="hidden grow items-center gap-x-1 text-[0.9375rem] font-medium lg:flex"
        >
          <TechnologiesMenu areas={menu} />
          <GuidesMenu />
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK}>
              {link.name}
              {link.soon ? <SoonMark /> : null}
            </Link>
          ))}
          {/* MVP-033 slice D: Updates, with its "new" badge. */}
          <UpdatesLink publishedTimes={updateTimes} className={NAV_LINK} />
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <span className="max-lg:hidden">
            <ThemeToggle initialTheme={theme} />
          </span>
          <HeaderSearch />
          {/* Signed in: the reader's avatar opens their account, where admins also find
              Admin (docs/final-decisions.md, 2026-10-08, "Header: Account holds Admin"). */}
          {signedIn ? (
            <Link
              href={account.href}
              title={account.name}
              className="motion-press inline-grid size-11 place-items-center rounded-full text-foreground no-underline hover:bg-muted max-lg:hidden"
            >
              <Avatar
                seed={viewer?.avatarSeed ?? "account"}
                name={viewer?.displayName ?? undefined}
                size={40}
              />
              <span className="sr-only">{account.name}</span>
            </Link>
          ) : (
            <Link href={account.href} className={`${NAV_LINK} font-semibold max-lg:hidden`}>
              {account.name}
            </Link>
          )}
        </div>
        {/* Below lg: the menu button, and its panel as the header's last row. */}
        <MobileMenu
          links={links}
          technologies={TECHNOLOGY_LINKS}
          account={account}
          themeToggle={<ThemeToggle initialTheme={theme} />}
          updateTimes={updateTimes}
          viewer={viewer}
        />
      </div>
    </header>
  );
}
