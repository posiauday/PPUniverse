import type { NextConfig } from "next";

// Pages that must never be indexed but cannot (or should not) rely on a <meta>
// tag alone: API responses are JSON, and /signin is a client component, which
// cannot export metadata. The root layout is also noindex by default; this
// header is defence in depth (MVP-021, FR-017). These paths are deliberately
// NOT disallowed in robots.txt — a blocked URL can never have its noindex read.
const NOINDEX_SOURCES = ["/api/:path*", "/account/:path*", "/signin"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pg (node-postgres) has native/optional bindings that don't bundle.
  // @prisma/client is already in Next's built-in external-packages list.
  serverExternalPackages: ["pg"],
  async headers() {
    return NOINDEX_SOURCES.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
};

export default nextConfig;
