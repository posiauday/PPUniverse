# Sources

Source inventory for the Power Apps component landscape research package. Every
factual claim in the numbered research files traces back to one of these sources
via `claims-register.csv`'s `SourceUrl` column, or is explicitly marked `Unknown`
where no source was found.

| Title | Publisher | URL | Retrieved | Type | Topics | Limitations | Can change? | Review by |
|---|---|---|---|---|---|---|---|---|
| PowerApps UI homepage | Rodas Yonass (individual) | https://powerappsui.com | 2026-09-24 | Vendor site | Canvas competitor, licensing, positioning | Marketing copy, not independently audited | Yes, frequently | 2026-12-24 |
| PowerApps UI components catalogue | Rodas Yonass (individual) | https://www.powerappsui.com/components | 2026-09-24 | Vendor site | Component count, design system, PCF status | Catalogue contents and labels can change | Yes, frequently | 2026-12-24 |
| PowerApps UI - About/services page | Rodas Yonass (individual) | https://www.powerappsui.com/services | 2026-09-24 | Vendor site | Origin, team size | Self-description only | Yes | 2026-12-24 |
| PowerLibs pricing page | PowerLibs (Dennis Doer) | https://www.powerlibs.com/pricing | 2026-09-24 | Vendor site | Pricing tiers, promotional pricing | Snapshot; promotional price observed | Yes, frequently | 2026-10-24 |
| PowerLibs library page | PowerLibs (Dennis Doer) | https://www.powerlibs.com/library | 2026-09-24 | Vendor site | Component catalogue, category counts | Category taxonomy is the vendor's own | Yes, frequently | 2026-10-24 |
| PowerLibs free components page | PowerLibs (Dennis Doer) | https://www.powerlibs.com/library/free | 2026-09-24 | Vendor site | Free tier | Snapshot | Yes | 2026-10-24 |
| PowerLibs license page | PowerLibs (Dennis Doer) | https://www.powerlibs.com/license | 2026-09-24 | Vendor site (legal terms) | Redistribution, competing-product clause, post-cancellation access | Vendor's own legal text, not independently reviewed by counsel | Yes | 2026-12-24 |
| PowerLibs homepage | PowerLibs (Dennis Doer) | https://www.powerlibs.com | 2026-09-24 | Vendor site | Employer-logo claims, adoption signals | Logos are not procurement evidence (see claims register) | Yes | 2026-12-24 |
| "Introducing PowerLibs: my biggest project yet" | Dennis Doer (Buttondown newsletter) | https://buttondown.com/dennisdoer/archive/introducing-powerlibs-my-biggest-project-yet/ | 2026-09-24 | Independent (author's own newsletter) | Founder identity, origin | First-party author account, not third-party verified | Unlikely to change (archived post) | — |
| Microsoft Software License Terms - Power Apps CLI | Microsoft | https://www.microsoft.com/business-applications/legal/slt-powerapps-cli/ | 2026-09-24 | Official documentation (legal terms) | pac CLI licensing, Distributable Code clause | Legal text is dense; this research is not a legal opinion | Yes, Microsoft can update terms | 2026-12-24 |
| Microsoft.PowerApps.CLI.Tool - NuGet package page | Microsoft (NuGet Gallery) | https://www.nuget.org/packages/Microsoft.PowerApps.CLI.Tool/1.49.4 | 2026-09-24 | Official documentation | License link, install path | Version-specific page | Yes | 2026-12-24 |
| Install Power Platform CLI using Windows MSI | Microsoft Learn | https://learn.microsoft.com/en-us/power-platform/developer/howto/install-cli-msi | 2026-09-24 | Official documentation | MSI install path, EULA acceptance step | Docs page, not the EULA text itself | Yes | 2026-12-24 |
| microsoft/powerplatform-vscode - LICENSE | Microsoft (GitHub) | https://github.com/microsoft/powerplatform-vscode | 2026-09-24 | Repository evidence | VS Code extension wrapper license (MIT) | Covers the extension's own code, not the pac binary it installs | Yes | 2026-12-24 |
| microsoft/PowerApps-Samples | Microsoft (GitHub) | https://github.com/microsoft/PowerApps-Samples | 2026-09-24 | Repository evidence | License, activity, star count | Point-in-time snapshot | Yes | 2026-10-24 |
| microsoft/powercat-creator-kit | Microsoft (GitHub) | https://github.com/microsoft/powercat-creator-kit | 2026-09-24 | Repository evidence | License, activity, README claims | Point-in-time snapshot | Yes | 2026-10-24 |
| microsoft/powercat-code-components | Microsoft (GitHub) | https://github.com/microsoft/powercat-code-components | 2026-09-24 | Repository evidence | License, activity, test-file presence | Point-in-time snapshot; code-search count is approximate | Yes | 2026-10-24 |
| generator-pcf npm registry entry | npm / DynamicsNinja | https://registry.npmjs.org/generator-pcf | 2026-09-24 | Repository evidence | Last publish date, version | Point-in-time snapshot | Yes | 2026-12-24 |
| DynamicsNinja/generator-pcf | DynamicsNinja (GitHub) | https://github.com/DynamicsNinja/generator-pcf | 2026-09-24 | Repository evidence | Stars, last commit | Point-in-time snapshot | Yes | 2026-12-24 |
| @microsoft/powerapps-component npm registry query | npm | https://registry.npmjs.org/@microsoft/powerapps-component | 2026-09-24 | Repository evidence (negative result) | Confirms package does not exist | A 404 today doesn't prove it never existed under a different name | Yes | 2026-12-24 |
| PCF Builder - VS Code Marketplace | danish-naglekar (VS Code Marketplace gallery API) | https://marketplace.visualstudio.com/items?itemName=danish-naglekar.pcf-builder | 2026-09-24 | Repository evidence | Install count, last update | Point-in-time snapshot | Yes | 2026-12-24 |
| Power-Maverick/PCF-Builder-VSCode | Power-Maverick (GitHub) | https://github.com/Power-Maverick/PCF-Builder-VSCode | 2026-09-24 | Repository evidence | Stars, last commit, open issues | Point-in-time snapshot | Yes | 2026-12-24 |
| Power Apps Fusion Studio - VS Code Marketplace | VladimiroLuis (VS Code Marketplace gallery API) | https://marketplace.visualstudio.com/items?itemName=VladimiroLuis.powerapps-fusion-studio | 2026-09-24 | Repository evidence | Install count, last update | No source repo found; feature claims not independently tested | Yes | 2026-12-24 |

## Notes on source quality

- Every vendor-site source (PowerAppsUI, PowerLibs) is classified `VendorClaim` in
  the claims register unless this research independently counted/verified the
  specific number (in which case `Verified: Yes` records that this research's own
  count matched what the vendor's page displays — it does not mean an
  independent third party confirmed it).
- GitHub/npm/VS Code Marketplace API responses are treated as `RepositoryEvidence`
  — they are real, machine-reported facts about a public repository or listing,
  not the underlying project's own marketing claims.
- No source in this table is `IndependentEvidence` in the strict sense of a
  reproduced benchmark or third-party audit, except the Buttondown newsletter
  (an independent-of-the-vendor-site source, though still first-party to the
  founder, not a neutral third party).
