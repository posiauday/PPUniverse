import type { Metadata } from "next";
import { TERMS_PAGE } from "../../lib/legal/pages";
import { buildInfoPageMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { InfoPageView } from "../InfoPageView";

// MVP-032 (docs/final-decisions.md, "About, Privacy and Terms pages").
export function generateMetadata(): Metadata {
  return buildInfoPageMetadata({
    site: getSiteUrl(),
    path: TERMS_PAGE.path,
    title: TERMS_PAGE.title,
    description: TERMS_PAGE.description,
  });
}

export default function Page() {
  return <InfoPageView page={TERMS_PAGE} />;
}
