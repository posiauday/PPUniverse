# Advertising Readiness

Research only. No ad provider is selected, added, or configured by this
document. Claim IDs (`MON-###`) refer to `claims-register.csv`.

## Networks researched

### Google AdSense
- Prohibits inflating impressions/clicks by any means, including manual
  methods (MON-001).
- Prohibits asking others to click/view ads, or deceptive implementation
  methods to obtain clicks (MON-002).
- Requires non-misleading ad labels — "Sponsored Links"/"Advertisements" are
  acceptable, "Favorite Sites"/"Today's Top Offers" are not (MON-003).
- Broadest reach, least curated, generally the least developer-audience-native
  of the three networks researched.

### EthicalAds
- States a preference for developer-focused sites at 50,000+ monthly
  pageviews (MON-004) — a real, cited threshold, not a confirmed hard
  cutoff below which every applicant is rejected.
- Requires exclusivity on the page (no other ad network alongside it — the
  site's own promotions are explicitly fine), above-the-fold placement on
  both desktop and mobile, and placement that doesn't interrupt reading flow
  (MON-005).
- Explicitly developer-audience-targeted, which fits LowCodeStacks's actual
  audience better than a generic network.

### Carbon Ads
- Curated, exclusive network (350+ developer/design sites, operating since
  2010) — evaluates audience relevance, monthly pageviews, active
  maintenance, and current network capacity per application; a 5–7
  business-day review (MON-006).
- Exclusivity requirement, same shape as EthicalAds — no backfill from other
  networks.

## What these three have in common

All three require or strongly prefer **exclusivity or near-exclusivity** on
any page carrying their ad, and all three require **clear, non-misleading
labeling**. None of the three publish a revenue-per-pageview figure this
research treats as reliable — any such figure found elsewhere is a vendor or
third-party estimate, not a guarantee, and is not used anywhere in this
package to project revenue. **This research does not fabricate a revenue
estimate for any of the three.**

## Architecture readiness for an ad-free default with future controlled activation

The default posture this research evaluates against: **ads off by default,
switched on later only through an explicit, reversible mechanism** — not
"build the ad slots now and decide whether to fill them later."

| Requirement | What it would need | Status (pending architecture inventory — see `10-current-architecture-inventory.md`) |
|---|---|---|
| Feature flags | A real `FeatureFlag` mechanism to gate ad rendering per-page or globally | To be confirmed against actual schema/code — `docs/06-data-model.md` names `FeatureFlag` under "Operations" but whether it's a real, checked mechanism or only a documented placeholder needs verification, not assumption |
| Placement identifiers | A stable identifier per ad slot, independent of page layout changes | Not yet built — no ad UI exists |
| Page-level eligibility | A per-route or per-page-type allow/deny list | Related to the existing SEO/sitemap eligibility logic (`apps/web/lib/seo/`), which already does per-page-type inclusion/exclusion for indexing — a plausible pattern to extend, not something to build from nothing conceptually, but ad eligibility and SEO eligibility are not the same list and must not be conflated |
| Exclusion zones | Pages where ads must never render | See explicit list below |
| Accessible ad labels | Labels that are perceivable, not just visually distinguishable — relevant to this project's own WCAG 2.2 AA bar (`CLAUDE.md`) | No existing pattern to point to; would be new UI work |
| Consent controls where legally required | Whether ad personalization requires consent depends on jurisdiction and ad type (contextual vs. behavioral) — a legal question, not an architecture one; see `08-legal-tax-privacy-and-disclosures.md` | This project already has a real, working consent architecture (`ConsentRecord`, MVP-020) that could plausibly extend to an advertising-consent category, if a category-based extension is confirmed by the architecture inventory |
| Privacy-policy integration | Ad presence and any tracking must be reflected in the privacy policy | Editorial/legal work, not architecture |
| Content Security Policy updates | Any ad network's script origin(s) would need explicit CSP allow-listing | `docs/03-trd.md` already names CSP as a standing quality requirement; adding an ad script origin is a real, reviewable CSP change whenever it happens, not automatic |
| Script loading control | Async/deferred loading so an ad script cannot block rendering | New work |
| Performance budgets / Core Web Vitals monitoring | A budget an ad script is checked against before/after activation | Not found in the architecture inventory as an existing, enforced mechanism — see `10-current-architecture-inventory.md` |
| Layout-shift prevention | Reserved space for ad slots to avoid CLS regressions | New UI work |
| Ad-blocker-safe failure | The page must degrade cleanly with an ad blocker active, not show a broken layout or error | New UI/testing work |
| House-ad fallback | A house promotion or empty state when no paid ad fills the slot | New UI work |
| Campaign start/end dates, paid-vs-house distinction | Data model concept, not yet built | New schema work if pursued |
| Impression/click handling without inviting invalid traffic | Must not accidentally violate MON-001/MON-002 through implementation choices (e.g., prefetching ad URLs, or any interaction pattern that could look like encouraged clicking) | New implementation concern, flagged for design review whenever this is built |

## Required exclusion zones

Per this research's own instruction, ads must be excludable from (and this
research records this as a requirement to satisfy, not yet implemented
anywhere):

- Authentication (sign-in, sign-out, error pages)
- Account pages
- Checkout
- Order confirmation
- Creator application
- Admin
- Privacy/deletion workflows (`/account/privacy`, `/admin/deletion-requests`)
- Error pages
- Legal pages
- Download fulfillment
- A paid-subscriber experience, if one is ever approved (not currently
  approved — see `07-subscription-membership-and-licensing.md`)

This list maps directly onto real, already-existing routes in this
repository (confirmed in `10-current-architecture-inventory.md`), which is
useful: an exclusion list can be built against real routes, not
hypothetical ones, whenever this work is actually authorized.

## Explicit statement required by this research's own instruction

No ad provider is added. No tracking script is added. No revenue projection
is made for any network. This section evaluates *readiness*, not a decision
to activate advertising.
