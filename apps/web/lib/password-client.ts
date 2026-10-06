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
