import type { NextConfig } from "next";

// Pages that must never be indexed but cannot (or should not) rely on a <meta>
// tag alone: API responses are JSON, and /signin is a client component, which
// cannot export metadata. The root layout is also noindex by default; this
// header is defence in depth (MVP-021, FR-017). These paths are deliberately
// NOT disallowed in robots.txt — a blocked URL can never have its noindex read.
// MVP-034 adds the sign-in confirmation page and the admin pages.
const NOINDEX_SOURCES = [
  "/api/:path*",
  "/account/:path*",
  "/signin",
  "/signin/:path*",
  "/signup",
  "/password/:path*",
  "/admin",
  "/admin/:path*",
];

/**
 * Browser security headers on every response (MVP-034, from the 2026-10-06
 * configuration review; HSTS and nosniff already come from Netlify).
 * - frame-ancestors 'none' and X-Frame-Options: no other site may frame these
 *   pages (clickjacking, including the admin Publish buttons).
 * - base-uri, object-src: block <base> hijacking and plugins.
 * - Referrer-Policy: other sites see only the origin, never a path or query
 *   (the sign-in confirmation page has a one-time token in its query).
 * The CSP deliberately has no script-src yet: Next.js inline scripts need a
 * nonce set-up first (TD-029).
 */
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pg (node-postgres) has native/optional bindings that don't bundle.
  // @prisma/client is already in Next's built-in external-packages list.
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      ...NOINDEX_SOURCES.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

export default nextConfig;
