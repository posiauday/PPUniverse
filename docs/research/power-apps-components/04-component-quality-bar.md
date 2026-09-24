# Component Quality Bar

**This document is a RESEARCH DRAFT, NOT APPROVED.** It is a matrix of quality
dimensions worth considering if either Canvas components or PCF controls are
ever built, not a specification, not a commitment, and not a requirement on any
current or future story.

Never use, about any component this research discusses or any hypothetical
future one: error-free, zero defects, WCAG compliant, WCAG certified, fully
accessible, Microsoft certified, official, or endorsed by Microsoft. This
document does not use those terms below, and no future document derived from it
should either.

Draft release target, offered as a starting bar, not decided: **no known
critical defects; no unexplained test failures; no unsupported compatibility
claims; all known residual limitations documented.**

## Canvas component quality matrix (draft)

| Dimension | What "good" would need to show, in principle |
|---|---|
| Purpose and use cases | A stated, scoped purpose — not "a flexible do-everything control" |
| Supported hosts | Which Canvas app types (tablet/phone form factor, custom pages, Power Pages if applicable) |
| Form factors | Explicit behavior at each supported breakpoint |
| Property/event contract | Every exposed Power Fx property and event documented, with type and default |
| Configuration surface | What a maker can change without editing the underlying formulas |
| Input validation | Behavior on invalid/out-of-range input, not silent failure |
| Empty state | Explicit, not "just blank" |
| Loading state | Explicit if the component depends on a delegable/async data source |
| Error state | Explicit, and distinguishable from the empty state |
| Disabled/read-only states | Both present and visually distinguishable |
| Responsive behavior | Verified at the breakpoints this project's own UX system already defines (`docs/05-ux-design-system.md`) |
| Theme behavior | Explicit light/dark handling — this project's own design system is "light theme first; dark theme only after parity," a real precedent worth reusing if this is ever built |
| Light mode | Verified, not assumed |
| Dark mode | Verified, not assumed, and not simply "inverted colors" |
| Forced-colour / high-contrast | Verified under Windows High Contrast / forced-colors mode specifically — none of the competitors surveyed in `02-competitor-evidence.md` documented this |
| Localisation | Whether text is hard-coded or externalized; none of the competitors surveyed documented a localization story |
| Keyboard model | A stated tab order and key bindings, not "whatever Studio does by default" |
| Focus model | Explicit — where focus goes on open/close/error |
| Screen-reader semantics | What a screen reader actually announces, verified in the real host, not inferred from markup alone |
| Performance limits | Documented delegation limits, gallery/collection size guidance |
| Delegation limits | Explicit — which operations delegate to the data source and which don't |
| Dataset limits | A stated row-count guidance, not silence |
| Security considerations | Whether the component's formulas ever touch a connection/credential directly |
| External connections | Declared, if any |
| Versioning | A real version number and changelog, not "just re-copy the latest YAML" |
| Upgrade behavior | What happens to an app using an older copy-pasted version when a new one ships — copy-paste has no update mechanism by default, which is itself a documented limitation, not a defect to hide |
| Installation | Documented import steps |
| Removal | Documented — how a maker fully removes the component's formulas/dependencies |
| Dependencies | Any dependency on another component/library, named |
| Licences and notices | Present and accurate for whatever license is chosen |
| Documentation | Present, not just a live demo |
| Example apps | At least one, if feasible |
| Maintenance policy | Stated, not implied |
| Support policy | Stated, matching this project's own existing `SupportPolicy`/support-model conventions (`docs/09-marketplace-operations.md`) if ever sold through this marketplace |
| Compatibility evidence | Using this project's own existing `CompatibilityRecord` model's vocabulary (Creator Declared / Marketplace Reviewed) if ever sold here — not a new, incompatible vocabulary |

## PCF code component quality matrix (draft)

Same dimensions as the Canvas matrix above, plus PCF-specific additions:

| Additional PCF dimension | What "good" would need to show |
|---|---|
| Manifest correctness | A valid, minimal `ControlManifest.Input.xml` with no unused declared properties |
| Lifecycle correctness | Correct, side-effect-free `init`/`updateView`/`getOutputs`/`destroy` — a control that leaks resources on `destroy` is a real, checkable defect class |
| `updateView` cost | Does the control re-render unnecessarily on every host call, or only on real prop changes? |
| Dataset control paging/virtualization | For dataset-type controls specifically — does it handle large row counts without loading everything at once? |
| External-service declaration | If the control calls an external service directly, is `<external-service-usage>` correctly declared (CLM-032), and is the licensing consequence documented for a buyer? |
| Administrator trust posture | Is there anything in the control's own documentation helping an administrator decide whether to trust/import it (CLM-031)? None of the sources surveyed in this research documented this explicitly. |
| Build reproducibility | Can the control be rebuilt from source with a documented, pinned toolchain version? |
| Test harness usage | Evidence of the PCF test harness being used during development, not just a production build |
| Automated tests | Real unit/component tests exist — Microsoft's own `powercat-code-components` is the only source in this research with concrete evidence of this (CLM-024) |

## Explicit reservation

**Nothing in either matrix above is a commitment.** No component has been built.
No quality bar has been approved. This is offered as a discussion draft for
whoever eventually scopes PROP-008, if it is ever un-parked.
