# Canvas Components vs. PCF Code Components

Research only. This document exists specifically to enforce the terminology
rule: **Canvas components and PCF code components are different technologies
with different implementation, testing, installation, security, support, and
distribution requirements.** Nothing here decides which (if either) LowCodeStacks
should pursue.

## Side-by-side comparison

| Dimension | Canvas component | PCF code component |
|---|---|---|
| Authoring language | Power Fx (formulas) + Power Apps Studio controls; distributed as YAML that a maker imports via "Import from code" | TypeScript, against the PCF lifecycle API (`init`, `updateView`, `getOutputs`, `destroy`) |
| Development environment | Power Apps Studio itself (browser-based); no separate build tooling required for the simplest case | Node.js, `pac` CLI, a code editor (VS Code typically), a full front-end build pipeline |
| Source format | YAML (copy-pasted) or a Canvas component library (`.msapp`-adjacent packaging) | A `ControlManifest.Input.xml` plus TypeScript source, compiled to a bundle |
| Distribution artifact | Raw YAML text (copy-paste) or an importable component library file | A Power Platform **solution** (managed or unmanaged) containing the compiled control |
| Installation experience | Paste into Studio's import dialog; immediate, no admin action for plain YAML | Import a solution into the target environment; for canvas-app use, the environment's Power Apps component framework feature must be enabled first (CLM-031) |
| Environment prerequisites | None beyond a standard Power Apps environment | The component-framework feature must be enabled for Canvas apps (on by default for model-driven apps) (CLM-031) |
| Administration requirements | Minimal — a maker can import YAML without admin involvement | Microsoft's own guidance: administrators/system customizers should review and validate code components before import, since Studio components have access to security tokens (CLM-031) |
| Security review | Implicit in the formula/control's visible behavior; no compiled/opaque code | Compiled, potentially opaque TypeScript running with Studio-level access — a genuinely different trust surface, not just a formality |
| Updating/version management | Re-copy-paste the new YAML, or re-import an updated component library — no formal versioning contract unless the vendor provides one | Solution-based; can carry a formal version number, ALM-compatible upgrade/patch semantics |
| ALM behavior | Not solution-aware by default (raw YAML has no solution identity) | Solution-aware; fits standard Power Platform ALM (dev → test → prod pipelines) |
| Theming | Power Fx variables/formulas; as flexible as the author made it | Manifest-declared properties; can integrate a Fluent theme provider, but is a code-level integration point, not a Studio-native one |
| Responsive behavior | Depends entirely on the author's use of Canvas's responsive/auto-layout containers | Depends entirely on the control's own CSS/layout code; the host (Canvas/model-driven) resizes the container, the control must handle it |
| Accessibility testing | No dedicated automated harness exists in this ecosystem's common tooling; verification is manual, in the real Studio/player host | A PCF test harness exists (`pac pcf init` scaffolds a local test page); still ultimately requires real-host verification for true screen-reader behavior |
| Performance testing | Delegation and formula-recalculation behavior are the dominant concern; verified via Power Apps Monitor | `updateView` call frequency, re-render cost, and dataset paging/virtualization are the dominant concerns; verified via browser profiling and the harness |
| Automated testing | Uncommon in the community tooling surveyed in `02-competitor-evidence.md` — no vendor showed evidence of automated Canvas-component testing | Real, if inconsistent, evidence of automated unit testing exists (Microsoft's own `powercat-code-components`, 39 `*.test.ts` files found — CLM-024) |
| Real-host testing | The Studio preview and the player are the real host — relatively low-friction to test in | Requires the control actually be imported into a real environment via a solution to observe true host behavior (screen reader, focus handoff, runtime theme changes) |
| Licensing consequences | None inherent to the component mechanism itself | An external-service call from the component's own client code (not via a connector) makes the component, and any consuming app, **Premium** — requiring end users to hold a full Power Apps license rather than a base Microsoft 365 license (CLM-032) |
| Support burden | Lower — a maker who copy-pastes YAML can usually self-diagnose by reading the formulas | Higher — a bug may require TypeScript debugging, a rebuild, and a new solution import; not accessible to a non-developer maker |
| Compatibility evidence | Compatibility is really "does this Power Fx/YAML work in this Studio version" — rarely formally tracked by any vendor surveyed | Compatibility spans the PCF API version, the React/platform library versions the control depends on, and the target app type (canvas vs. model-driven vs. Power Pages) |
| Target creator skill level | A Power Apps maker with Power Fx fluency; no general-purpose programming required | A professional developer with TypeScript/front-end experience |
| Target buyer/administrator concerns | "Will this formula do what it says, and can our makers understand/modify it?" | "What does this compiled code actually do, who reviewed it, and what does it cost us in licensing?" |

## Explicit statements required by this research's own instruction

- **Canvas component libraries and PCF controls are different technologies.**
  Nothing in this research treats them as interchangeable, and no future
  LowCodeStacks story should either, without an explicit decision naming which
  one (or both, separately) is in scope.
- **Code components are not contained inside Canvas component libraries.** A
  Canvas component library is itself a Canvas-native packaging mechanism; PCF
  controls are packaged as solutions, a structurally different artifact. The
  two can be *used together* in the same app, but one does not subsume the
  other.
- **This project's own website tests do not validate components inside Power
  Apps.** LowCodeStacks's existing accessibility gate (`packages/e2e`, Playwright
  + axe-core) tests the LowCodeStacks *website* — nothing in that suite runs a
  Power Apps Studio host, a Canvas player, or a PCF test harness. If either
  Canvas or PCF assets were ever built or sold through this marketplace, their
  own accessibility/quality verification would need an entirely separate
  toolchain — this project's existing CI gate provides zero coverage of it.
- **PCF may require administrators to review and trust third-party code**
  before it can be used at all (CLM-031) — a real adoption-friction point a
  Canvas-only competitor (like PowerAppsUI) structurally avoids, and which its
  own "no PCF required" marketing explicitly trades on.
- **PCF external-service usage may affect consuming-app licensing** (CLM-032) —
  a PCF control that calls an external API directly (not via a Dataverse
  connector) forces Premium licensing on every app that uses it. This is a
  real cost a buyer/architect persona (per `docs/02-prd.md`'s own personas)
  would need disclosed before adopting any such component — a genuine
  candidate for the kind of "compatibility/licensing evidence" this project's
  existing `CompatibilityRecord` model (`docs/06-data-model.md`) already
  represents for other assets.
- **Copy-paste YAML reduces installation friction but does not itself prove
  accessibility, delegation, performance, or maintainability.** Low friction to
  install is not the same claim as high quality — see
  `04-component-quality-bar.md` and `05-accessibility-verification.md` for why
  these are separate, unproven dimensions across every competitor surveyed.
