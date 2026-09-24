# Quality Matrix (Reference)

Loaded by `component-opportunity-research` only when the task touches
component quality, accessibility, or performance dimensions. This is a
pointer to the canonical draft, not a duplicate of it — always read the
current state of these files directly rather than relying on this summary,
since they may have been extended since this skill file was last updated:

- `docs/research/power-apps-components/04-component-quality-bar.md` — the
  draft (unapproved) Canvas and PCF quality matrices.
- `docs/research/power-apps-components/05-accessibility-verification.md` —
  the three-layer verification model (automated, manual, real-host) and the
  banned-word list for accessibility claims.
- `docs/research/power-apps-components/06-performance-verification.md` —
  PCF/Canvas performance concerns and what a credible benchmark record
  requires.
- `docs/research/power-apps-components/07-testing-strategy.md` — the
  candidate verification stack and which checks require a human, a real
  environment, or legal review versus which are automatable.

When extending any of these, preserve the existing structure (the same
dimension rows/categories) rather than replacing it, unless the product owner
has directly instructed a restructure.

## The one finding worth repeating before adding new quality claims

Every source checked in this research package so far — two commercial
competitors and three Microsoft first-party repositories — publishes no
accessibility verification evidence. Before asserting a new accessibility
claim about any project, check whether this pattern still holds; if a new
source finally does publish real accessibility evidence, that is itself a
significant, citable update to `10-pain-points-and-opportunities.md`'s central
finding, not just a routine addition.
