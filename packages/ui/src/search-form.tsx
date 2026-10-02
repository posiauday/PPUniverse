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
    <form action={action} method="GET" role="search" className="relative flex items-center">
      <label htmlFor="catalog-search-q" className="sr-only">
        {label}
      </label>
      {/* The default border token is 1.35:1 against the page; a control's boundary needs 3:1 (BUG-004, WCAG 1.4.11).
          The default placeholder colour is 3.45:1; placeholder text needs 4.5:1 (WCAG 1.4.3). */}
      <input
        id="catalog-search-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={label}
        className="min-h-14 w-full min-w-0 flex-1 rounded-full border-2 border-foreground bg-card py-3 pr-28 pl-5 text-base text-foreground shadow-[0_5px_0_#a3e635] placeholder:text-muted-foreground sm:pr-32 sm:pl-6 sm:text-lg"
      />
      {preserveParams
        ? Object.entries(preserveParams).map(([key, value]) =>
            value ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )
        : null}
      <button
        type="submit"
        className="absolute right-1.5 min-h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground sm:px-6"
      >
        Search
      </button>
    </form>
  );
}
