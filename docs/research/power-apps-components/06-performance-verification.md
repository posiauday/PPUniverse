# Performance Verification

Research only. No performance claim in this document has been independently
benchmarked by this research pass unless explicitly marked as such — most of
what follows is a checklist of what *should* be measured, not a measurement.

## PCF-specific concerns

- **Initialization cost.** What does `init()` actually do on first mount — any
  expensive synchronous work there blocks the host.
- **`updateView` frequency.** The host calls `updateView` on every relevant
  change; a control that does expensive work on every call, rather than only
  on the specific properties that actually changed, will visibly lag in a
  real app.
- **Repeated `updateView` calls.** Related to the above — some hosts call this
  more often than a naive implementation expects; a control needs to be
  written defensively against redundant calls, not just correct ones.
- **Unnecessary re-render prevention.** For React-based controls specifically,
  standard React performance practice (memoization, avoiding new object/array
  identities on every render) applies, but is easy to get wrong inside a PCF
  wrapper that doesn't fit React's normal mounting lifecycle cleanly.
- **Stale asynchronous work.** If a control kicks off an async operation (e.g.
  a debounced external call) and the component is torn down or its inputs
  change before that resolves, does the control handle the stale response
  correctly, or does it apply an out-of-date result?
- **Request cancellation.** Related — does the control actually cancel
  in-flight requests on `destroy`, or leak them?
- **React reconciliation.** For dataset-type controls rendering large lists
  inside React, reconciliation cost scales with list size unless
  virtualization is used.
- **Dataset paging, sorting, filtering.** Whether these are delegated to the
  underlying data source or pulled entirely into the client — the same
  concern the Canvas "delegation" concept addresses, but PCF datasets have
  their own separate paging API surface.
- **Virtualisation.** For a control rendering a large dataset, whether only
  the visible rows are actually rendered.
- **Full-screen and resize behavior.** Whether the control recalculates
  expensive layout work on every resize event, or debounces/throttles it.
- **Memory behavior.** Whether repeated mount/unmount cycles (e.g. a control
  used inside a gallery template, mounted once per row) leak memory.
- **Destroy and reinitialization.** Whether a control cleanly tears down and
  can be safely reinitialized, or accumulates state across cycles.
- **Realistic dataset sizes.** Any performance claim needs a stated dataset
  size it was tested against — "fast" with 10 rows says nothing about 10,000.
- **External-service latency.** For a control that calls an external service
  (see `03-canvas-vs-pcf.md`'s licensing note, CLM-032), whether the control
  degrades gracefully under real-world latency/failure, not just the happy
  path.

## Canvas-specific concerns

- **Delegation.** Whether the formulas a component relies on can actually be
  delegated to the data source; a non-delegable formula silently truncates
  results at the environment's row limit — a well-known, real Canvas failure
  mode, not a hypothetical one.
- **Non-delegable formulas.** The specific functions/patterns known to break
  delegation for common Canvas data sources; a genuinely good Canvas
  component should avoid these or document the limitation plainly.
- **Gallery rendering.** Large galleries are Canvas's most common real-world
  performance bottleneck.
- **Nested gallery risks.** Nesting galleries multiplies formula evaluation
  cost; a component that internally uses nested galleries needs this
  documented as a scaling limitation.
- **Repeated formulas.** The same expensive formula evaluated in multiple
  places, rather than computed once and reused via a variable/collection.
- **Collections.** Whether a component's approach to client-side collections
  scales, or was only ever tested with a handful of rows.
- **Responsive recalculation.** Whether the component's responsive behavior
  triggers expensive recalculation on every viewport change.
- **Control count.** A high total control count on a single screen is a
  known Canvas performance factor independent of any single component's own
  efficiency — worth documenting if a component is control-heavy internally.
- **Image and SVG use.** Unoptimized images/SVGs are a common, avoidable
  Canvas performance cost.
- **App-start behavior.** Whether a component adds meaningfully to the
  overall app's cold-start time.
- **Monitor evidence.** Power Apps Monitor is the standard first-party tool
  for observing real formula evaluation timing; any real Canvas performance
  claim should be backed by Monitor output, not guesswork.
- **Mobile behavior.** Canvas apps on mobile devices have materially
  different performance headroom than desktop browser sessions.

## What a credible benchmark record requires

Every benchmark, if this is ever pursued, must record all of the following —
none of the sources surveyed in `02-competitor-evidence.md` published anything
meeting this bar, which is itself worth noting as a market gap
(`10-pain-points-and-opportunities.md`):

- Tested artifact version
- Host (Canvas / model-driven / Power Pages)
- Browser or client
- Environment (region, SKU, any relevant capacity tier)
- Dataset size
- Operation being measured
- Baseline (what "before" looked like, if comparative)
- Result
- Limitations (what the benchmark does *not* cover)
- Reproduction instructions

## Explicit statement required by this research's own instruction

**Vendor performance claims are not treated as independent evidence.** Neither
PowerAppsUI nor PowerLibs published any performance claim this research found
during `02-competitor-evidence.md`'s direct page fetches — this section is
therefore a checklist derived from known PCF/Canvas platform behavior and
Microsoft's own architecture guidance, not a comparison against a competitor's
unverified number.
