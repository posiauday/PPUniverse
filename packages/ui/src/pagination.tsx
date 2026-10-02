export interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}

const PILL =
  "inline-flex min-h-11 items-center rounded-full border-[1.5px] border-foreground px-5 font-semibold text-foreground no-underline hover:bg-muted";

/** Plain prev/next links — no link is rendered at all past either edge, rather than a disabled-looking dead link. */
export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between text-sm">
      {page > 1 ? (
        <a href={hrefFor(page - 1)} className={PILL}>
          &larr; Previous
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
      <span className="text-muted-foreground" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <a href={hrefFor(page + 1)} className={PILL}>
          Next &rarr;
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
