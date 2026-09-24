# Open Research Questions

Research only. These are unresolved *research* questions this audit
surfaced — not `docs/open-questions.md` product-decision numbers, and none
are resolved here.

- **Which affiliate programs, if any, are actually relevant to a Power
  Platform technical audience?** Not researched in this pass — `01-revenue-models.md`
  Model N flags this as unresearched, not just undecided.
- **Consumer-protection obligations beyond tax/refund** (clear pricing
  display, cancellation rights for any future subscription) — flagged as
  `Unknown` in `08-legal-tax-privacy-and-disclosures.md`, not researched
  deeply enough in this pass to classify precisely.
- **Canadian-specific disclosure guidance** (a Competition Bureau equivalent
  to the FTC's endorsement guides) — not researched; MON-016's limitation
  field flags this gap directly, and it matters because this project's own
  launch scope already includes Canada (open question 3).
- **Business banking and accounting currency** — genuinely unknown to this
  research, not something a repository audit can determine.
- **Whether `Organization`/`OrganizationMember` (named under Identity in
  `docs/06-data-model.md`) actually connects to `Entitlement` in any way** —
  the architecture inventory did not find such a connection in
  `Entitlement`'s own fields, but a full audit of the Identity domain's
  models specifically (as opposed to Commerce/Creator/Content, which were
  audited in depth) was not performed in this pass.
- **What would actually justify reopening the per-product-grant vs.
  subscription decision (open question 7)?** This research names the
  conflict (`12-gap-analysis.md` category G) but does not know what
  evidence would meet the bar for reconsidering it — worth naming as its
  own question rather than assuming any future demand signal would
  automatically qualify.
- **Services/consulting legal shape** (Model U, `01-revenue-models.md`) —
  explicitly not researched in depth; flagged as a different legal shape
  than product sales, not analyzed further.
- **Live-event/workshop logistics** (Model T's synchronous-delivery variant)
  — not researched in this pass.
- **What traffic/engagement measurement infrastructure would Phase 1
  actually need to build**, given `AnalyticsEvent` does not exist at all
  (MON-022) and FR-016 has no owning story — this research treats this as a
  real, unresolved prerequisite for evaluating Phases 4 and 5 with real
  data rather than guesses, but does not scope what that measurement
  infrastructure itself should look like.
- **Whether any part of LowCodeStacks would ever be open-sourced**, which
  is the specific structural precondition Model S (GitHub Sponsors) would
  need — not researched or assumed; flagged as the reason Model S is
  currently `NotSupportedByEvidence` in `12-gap-analysis.md`, not a
  permanent verdict.
- **Whether "Organization" scoping for Team/Enterprise licences should
  reuse the Identity domain's existing `Organization`/`OrganizationMember`
  concept, or need its own commerce-specific scoping mechanism** — a real
  design fork `11-architecture-alignment-matrix.md`'s multi-seat row
  doesn't resolve, only names.
