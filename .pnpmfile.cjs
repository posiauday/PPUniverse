// pnpm resolution hook (MVP-023, decision Q41: accessibility tooling is dev-only
// and must never ship with the application).
//
// Next.js declares @playwright/test as an OPTIONAL peer dependency, for its
// experimental test proxy, which this app does not use. Once the @ppu/e2e
// workspace package exists, pnpm resolves that optional peer from the workspace,
// which would put Playwright into the web app's production dependency tree.
// Dropping the peer declaration keeps the dev-only harness out of it. Nothing
// else about Next's resolution changes.
function readPackage(pkg) {
  if (pkg.name === "next") {
    if (pkg.peerDependencies) delete pkg.peerDependencies["@playwright/test"];
    if (pkg.peerDependenciesMeta) delete pkg.peerDependenciesMeta["@playwright/test"];
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
