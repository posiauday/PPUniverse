export interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}

/** Plain prev/next links — no link is rendered at all past either edge, rather than a disabled-looking dead link. */
export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
      {page > 1 ? <a href={hrefFor(page - 1)}>&larr; Previous</a> : <span aria-hidden="true" />}
      <span className="text-muted-foreground" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <a href={hrefFor(page + 1)}>Next &rarr;</a>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
