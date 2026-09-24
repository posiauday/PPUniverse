# Evidence Rules

Loaded by `component-opportunity-research` before recording any claim.

## Classification (every claim gets exactly one)

- **OfficialDocumentation** — Microsoft Learn, a Microsoft legal/licensing
  page, or an equivalent primary official source.
- **VendorClaim** — a competitor's own marketing/pricing/license page, about
  itself. Never upgrade this to a stronger classification just because it was
  read directly rather than summarized secondhand.
- **RepositoryEvidence** — a fact reported by a repository host's own API or
  file (GitHub API, npm registry API, VS Code Marketplace gallery API, a
  fetched `LICENSE` file). Machine-reported, not the project's own marketing.
- **IndependentEvidence** — a genuinely third-party source, independent of the
  vendor being described (a reproduced benchmark, an independent review). Rare
  — most sources available to this skill will not qualify.
- **ResearchInference** — a reasoned conclusion this research draws from other
  claims, not a directly sourced fact. Always say so explicitly in the claim
  text, not just in the classification column.
- **Unknown** — searched for and not found, or found but not verifiable. Never
  fill an `Unknown` with a plausible guess dressed as fact.

## Hard rules

- A competitor's headline number is `VendorClaim` even if it turns out to be
  correct. "Correct" and "independently verified" are different properties.
- Do not insert a numeric count (component counts, install counts, star
  counts, prices) unless the source explicitly provides that exact number.
  Do not round, estimate, or infer one from partial information.
- Do not infer adoption from subscriber counts, employer logos, page traffic,
  or social follower counts. An employer logo on a vendor page is evidence
  that page exists with that logo on it — nothing more.
- Contradictions between two sources (or two pages of the same source) are
  recorded as two claims with a `ContradictingClaimId` cross-reference, never
  silently resolved by picking one.
- Every claim about a commercial figure (price, plan, catalogue count) gets a
  `ReviewBy` date — these change without notice.

## Banned words, regardless of source or context

Never use, about any component, real or hypothetical, without a specific,
scoped, sourced qualifier: error-free, zero defects, WCAG compliant, WCAG
certified, fully accessible, Microsoft certified, official, endorsed by
Microsoft, authentic, licensed (in the "officially licensed" sense).

## Required fields for `claims-register.csv`

`ClaimId, Area, AssetType, Entity, Claim, ClaimType, SourceUrl, SourceTitle,
RetrievedDate, Confidence, Verified, ContradictingClaimId, Limitations,
ReviewBy, Notes`.

`AssetType` is one of `Canvas`, `PCF`, `AppTemplate`, `General`, `Unknown` —
never a combined or generic value. `Verified` is `Yes`, `Partial`, or `No`.
`Confidence` is `High`, `Medium`, or `Low`.
