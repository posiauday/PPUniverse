/**
 * A path on this site to send the reader to, or null (site review,
 * 2026-10-10; first hardened in BUG-040). The value must start with "/" and is
 * resolved the way a browser would, against `origin`; it is kept only if it
 * stays on that origin. That refuses everything a browser reads as another
 * site: "//host", "/\\host", and a slash, a tab or newline and a slash
 * ("/%09/host"), which browsers turn into "//host" (CodeQL
 * js/client-side-unvalidated-url-redirection). Anything that isn't a string,
 * such as a repeated query parameter, is refused too.
 *
 * The one rule behind every redirect that comes from a URL: the sign-in
 * page's continuePath and the welcome page's safeContinuePath.
 */
export function sameSitePath(value: unknown, origin = "https://same-site.invalid"): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return null;
  }
  if (url.origin !== new URL(origin).origin) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
