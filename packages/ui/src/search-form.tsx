export interface SearchFormProps {
  action: string;
  defaultValue?: string;
  label?: string;
  /** Other active query params (sort, category) to preserve as hidden inputs — a GET form replaces the whole query string with only its own named fields otherwise, which would silently drop them on submit. */
  preserveParams?: Record<string, string | undefined>;
}

/**
 * A plain GET <form> — submitting it navigates to `${action}?q=...`, so
 * search works with no client-side JavaScript at all and produces a real,
 * shareable, bookmarkable URL.
 */
export function SearchForm({
  action,
  defaultValue,
  label = "Search products",
  preserveParams,
}: SearchFormProps) {
  return (
    <form action={action} method="GET" role="search" className="flex gap-2">
      <label htmlFor="catalog-search-q" className="sr-only">
        {label}
      </label>
      <input
        id="catalog-search-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={label}
        className="flex-1 rounded-card border border-border px-3 py-2 text-sm"
      />
      {preserveParams
        ? Object.entries(preserveParams).map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )
        : null}
      <button
        type="submit"
        className="rounded-card bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Search
      </button>
    </form>
  );
}
