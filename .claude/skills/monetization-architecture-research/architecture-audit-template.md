# Architecture Audit Template

Loaded by `monetization-architecture-research` when auditing a new
capability against real repository code. Follow this exact method — it's
the same method `docs/research/monetization/10-current-architecture-inventory.md`
and `11-architecture-alignment-matrix.md` were built with.

## Per-capability audit steps

1. **Name the capability precisely.** "Subscription support" is too vague;
   "a `Subscription` model distinct from one-time `Entitlement`" is
   auditable.
2. **Grep the real schema first**, not the docs. `packages/db/prisma/schema/*.prisma`
   is the ground truth. A name in `docs/06-data-model.md` or a package
   `README.md` is a claim to verify, not a fact.
3. **Check whether the package is placeholder-only.** `find <package> -type f`
   — if the only file is `README.md`, the package is not built, regardless
   of what the README says it will eventually contain.
4. **Cite exact file paths and line numbers** wherever a real model/field is
   found — vague citations ("it's in the catalog package somewhere") are
   not acceptable.
5. **State what's confirmed absent, not just what's confirmed present.** "No
   `Price` model exists" is itself a finding worth stating explicitly, with
   the negative-search method named ("confirmed by grep for `model Price`
   across all schema files, zero matches").
6. **Classify status** as one of: `Supported`, `PartiallySupported`,
   `NotSupported`, `Conflicted`, `Unknown` — matching
   `11-architecture-alignment-matrix.md`'s `CurrentSupport` column.
7. **Classify the change type** the gap would require: `DocumentationOnly`,
   `ConfigurationOnly`, `Schema`, `DomainLogic`, `Adapter`, `API`, `UI`,
   `Admin`, `CI`, `Security`, `Privacy`, `Legal`, `Operational`.
8. **Name the earliest story or model that would actually need this** — not
   a hypothetical future need. If no real model in
   `docs/research/monetization/01-revenue-models.md` needs it yet, say so;
   don't add a row "just in case."
9. **Check for conflict with an existing decision** before classifying
   something as merely `NotSupported` — search `docs/open-questions.md` and
   `docs/final-decisions.md` for anything the new capability might
   contradict. A genuine conflict (like the subscription vs. per-product-
   grant tension already on record) gets `Conflicted`, not folded quietly
   into `NotSupported`.

## Output format for a new alignment-matrix row

Match `11-architecture-alignment-matrix.md`'s exact columns: `Capability,
RevenueModel, CurrentSupport, RepositoryEvidence, Gap, RequiredDecision,
RequiredChangeType, SecurityImpact, PrivacyImpact, TaxLegalImpact,
Dependencies, EarliestNeed, Reversibility, RecommendationStatus`.
`RecommendationStatus` is only ever one of: `NoChangeNeeded`,
`DocumentLater`, `ConfigureLater`, `CandidateFutureChange`,
`BlockedByDecision`, `NotRecommendedFromEvidence`, `Unknown`. Never
`Approved` — that value does not exist in the allowed set.
