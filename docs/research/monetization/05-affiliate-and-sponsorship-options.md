# Affiliate and Sponsored-Content Readiness

Research only. No affiliate network is selected. No affiliate link is
created. No sponsor is selected. No ranking or editorial outcome is being
proposed as for-sale. Claim IDs (`MON-###`) refer to `claims-register.csv`.

## Required principle (stated by this research's own instruction, and
## grounded in real regulatory guidance)

**Any material connection that could affect how a reader evaluates a
recommendation must be disclosed clearly and conspicuously with the
recommendation, not hidden only in a general policy page.**

This is not just an internal preference — it tracks real FTC guidance:

- A "material connection" is defined broadly by the FTC as *"a connection
  between an endorser and the marketer that a significant minority of
  consumers wouldn't expect and it would affect how they evaluate the
  endorsement"* (MON-013) — this covers affiliate commissions, free product,
  sponsorship payment, and even non-financial relationships.
- "Clear and conspicuous" has real content, not just a vibe: the disclosure
  must catch attention, use a readable/contrasting presentation, and be
  worded unambiguously for an ordinary reader (MON-014).
- **The word "affiliate link" by itself is explicitly called out by the FTC
  as insufficient** — readers may not understand what it means. "Paid link"
  placed directly next to the link is called out as adequate (MON-015).
- **LowCodeStacks itself, as the operator, would be directly responsible**
  for disclosure compliance across any article or creator content carrying
  an affiliate/sponsored relationship — not just whoever wrote the piece
  (MON-016). This matters architecturally: disclosure can't be left to an
  individual author's discretion if the platform is legally on the hook for
  it.
- This guidance is US-specific (MON-016's limitation); this project's own
  launch-jurisdiction scope is already narrowed to Canada and the US (open
  question 3, `docs/open-questions.md`), so it is directly relevant, but a
  Canadian-specific equivalent was not researched in this pass — flagged in
  `14-open-research-questions.md`.

## What the architecture would need to model, to do this correctly

(Audited against real schema in `10-current-architecture-inventory.md` —
this section states the requirement, that file states what exists today.)

- **Content-type distinction**: editorial article vs. affiliate article vs.
  sponsored article vs. sponsored newsletter vs. paid placement — these are
  not the same thing and conflating them defeats the disclosure requirement's
  purpose (a reader needs to know *which kind* of relationship, not just
  "some relationship exists").
- **Vendor-provided asset / free review copy**: if a creator received a free
  product or service to review, that is itself a material connection under
  MON-013, distinct from a direct payment.
- **Author financial relationship**: a field or record distinct from the
  article-type flag above — the same author could write both editorial and
  sponsored content, and the relationship needs to be trackable per piece,
  not assumed uniform across everything that author writes.
- **Disclosure text and placement**: stored per article, rendered adjacent to
  the relevant content — not only in a sitewide policy page, per the
  required principle above.
- **Disclosure effective date**: if disclosure wording changes (e.g., a
  clearer standard is adopted later), which version applied to which
  published piece needs to be knowable.
- **Affiliate link marker**: a way to flag which specific links within a
  piece are affiliate links, distinct from the piece-level disclosure — a
  single article could mix affiliate and non-affiliate links.
- **`rel="sponsored"`**: the HTML-level signal search engines use for paid
  links — a real, checkable technical requirement, not just a legal one.
- **Sponsor name, campaign start/end date**: for sponsored content and
  sponsored newsletters specifically.
- **Editorial reviewer**: who confirmed the disclosure was applied correctly
  before publication — ties into the same moderation/review pattern this
  project's `ModerationReview` model already establishes for marketplace
  products (`docs/06-data-model.md`), a plausible pattern to extend rather
  than invent fresh.
- **Disclosure-change audit history**: append-only, consistent with this
  project's own established pattern for `ConsentRecord`/`DeletionRequestEvent`
  (`docs/06-data-model.md`'s "Critical constraints") — if disclosure text is
  ever corrected, the correction itself should be auditable, not silently
  overwritten.

## Sponsorship-specific readiness (content sponsorship, not GitHub Sponsors —
## see `14-sponsorship-and-services.md` for that)

- Sponsor logo permission — a real, separate authorization question distinct
  from the sponsorship payment itself (using a sponsor's logo without
  explicit permission is its own risk, independent of disclosure
  compliance).
- Editorial independence statement — a policy commitment (what a sponsor can
  and cannot influence about the content), not an architecture requirement,
  but worth naming here since it's the thing the disclosure requirement
  ultimately protects.

## Explicit statement required by this research's own instruction

No affiliate network is selected or proposed. No affiliate link is created.
No sponsor is selected, contacted, or proposed. No ranking or editorial
outcome is proposed as being for sale, and the required principle above is
written specifically to prevent that from ever happening silently.
