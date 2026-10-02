import { normalizeDisplayText } from "@ppu/domain-catalog";
import { ImageResponse } from "next/og";
import { brandMarkSvg } from "../brand-mark";
import { SHARE_IMAGE_SIZE } from "./share-image-size";
import { SITE_NAME } from "./site";

/**
 * Share images (SEO story): the picture a link shows when it is posted to
 * LinkedIn, X, Slack, Teams or a search result. One generated 1200x630 card
 * per page type, carrying the page's own title, so a shared link is
 * recognisable instead of a bare URL.
 *
 * Served from /og/... route handlers, deliberately NOT under /api/: robots.txt
 * disallows /api/, and X's crawler honours robots.txt, so an image there
 * would never be fetched.
 *
 * The text comes only from PUBLISHED database rows looked up by slug -- never
 * from the query string -- so nobody can mint a LowCodeStacks-branded image
 * saying whatever they like. Satori lays the text out as glyphs; it is never
 * parsed as markup.
 */

export const MAX_SHARE_TITLE_LENGTH = 110;

/** The X2 logo as an encoded SVG image, drawn from the same geometry as BrandMark and the favicon. */
const MARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(brandMarkSvg("full")).toString("base64")}`;

/** Browsers and crawlers may cache a card for a day; a title edit shows up by then. */
const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";

/** Cleans and shortens a title so it always fits the card. */
export function shareTitle(text: string | null | undefined): string {
  const cleaned = normalizeDisplayText(text) ?? SITE_NAME;
  if (cleaned.length <= MAX_SHARE_TITLE_LENGTH) return cleaned;
  const cut = cleaned.slice(0, MAX_SHARE_TITLE_LENGTH - 1).replace(/\s+\S*$/, "");
  return `${cut.trimEnd()}…`;
}

export function renderShareImage(input: { eyebrow: string; title: string }): ImageResponse {
  const title = shareTitle(input.title);
  const eyebrow = normalizeDisplayText(input.eyebrow) ?? "";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        // Daylight (MVP-031): warm paper, ink text, a lime eyebrow chip and
        // the X2 "Code stack" logo.
        background: "#fbf8f3",
        color: "#14141a",
      }}
    >
      <div style={{ display: "flex" }}>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            padding: "10px 24px",
            borderRadius: 999,
            background: "#d9f99d",
            color: "#14141a",
          }}
        >
          {eyebrow}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: title.length > 60 ? 60 : 72,
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "center", fontSize: 36 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori draws a plain <img>; next/image does not apply here */}
        <img src={MARK_DATA_URI} width={56} height={56} alt="" style={{ marginRight: 18 }} />
        {SITE_NAME}
      </div>
    </div>,
    { ...SHARE_IMAGE_SIZE, headers: { "Cache-Control": CACHE_CONTROL } },
  );
}

/** A plain 404 for a slug with no published page -- no image, no detail. */
export function shareImageNotFound(): Response {
  return new Response("Not found", { status: 404 });
}
