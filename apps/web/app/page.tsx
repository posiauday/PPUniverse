import Link from "next/link";
import { formatBuildLabel } from "../lib/build-info";

export default function HomePage() {
  return (
    <main>
      <h1>Power Platform Universe</h1>
      <p>
        Repository and CI baseline (MVP-001), account sign-in and session management (MVP-002).
        Catalog and marketplace experience is not yet implemented.
      </p>
      <p>
        <Link href="/signin">Sign in</Link>
      </p>
      <p data-testid="build-label">{formatBuildLabel("power-platform-universe", "0.0.0")}</p>
    </main>
  );
}
