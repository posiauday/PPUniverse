import { commentsEnabled, componentsEnabled, learnEnabled } from "./feature-flags";
import { googleCredentials } from "./google-auth";
import { indexNowKey } from "./indexnow";
import { getSiteUrl } from "./site-url";

/**
 * What's switched on, for the admin's Settings page (MVP-047, slice 3).
 * Read only: settings live in Netlify's environment variables, so a change
 * needs a redeploy and is never made from the site. Secret values are never
 * shown, only whether they are set.
 */
export interface SiteSwitch {
  name: string;
  on: boolean;
  /** What "on" or "off" means here, in a sentence. */
  detail: string;
  /** The setting that controls it. */
  setting: string;
}

export function siteSwitches(env: Record<string, string | undefined> = process.env): SiteSwitch[] {
  const site = getSiteUrl();
  const emailSet = Boolean(env["RESEND_API_KEY"]);
  return [
    {
      name: "Comments",
      on: commentsEnabled(),
      detail: commentsEnabled()
        ? "Signed-in readers can comment on guides."
        : "The Comments section and its pages are hidden.",
      setting: "FEATURE_COMMENTS (on / off)",
    },
    {
      name: "Components catalog",
      on: componentsEnabled(),
      detail: componentsEnabled()
        ? "The Components link shows in the top bar."
        : "Hidden until the first product is published.",
      setting: "FEATURE_COMPONENTS (on / off)",
    },
    {
      name: "Learn topics",
      on: learnEnabled(),
      detail: learnEnabled()
        ? "/topics is public and the Learn button opens it."
        : "/topics is hidden and the Learn button opens the guides. Publish a topic first.",
      setting: "FEATURE_LEARN (on / off)",
    },
    {
      name: "Google sign-in",
      on: googleCredentials(env) !== null,
      detail: "The Continue with Google button on the sign-in page.",
      setting: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET",
    },
    {
      name: "Sending email",
      on: emailSet,
      detail: emailSet
        ? `Sign-in links and notices are sent from ${env["EMAIL_FROM"] ?? "the default address"}.`
        : "No email provider is set, so sign-in links can't be sent.",
      setting: "RESEND_API_KEY and EMAIL_FROM",
    },
    {
      name: "IndexNow",
      on: indexNowKey(env["INDEXNOW_KEY"]) !== null,
      detail: "Publishing a guide or an update tells Bing and other search engines at once.",
      setting: "INDEXNOW_KEY",
    },
    {
      name: "Site address",
      on: site.ok,
      detail: site.ok
        ? `Canonical links, the sitemap and structured data use ${site.origin}.`
        : "Missing or invalid: canonical links and the sitemap are switched off.",
      setting: "NEXT_PUBLIC_SITE_URL",
    },
    {
      name: "Error monitoring",
      on: Boolean(env["SENTRY_DSN"]),
      detail: "Server errors are reported to the error monitor.",
      setting: "SENTRY_DSN",
    },
  ];
}
