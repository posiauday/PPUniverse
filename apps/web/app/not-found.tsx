import Link from "next/link";

// Without this file an unknown URL renders the framework default, which has no
// <main> landmark (BUG-008, WCAG 1.3.1 / 2.4.1). The status stays 404.
export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you asked for does not exist or is no longer available.
      </p>
      <p className="mt-4">
        <Link href="/">Back to the home page</Link>
      </p>
    </main>
  );
}
