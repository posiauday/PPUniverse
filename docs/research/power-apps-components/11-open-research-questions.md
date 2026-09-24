# Open Research Questions

Research only. These are unresolved *research* questions — not
`docs/open-questions.md` product-decision numbers (that file's item 60 already
tracks the build-or-not/what-shape decision at the product level; this list is
narrower and feeds into answering that one, not a duplicate of it).

- Is LowCodeStacks evaluating Canvas components, PCF controls, complete app
  templates, or some combination — as distinct decisions, per
  `03-canvas-vs-pcf.md`'s terminology rule, not one generic "components"
  question?
- Is the desired differentiation visual design quality, verified
  accessibility/performance/compatibility evidence, industry-vertical
  specialization, or something else entirely? `10-pain-points-and-opportunities.md`
  offers inferences, not an answer.
- Which real Power Apps environments (if any) would be available for Layer C
  verification (`05-accessibility-verification.md`)? This research had none —
  no environment, no `pac` CLI installation (a .NET SDK was not available in
  this session's sandbox), no way to test anything inside a real host.
- Who would perform assistive-technology testing, and with what expertise? No
  answer exists yet, and per `05-accessibility-verification.md`, this is not a
  task any automated tool (including this research's own author) can
  substitute for.
- What level of ongoing component maintenance/support is financially
  sustainable? Both competitors surveyed are effectively single-founder
  operations (CLM-007, CLM-019) — worth noting as a real-world constraint on
  whatever bar `04-component-quality-bar.md`'s draft eventually gets narrowed
  to, not just an abstract quality target.
- What compatibility evidence can realistically be maintained across Power
  Apps platform releases over time, given this project's own existing
  `CompatibilityRecord` model already distinguishes "Creator Declared" from
  "Marketplace Reviewed" evidence (`docs/06-data-model.md`) — who would do the
  reviewing, and how often?
- Which licenses and dependencies genuinely require legal review before any
  build decision? `08-licensing-and-trademarks.md` flags several; none have
  been reviewed by counsel as part of this research.
- Is any competitor's accessibility or performance independently verified by
  anyone — this research found none, but did not exhaustively search every
  possible third-party review venue (Reddit threads, Power Platform community
  forum posts, YouTube reviews were not systematically searched in this pass).
- What evidence would actually prove customer demand, as distinct from
  creator/maintainer interest? Neither competitor publishes independently
  verifiable customer counts (`09-pricing-and-adoption.md`); this research did
  not identify an alternative demand signal (e.g. a community survey, a
  Power Platform forum sentiment scan) that could substitute for one.
- Was the reported "DocRouter" product (CLM-008) real, discontinued, renamed,
  or simply not found by this research's search method? Left genuinely
  unresolved — flagged, not guessed at.
- Does PowerAppsUI's licensing claim (MIT, no attribution) hold up against an
  actual `LICENSE` file, given no public source repository was located to
  check it against? This is a real, unresolved verification gap, not assumed
  answered because the vendor's own page says so.
