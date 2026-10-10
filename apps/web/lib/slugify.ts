/** The longest slug the editors suggest; the server allows up to 200. */
const SUGGESTED_MAX = 80;

/**
 * A suggested slug for a title, in the shape every slug must have:
 * lower-case letters and numbers joined by single hyphens (MVP-052 phase 4).
 * Accents are dropped ("é" becomes "e"), apostrophes are removed so "What's
 * new" is "whats-new", "&" reads as "and", and anything else separates
 * words. Long titles are cut at a word, so the address stays readable. The
 * server still validates whatever is sent.
 */
export function slugify(title: string): string {
  const words = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, "")
    .replace(/&/g, " and ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  let slug = "";
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word;
    if (next.length > SUGGESTED_MAX) return slug || word.slice(0, SUGGESTED_MAX);
    slug = next;
  }
  return slug;
}
