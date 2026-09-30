import Link from "next/link";

/**
 * Visible breadcrumb trail (SEO story), matching the BreadcrumbList JSON-LD
 * on the same page. The current page is the last item, plain text with
 * aria-current="page" (WAI-ARIA Authoring Practices breadcrumb pattern).
 */
export function Breadcrumbs({ items }: { items: ReadonlyArray<{ name: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-x-2">
        {items.map((item, index) => (
          <li key={`${index}-${item.name}`} className="flex items-center gap-x-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="inline-block py-1 underline">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
