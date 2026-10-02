import Link from "next/link";

/**
 * Visible breadcrumb trail (SEO story), matching the BreadcrumbList JSON-LD
 * on the same page. The current page is the last item, plain text with
 * aria-current="page" (WAI-ARIA Authoring Practices breadcrumb pattern).
 *
 * Daylight (MVP-031): the trail sits on tinted page headers, so it inherits
 * the surrounding text colour -- always a checked pairing for that surface --
 * rather than a muted grey that is not checked against every tint.
 */
export function Breadcrumbs({
  items,
  endsAtCurrentPage = true,
}: {
  items: ReadonlyArray<{ name: string; href?: string }>;
  /** False when the last item is a label rather than this page (the article
   * trail ends at the guide type, as the canvas draws it). */
  endsAtCurrentPage?: boolean;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2">
        {items.map((item, index) => (
          <li key={`${index}-${item.name}`} className="flex items-center gap-x-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="inline-block py-1 underline underline-offset-4">
                {item.name}
              </Link>
            ) : (
              <span aria-current={endsAtCurrentPage ? "page" : undefined} className="font-semibold">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
