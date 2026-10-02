import { Card, CardDescription, CardHeader, CardTitle } from "./card.js";

export interface CategoryCardProps {
  href: string;
  name: string;
  description?: string;
}

/** Plain <a>, not next/link — this package stays framework-portable rather than depending on Next.js. */
export function CategoryCard({ href, name, description }: CategoryCardProps) {
  return (
    <a href={href} className="block h-full text-foreground no-underline">
      <Card className="h-full transition-colors hover:border-foreground">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      </Card>
    </a>
  );
}
