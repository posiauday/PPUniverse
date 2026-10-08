/**
 * POSTs a small JSON body from the browser to one of our own routes, and
 * returns the status and the route's error code, if any. Never throws: a
 * network failure is status 0. Used by the guide feedback and comments.
 */
export async function postJson(
  url: string,
  body: Record<string, string>,
): Promise<{ status: number; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: unknown };
    return {
      status: response.status,
      ...(typeof data.error === "string" ? { error: data.error } : {}),
    };
  } catch {
    return { status: 0 };
  }
}
