# @ppu/ui

Design-token-driven components (MVP-003, `docs/05-ux-design-system.md`). Tailwind v4 (`apps/web/app/globals.css`'s `@theme` block defines the actual token values — colors, spacing — this package's components only reference the semantic Tailwind classes, e.g. `bg-primary`) + shadcn/ui conventions (`class-variance-authority`, `clsx`/`tailwind-merge` via `cn()`), written by hand rather than via the `shadcn` CLI (non-interactive environment).

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Badge` — generic primitives.
- `CategoryCard`, `ProductCard` — catalog-specific composites (MVP-003).

Renders a plain `<a href>`, not `next/link` — this package has no dependency on Next.js (or any framework beyond React), so it stays usable if a non-Next.js consumer ever needs it. Light theme only for now (`docs/05-ux-design-system.md`: "dark theme only after parity"). The filter drawer, header/mega-nav, and other components named in the design system doc are added by the stories that need them (filter drawer is explicitly MVP-004's scope, not MVP-003's).
