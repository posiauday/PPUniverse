/**
 * Browser-side calls to the /api/auth/password/* routes (MVP-036). Never
 * throws: a network failure comes back as status 0, so every form can show
 * its "something went wrong" message instead of breaking.
 */
export interface PasswordApiAnswer {
  status: number;
  error?: string;
  problems?: string[];
}

export async function postPasswordApi(
  path: "signup" | "confirm" | "signin" | "forgot" | "reset",
  body: Record<string, string>,
): Promise<PasswordApiAnswer> {
  try {
    const response = await fetch(`/api/auth/password/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: unknown;
      problems?: unknown;
    };
    return {
      status: response.status,
      ...(typeof data.error === "string" ? { error: data.error } : {}),
      ...(Array.isArray(data.problems)
        ? { problems: data.problems.filter((p): p is string => typeof p === "string") }
        : {}),
    };
  } catch {
    return { status: 0 };
  }
}

/**
 * The one-time token from an emailed /password/* link's query string, or
 * null when it is missing or can't be one of ours (32 random bytes as
 * base64url: 43 characters), so the page shows "this link is incomplete"
 * instead of a form that can't work.
 */
export function linkToken(
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const token = searchParams["token"];
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

/** Where a successful password sign-in lands; a full load, so the new session cookie is read. */
export const SIGNED_IN_PATH = "/account/sessions";

/**
 * Where to land after signing in (BUG-040): the sign-in page's callbackUrl when
 * it's a page on this site, so a reader comes back to the page that asked them
 * to sign in (a component's Copy YAML, a guide's comments); otherwise
 * SIGNED_IN_PATH. Never the sign-in page itself.
 *
 * The address is resolved against `origin` and kept only if it stays on it, so
 * nothing the browser would read as another site gets through: "//host",
 * "/\\host", or a slash, a tab or newline and a slash ("/%09/host"), which
 * browsers turn into "//host" (CodeQL js/client-side-unvalidated-url-redirection).
 */
export function continuePath(search: string, origin: string): string {
  const value = new URLSearchParams(search).get("callbackUrl");
  if (!value || !value.startsWith("/")) return SIGNED_IN_PATH;
  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return SIGNED_IN_PATH;
  }
  if (url.origin !== origin) return SIGNED_IN_PATH;
  if (url.pathname === "/signin" || url.pathname.startsWith("/signin/")) return SIGNED_IN_PATH;
  return `${url.pathname}${url.search}${url.hash}`;
}
