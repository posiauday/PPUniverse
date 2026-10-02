import type { Metadata } from "next";
import { PRIVACY_PAGE } from "../../lib/legal/pages";
import { buildInfoPageMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { InfoPageView } from "../InfoPageView";

// MVP-032 (docs/final-decisions.md, "About, Privacy and Terms pages").
export function generateMetadata(): Metadata {
  return buildInfoPageMetadata({
    site: getSiteUrl(),
    path: PRIVACY_PAGE.path,
    title: PRIVACY_PAGE.title,
    description: PRIVACY_PAGE.description,
  });
}

export default function Page() {
  return <InfoPageView page={PRIVACY_PAGE} />;
}
