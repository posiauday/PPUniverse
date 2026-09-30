import Link from "next/link";

/**
 * The Premium 3 home hero (MVP-027 slice 2; docs/final-decisions.md, "Home
 * page design: Premium 3"): the headline and calls to action on the left, a
 * layered illustration of a Power Apps screen on the right.
 *
 * The illustration is decoration: an invented sample app built from plain
 * elements, hidden from assistive technology (aria-hidden) because it says
 * nothing the headline does not, and shown only on wide screens so it can
 * never cause horizontal scrolling. Its floating cards make no claim about
 * any real product: the "tested on" data the decision mentions is shown
 * only on product pages, from recorded evidence.
 *
 * Motion: the text rises in, the side cards float gently. Both use the
 * global reduced-motion override in globals.css, so they are still for
 * anyone who asks for less motion.
 */
export function HomeHero() {
  return (
    <section className="grid items-center gap-10 lg:grid-cols-12">
      <div className="flex flex-col gap-5 lg:col-span-5">
        <p className="motion-rise w-fit rounded-lg bg-muted px-3 py-1.5 font-mono text-sm font-medium text-primary">
          FREE POWER PLATFORM LEARNING
        </p>
        <h1
          className="motion-rise text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "0.1s" }}
        >
          Learn it properly. Ship components that last.
        </h1>
        <p
          className="motion-rise text-lg leading-relaxed text-muted-foreground"
          style={{ animationDelay: "0.2s" }}
        >
          Free tutorials, architecture patterns and reusable components for Power Apps, Power
          Automate, Power BI, SharePoint and Dynamics 365.
        </p>
        <div className="motion-rise flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/learn"
            className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground no-underline"
          >
            Start learning
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-12 items-center rounded-xl border border-muted-foreground px-6 font-semibold text-foreground no-underline"
          >
            Browse components
          </Link>
        </div>
      </div>

      <div aria-hidden="true" className="relative hidden h-[460px] lg:col-span-7 lg:block">
        <div
          className="motion-rise absolute top-6 left-16 w-[440px] overflow-hidden rounded-3xl border border-border bg-card shadow-[0_40px_80px_-40px_rgb(22_24_29/0.35)]"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex h-12 items-center gap-2 bg-primary px-5 font-semibold text-primary-foreground">
            <span className="h-6 w-6 rounded-md bg-primary-foreground/20" />
            Field inspections
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            <div className="flex h-10 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground">
              Search sites
            </div>
            {SAMPLE_ROWS.map((row, index) => (
              <div
                key={row.title}
                className={`flex items-center gap-3 rounded-xl p-3 ${index === 0 ? "bg-muted" : ""}`}
              >
                <span className="h-10 w-10 rounded-lg bg-primary/15" />
                <span className="flex grow flex-col">
                  <span className="font-semibold">{row.title}</span>
                  <span className="text-sm text-muted-foreground">{row.detail}</span>
                </span>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold">
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="motion-float absolute top-[300px] left-0 w-60 -rotate-3 rounded-2xl border border-code-border bg-code p-4 font-mono text-sm leading-relaxed text-code-foreground shadow-xl">
          <span className="text-code-muted">{"// component input"}</span>
          <br />
          Items: ActiveSites
          <br />
          OnSelect: Navigate(Detail)
        </div>
        <div
          className="motion-float absolute top-0 right-4 flex w-48 rotate-3 flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-xl"
          style={{ animationDelay: "1.5s" }}
        >
          <span className="font-mono text-xs text-muted-foreground">EVERY PRODUCT PAGE</span>
          <span className="font-semibold">Licence, version and compatibility</span>
        </div>
      </div>
    </section>
  );
}

const SAMPLE_ROWS = [
  { title: "North depot", detail: "Inspected today", status: "Passed" },
  { title: "Harbour site", detail: "Due tomorrow", status: "Due" },
  { title: "East warehouse", detail: "Overdue", status: "Overdue" },
] as const;
