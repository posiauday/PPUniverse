import { COMPONENT_CATEGORIES, type ComponentRecord } from "@ppu/domain-content";
import Link from "next/link";

/**
 * The library list beside every component page (MVP-049, design "A · Docs"):
 * published components grouped by category, the current one marked, and a
 * "sign-in" note on the ones that need an account to copy.
 */
export function LibraryNav({
  components,
  currentSlug,
}: {
  components: readonly Pick<ComponentRecord, "slug" | "title" | "category" | "access">[];
  currentSlug?: string;
}) {
  const groups = COMPONENT_CATEGORIES.map((category) => ({
    ...category,
    items: components.filter((component) => component.category === category.id),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Component library" className="text-[0.9375rem]">
      <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
        <Link href="/components" className="no-underline hover:underline">
          All components
        </Link>
      </p>
      {groups.map((group) => (
        <div key={group.id} className="mt-4">
          <p className="font-mono text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {group.name}
          </p>
          <ul className="mt-1">
            {group.items.map((component) => {
              const current = component.slug === currentSlug;
              return (
                <li key={component.slug}>
                  <Link
                    href={`/components/${component.slug}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-10 items-center justify-between gap-2 rounded-xl px-3 no-underline ${
                      current
                        ? "bg-tech-apps font-semibold text-tech-apps-ink"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{component.title}</span>
                    {component.access === "MEMBERS" ? (
                      <span className="text-xs text-muted-foreground">sign-in</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
