import { renderShareImage } from "../../lib/seo/share-image";

/** The site-wide share image: home page, /guides hub and category pages (SEO story). */
export function GET(): Response {
  return renderShareImage({
    eyebrow: "Free Power Platform learning",
    title: "Build Power Platform apps that actually hold up",
  });
}
