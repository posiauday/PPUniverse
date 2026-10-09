import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { indexNowKey } from "../../../lib/indexnow";
import { requireAdmin } from "../../../lib/require-admin";
import { SITE_NAME } from "../../../lib/seo/site";
import { siteSwitches } from "../../../lib/site-status";
import { listSiteSwitches } from "../../../lib/site-switches";
import { getSiteUrl } from "../../../lib/site-url";
import { SiteSwitchToggle } from "./SiteSwitchToggle";

export const metadata: Metadata = { title: `Settings | ${SITE_NAME}` };

// Reads the environment per request.
export const dynamic = "force-dynamic";

const EXTERNAL = [
  {
    name: "Google Search Console",
    href: "https://search.google.com/search-console",
    detail: "Indexing, search performance and security issues for Google.",
  },
  {
    name: "Bing Webmaster Tools",
    href: "https://www.bing.com/webmasters",
    detail: "Indexing for Bing, and the AI Performance report for Copilot citations.",
  },
  {
    name: "Brave Search: submit a URL",
    href: "https://search.brave.com/submit-url",
    detail: "Brave has no console; submit the home page here.",
  },
];

/**
 * Settings and switches, and search and indexing (MVP-047, admin panel
 * slice 3). The component library is switched on and off here
 * (docs/final-decisions.md, 2026-10-09); everything else is read only, set in
 * Netlify's environment variables (docs/15-deployment.md). Secret values are
 * never shown, only whether they're set. Admins only.
 */
export default async function AdminSettingsPage() {
  if (!(await requireAdmin())) notFound();
  const switches = siteSwitches();
  const adminSwitches = await listSiteSwitches();
  const site = getSiteUrl();
  const ownFiles = [
    { href: "/sitemap.xml", name: "Sitemap" },
    { href: "/robots.txt", name: "robots.txt" },
    { href: "/learn/feed.xml", name: "Guides feed (RSS)" },
    { href: "/updates/feed.xml", name: "Updates feed (RSS)" },
    ...(indexNowKey() ? [{ href: "/indexnow-key.txt", name: "IndexNow key file" }] : []),
  ];

  return (
    <main className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Settings</h1>
        <p className="mt-2">
          What&rsquo;s switched on. Switch the first ones here; the rest are set in Netlify.
        </p>
      </div>

      <section aria-labelledby="admin_switches_heading">
        <h2 id="admin_switches_heading" className="font-display text-xl font-bold">
          Switch on or off here
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes the live site for everyone at once, and goes in the audit log.
        </p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {adminSwitches.map((item) => (
            <li key={item.key} className="rounded-[1.25rem] border border-border bg-card p-4">
              <p id={`switch_${item.key}`} className="font-semibold">
                {item.name}
              </p>
              <p className="mt-1 text-sm">{item.detail}</p>
              <SiteSwitchToggle
                switchKey={item.key}
                name={item.name}
                labelId={`switch_${item.key}`}
                on={item.on}
              />
              {item.source === "environment" ? (
                <p className="text-sm text-muted-foreground">
                  Not switched here yet, so <code>{item.envName}</code> in Netlify decides. Once you
                  switch it here, this setting wins.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="switches_heading">
        <h2 id="switches_heading" className="font-display text-xl font-bold">
          Set in Netlify
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          To change one, edit it in Netlify (Site configuration → Environment variables), then
          redeploy. See <code>docs/15-deployment.md</code>.
        </p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {switches.map((item) => (
            <li key={item.name} className="rounded-[1.25rem] border border-border bg-card p-4">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {item.name}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                    item.on ? "bg-highlight text-highlight-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {item.on ? "On" : "Off"}
                </span>
              </p>
              <p className="mt-1 text-sm">{item.detail}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Setting: <code>{item.setting}</code>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="search_heading">
        <h2 id="search_heading" className="font-display text-xl font-bold">
          Search and indexing
        </h2>
        {site.ok ? (
          <ul className="mt-3 flex flex-wrap gap-3">
            {ownFiles.map((file) => (
              <li key={file.href}>
                <Link href={file.href} className="font-semibold underline underline-offset-4">
                  {file.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">The site address isn&rsquo;t set, so there is no sitemap yet.</p>
        )}
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {EXTERNAL.map((tool) => (
            <li key={tool.href} className="rounded-[1.25rem] border border-border bg-card p-4">
              <a href={tool.href} className="font-semibold underline underline-offset-4">
                {tool.name}
              </a>
              <p className="mt-1 text-sm">{tool.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
