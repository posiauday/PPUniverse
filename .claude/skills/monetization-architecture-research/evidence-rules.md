# Evidence Rules

Loaded by `monetization-architecture-research` before recording any claim.

## Classification (every claim gets exactly one)

- **OfficialDocumentation** — a primary regulator/platform source (FTC,
  Google Search Central, an ad network's own published policy page, GitHub
  Docs, this project's own `docs/`/`planning/` governance files).
- **VendorClaim** — a competitor or vendor's own marketing/pricing/policy
  page, about itself. Never upgrade this to a stronger classification just
  because it was read directly.
- **RepositoryEvidence** — a fact confirmed by directly reading this
  repository's own files (Prisma schema, source code, package structure).
  Always cite the exact file path, and a line number/range where practical.
  **A model named in `docs/06-data-model.md` is not RepositoryEvidence that
  it exists — only a real match in `packages/db/prisma/schema/*.prisma`
  is.**
- **IndependentEvidence** — a genuinely third-party source, independent of
  whoever the claim is about. Rare.
- **ResearchInference** — a reasoned conclusion this research draws from
  other claims, not a directly sourced fact. State the inference explicitly
  in the claim text, not just the classification column.
- **Unknown** — searched for and not found, or found but not verifiable.
  Never fill an `Unknown` with a plausible guess dressed as fact.

## Hard rules, specific to monetization research

- Never convert a vendor's revenue claim into independent evidence.
- Never convert competitor pricing into a recommended LowCodeStacks price.
- Never convert a stated traffic requirement (e.g. EthicalAds's 50k+
  monthly pageviews) into an expected-revenue estimate.
- Never convert a subscriber count into a customer count.
- Never convert an employer logo on a vendor's page into evidence of
  organisational procurement or endorsement.
- Never treat MIT permission as permission to reuse trademarks,
  documentation, website design, or any third-party dependency the
  MIT-licensed project itself carries.
- Never treat technical capability (the architecture could support X) as
  legal or tax compliance (X is actually compliant to do).
- Before citing a Prisma model as existing, grep the actual schema files —
  do not trust a name appearing in `docs/06-data-model.md`,
  `packages/domain/*/README.md`, or `packages/adapters/*/README.md` alone;
  those READMEs explicitly describe *placeholder* packages in several cases
  (commerce, payments, creator, analytics, confirmed empty of `src/` as of
  2026-09-24) and must not be read as evidence of a working implementation.
- A CSV field-count validation pass is required before treating the claims
  register as complete — an unquoted field containing a comma silently
  corrupts the register; validate programmatically, don't eyeball it.

## Required fields for `claims-register.csv`

`ClaimId, Subject, Claim, ClaimType, SourceUrl, SourceTitle, RetrievedDate,
Confidence, Validated, Limitation, ContradictingClaimId, ReviewBy`.

`ClaimId` continues the existing `MON-###` sequence (currently through
MON-026) — do not restart numbering or reuse an ID. `Validated` is `Yes`,
`Partial`, or `No`. `Confidence` is `High`, `Medium`, or `Low`. Every claim
about a commercial figure (price, plan, traffic threshold) gets a
`ReviewBy` date.
