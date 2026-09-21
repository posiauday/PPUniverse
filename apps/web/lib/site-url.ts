import { logger, type LogFields } from "@ppu/telemetry";

/**
 * The canonical public origin of the site (MVP-021, FR-017), from the dedicated
 * `NEXT_PUBLIC_SITE_URL` variable — never `NEXTAUTH_URL` (authentication-specific)
 * and never the request's Host header. This module is the single validation
 * point for it; no central env-validation module exists in this app.
 *
 * Rules (docs/final-decisions.md, 2026-09-21):
 * - production: an absolute https origin on a public hostname;
 * - development and test: additionally http on localhost/127.0.0.1, and an
 *   unset value falls back to http://localhost:<PORT or 3000>;
 * - anything else — including an unknown or unset NODE_ENV — is treated as
 *   production (fail closed);
 * - the value is normalized to a bare origin (lower-cased host, default port and
 *   trailing slash removed), so "https://Example.com/" and "https://example.com"
 *   produce identical canonical URLs;
 * - the production domain is never inferred or hardcoded (open question 1).
 *
 * Validation is lazy (at request time, not import or build time) and failing
 * safe means: report why, and let callers omit canonical/absolute URLs — the
 * site keeps serving.
 *
 * The variable is read at RUNTIME by server code: verified against a production
 * build made with no value, where supplying one at `next start` took effect, so
 * it can be set per environment at start-up. That depends on the bracket-notation
 * read in `getSiteUrl` below — the dot form `process.env.NEXT_PUBLIC_SITE_URL` is
 * the one Next.js inlines at build time, so do not change it without re-verifying.
 */

export type SiteUrlFailure =
  | "MISSING"
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "HAS_CREDENTIALS"
  | "NOT_AN_ORIGIN"
  | "DISALLOWED_HOST";

export type SiteUrlResult = { ok: true; origin: string } | { ok: false; reason: SiteUrlFailure };

export interface SiteUrlEnv {
  NODE_ENV?: string | undefined;
  NEXT_PUBLIC_SITE_URL?: string | undefined;
  PORT?: string | undefined;
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const IPV4_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;
const DEFAULT_DEV_PORT = "3000";

function failure(reason: SiteUrlFailure): SiteUrlResult {
  return { ok: false, reason };
}

/** Pure validation and normalization; see the module comment for the rules. */
export function resolveSiteUrl(env: SiteUrlEnv): SiteUrlResult {
  const relaxed = env.NODE_ENV === "development" || env.NODE_ENV === "test";
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

  if (raw === "") {
    if (!relaxed) return failure("MISSING");
    const port = env.PORT && /^\d{1,5}$/.test(env.PORT) ? env.PORT : DEFAULT_DEV_PORT;
    return { ok: true, origin: `http://localhost:${port}` };
  }

  // A site origin carries no query or fragment; reject rather than silently drop them.
  if (raw.includes("?") || raw.includes("#")) return failure("NOT_AN_ORIGIN");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return failure("INVALID_URL");
  }

  const isLoopback = LOOPBACK_HOSTS.has(url.hostname);
  if (url.protocol === "http:") {
    if (!(relaxed && isLoopback)) return failure("UNSUPPORTED_PROTOCOL");
  } else if (url.protocol !== "https:") {
    return failure("UNSUPPORTED_PROTOCOL");
  }

  if (url.username !== "" || url.password !== "") return failure("HAS_CREDENTIALS");
  if (url.pathname !== "/") return failure("NOT_AN_ORIGIN");

  if (!relaxed) {
    const host = url.hostname;
    const looksPrivateOrLocal =
      isLoopback ||
      host.endsWith(".localhost") ||
      host.startsWith("[") ||
      IPV4_LITERAL.test(host) ||
      !host.includes(".") ||
      host.endsWith(".");
    if (looksPrivateOrLocal) return failure("DISALLOWED_HOST");
  }

  return { ok: true, origin: url.origin };
}

export interface SiteUrlProviderDeps {
  readEnv: () => SiteUrlEnv;
  logError: (event: string, fields: LogFields) => void;
}

/**
 * Wraps `resolveSiteUrl` with a once-per-provider error report, so a
 * misconfigured production deployment is visible in the logs without flooding
 * them on every request. Next.js can load this module once per server bundle, so
 * a misconfigured process logs a couple of lines at start-up (observed: two),
 * never one per request. Only the failure reason is logged, never request data.
 */
export function createSiteUrlProvider(deps: SiteUrlProviderDeps): () => SiteUrlResult {
  let reported = false;
  return () => {
    const result = resolveSiteUrl(deps.readEnv());
    if (!result.ok && !reported) {
      reported = true;
      deps.logError("seo.site_url_invalid", { reason: result.reason });
    }
    return result;
  };
}

export const getSiteUrl = createSiteUrlProvider({
  readEnv: () => ({
    NODE_ENV: process.env["NODE_ENV"],
    NEXT_PUBLIC_SITE_URL: process.env["NEXT_PUBLIC_SITE_URL"],
    PORT: process.env["PORT"],
  }),
  logError: (event, fields) => logger.error(event, fields),
});
