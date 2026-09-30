# Licensing and Trademarks

Research only. This is not a legal opinion. Anything marked "flag for legal
review" below should genuinely go to legal review before any decision relies
on it, per this document's own recurring caveat.

## Per-project licensing record

| Project | Repository / page | License | Copyright holder | Notice preservation | Redistribution | Modification | Commercial use | Sublicensing | Dependency caveats | Branding exclusions | Retrieved |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `microsoft/PowerApps-Samples` | https://github.com/microsoft/PowerApps-Samples | MIT (CLM-022) | Microsoft Corporation | Standard MIT — copyright/permission notice must be included in copies/substantial portions | Permitted | Permitted | Permitted | Permitted (standard MIT terms) | Not independently audited — a sample repo may pull in dependencies with their own licenses, not checked in this pass | Using "Microsoft" in a way that implies endorsement is separately restricted by Microsoft's trademark policy (CLM-033), independent of the MIT grant on the code itself | 2026-09-24 |
| `microsoft/powercat-creator-kit` | https://github.com/microsoft/powercat-creator-kit | MIT (CLM-023) | Microsoft Corporation | Same as above | Permitted | Permitted | Permitted | Permitted | Not independently audited | Same trademark caveat as above | 2026-09-24 |
| `microsoft/powercat-code-components` | https://github.com/microsoft/powercat-code-components | MIT (CLM-024) | Microsoft Corporation | Same as above | Permitted | Permitted | Permitted | Permitted | Not independently audited; each control folder may have its own npm dependencies with their own licenses | Same trademark caveat as above | 2026-09-24 |
| PowerAppsUI (powerappsui.com) | No public source repository located | MIT, per the vendor's own site (CLM-003) | Not stated (no repo, no explicit copyright line located) | **Not independently confirmed** — no LICENSE file found to check against | Vendor states permitted, no attribution required | Not explicitly addressed on the pages fetched | Vendor states permitted | Not addressed | Not addressed; no dependency manifest visible | Same trademark caveat as any third party | 2026-09-24 |
| `pac` CLI (Microsoft.PowerApps.CLI / .Tool, all install paths) | https://www.microsoft.com/business-applications/legal/slt-powerapps-cli/ | Microsoft Software License Terms (SLT-PowerApps-CLI) — **not MIT** (CLM-020) | Microsoft Corporation | N/A (proprietary EULA, not a notice-preservation license) | Restricted — "Distributable Code" carve-out only for code marked sample/template (CLM-021), with conditions | Restricted per the same clause | Not prohibited outright (Section 1(a) permits use "to develop and test your applications") | Not addressed | N/A | Explicit: no use of Microsoft trademark/trade-dress implying the resulting application "comes from or is endorsed by Microsoft" | 2026-09-24 |
| PowerLibs (powerlibs.com) | https://www.powerlibs.com/license | Proprietary (CLM-016) | Not stated in the excerpts retrieved | Not applicable in the MIT sense — a commercial EULA | Prohibited as standalone items; only within a larger "End Product" | Allowed within an End Product (implied by "modify and even sell your creations," per search summary — not independently re-verified against the primary license text beyond the quotes in `02-competitor-evidence.md`) | Explicitly permitted for End Products | Not addressed | Not addressed | Explicitly prohibits building a competing component library/tool (CLM-016) | 2026-09-24 |

## MIT notice-preservation requirement, quoted

Standard MIT license text (the form Microsoft's own MIT-licensed repositories
use) requires: *"The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software."* This is a
real, binding obligation, not a formality — **if LowCodeStacks ever built
something starting from Microsoft's MIT-licensed sample code
(`PowerApps-Samples`, Creator Kit, `powercat-code-components`), the original
copyright and MIT notice would need to be preserved and carried forward into
whatever is shipped**, even though MIT otherwise permits commercial use,
modification, and redistribution freely.

**An MIT license on a repository does not erase third-party dependency
obligations.** Each of Microsoft's MIT-licensed repositories may itself depend
on npm packages under other licenses (some copyleft, some permissive, some
proprietary) — this research did not audit any dependency tree, and doing so
is flagged below as a required step before any real build, not assumed clean
by default.

## Website design and branding are not necessarily covered by a component's
## source license

If a future effort drew visual/design inspiration from a competitor's site
(PowerAppsUI or PowerLibs) rather than their component *source*, that is a
separate question from the source license entirely — a site's visual design,
copy, and branding are typically **not** licensed alongside component source
code, MIT or otherwise, and copying visual design directly would be a
trademark/copyright question independent of whatever license covers the
underlying YAML or TypeScript. **Flag for legal review** if this is ever a real
consideration.

## Microsoft trademark and naming rules

(CLM-033, moderate confidence — summarized from search results of Microsoft's
own trademark guideline documents, not a full verbatim fetch of the primary
PDFs; **flag for legal review** before relying on this for anything
customer-facing.)

- Microsoft's trademarked logos require a **formal license** for third-party
  use, which is typically not available without one being explicitly granted.
- No third party may claim ownership of Microsoft's brand assets, or anything
  confusingly similar to them, as a trademark, company name, domain name,
  social-media handle, or any other designation.
- Partner-led marketing guidance requires "Microsoft" to precede a product
  name like "Power Apps" on first occurrence in third-party marketing
  material.
- **Microsoft product names may be used truthfully as compatibility
  descriptions** (e.g., "a component for Power Apps," "compatible with Power
  Apps Canvas apps") — this is consistent with, and already the standing rule
  in, `CLAUDE.md`'s own governance for this project: *"Do not claim Microsoft
  endorsement, certification, compatibility, or security approval unless
  evidence is recorded and approved."* That existing rule is the binding
  constraint for LowCodeStacks regardless of what this research finds
  externally — it is not weakened or superseded by anything in this document.
- **Microsoft product names must not imply endorsement.** A truthful
  compatibility statement ("works with Power Apps") is different from an
  endorsement implication ("Microsoft-approved," "official Power Apps
  component").
- **Microsoft logos, badges, and icons require applicable authorization** —
  not assumed available by default.
- **Words such as "official," "certified," "authentic," and "licensed" must
  not be used without applicable Microsoft authorization.** This is
  consistent with, and reinforces, the banned-word list already stated in
  `04-component-quality-bar.md` and `05-accessibility-verification.md`.

## Items flagged for legal review

- Whether PowerAppsUI's own MIT claim (CLM-003) can be relied on at all
  without a canonical `LICENSE` file to check it against — no such file was
  located.
- The precise scope of "similar functionality, features, or services" in
  PowerLibs's anti-competing-library clause (CLM-016), if LowCodeStacks ever
  evaluated building anything in this space that might use PowerLibs
  components as reference or inspiration.
- Any real dependency-tree audit before shipping anything derived from
  Microsoft's MIT-licensed sample repositories.
- The exact boundary between a truthful compatibility description and an
  implied-endorsement claim, applied to LowCodeStacks's own specific future
  marketing copy, if this is ever pursued — the general rules above are a
  starting point, not a cleared final answer.
