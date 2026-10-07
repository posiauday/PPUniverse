import type { Metadata } from "next";
import { HOW_WE_WRITE_PAGE } from "../../lib/legal/pages";
import { buildInfoPageMetadata } from "../../lib/seo/metadata";
import { getSiteUrl } from "../../lib/site-url";
import { InfoPageView } from "../InfoPageView";

// MVP-042: how guides are written and checked (the trust strip links here).
export function generateMetadata(): Metadata {
  return buildInfoPageMetadata({
    site: getSiteUrl(),
    path: HOW_WE_WRITE_PAGE.path,
    title: HOW_WE_WRITE_PAGE.title,
    description: HOW_WE_WRITE_PAGE.description,
  });
}

export default function Page() {
  return <InfoPageView page={HOW_WE_WRITE_PAGE} />;
}
