import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pg (node-postgres) has native/optional bindings that don't bundle.
  // @prisma/client is already in Next's built-in external-packages list.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
