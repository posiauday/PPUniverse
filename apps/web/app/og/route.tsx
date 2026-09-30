import { renderShareImage } from "../../lib/seo/share-image";

/** The site-wide share image: home page, /learn hub and category pages (SEO story). */
export function GET(): Response {
  return renderShareImage({
    eyebrow: "Power Platform learning and reusable assets",
    title: "Tutorials, patterns and components for Power Apps, Power Automate and Power BI",
  });
}
