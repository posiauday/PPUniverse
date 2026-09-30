/** Builds `${basePath}?...` with `overrides` applied on top of `current`, dropping any key whose value becomes undefined/empty. Shared by /search and /categories/[slug] so sort/pagination links stay consistent. */
export function buildCatalogUrl(
  basePath: string,
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
