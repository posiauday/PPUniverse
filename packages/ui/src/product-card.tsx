import { Badge } from "./badge.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card.js";

export interface ProductCardProps {
  href: string;
  name: string;
  summary: string;
  categoryName: string;
}

/** Plain <a>, not next/link — this package stays framework-portable rather than depending on Next.js. */
export function ProductCard({ href, name, summary, categoryName }: ProductCardProps) {
  return (
    <a href={href} className="block">
      <Card className="transition-colors hover:border-primary">
        <CardHeader>
          <Badge variant="muted" className="w-fit">
            {categoryName}
          </Badge>
          <CardTitle>{name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{summary}</CardDescription>
        </CardContent>
      </Card>
    </a>
  );
}
