import { Card, CardDescription, CardHeader, CardTitle } from "./card.js";

export interface CategoryCardProps {
  href: string;
  name: string;
  description?: string;
}

/** Plain <a>, not next/link — this package stays framework-portable rather than depending on Next.js. */
export function CategoryCard({ href, name, description }: CategoryCardProps) {
  return (
    <a href={href} className="block">
      <Card className="transition-colors hover:border-primary">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      </Card>
    </a>
  );
}
