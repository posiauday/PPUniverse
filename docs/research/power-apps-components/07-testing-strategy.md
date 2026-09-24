# Testing Strategy

Research only. This documents a **possible** verification stack, evaluated
against what evidence supports it — not an approved stack, not a commitment,
and not something any current story should build against.

## PCF: candidate verification stack

Evidence for evaluating each of these: `pac` CLI, TypeScript strict mode,
React/platform library testing, and Fluent UI alignment are all standard,
Microsoft-documented parts of the PCF toolchain (`docs/03-canvas-vs-pcf.md`);
Microsoft's own `powercat-code-components` repository is the one concrete piece
of `RepositoryEvidence` this research found of real automated testing in
practice (39 `*.test.ts` files, CLM-024) — everything below that isn't already
platform-standard tooling is informed by that one example, not by a broad
survey of the ecosystem.

- Power Platform CLI (`pac`) — build/package/deploy, the platform-standard
  toolchain entry point
- TypeScript strict mode — catches a real class of defects before runtime;
  standard practice, not exotic
- React and platform libraries where applicable — most modern PCF controls,
  including Microsoft's own, are React-based
- Fluent UI where native alignment is required — if the eventual quality bar
  (`04-component-quality-bar.md`) includes visual consistency with Microsoft's
  own product surfaces
- Manifest validation — a valid, minimal `ControlManifest.Input.xml`
- Linting — standard practice, not PCF-specific
- Unit tests for pure logic — the parts of a control's code that don't touch
  the DOM or the host API are the easiest, highest-value place to start
- React component tests — for the DOM-touching parts, using a standard React
  testing approach
- PCF test harness — Microsoft's own local test page, scaffolded by
  `pac pcf init` (per this session's earlier generator-tooling research; not
  independently re-verified by running it in this pass — no .NET SDK was
  available to install `pac` in that research)
- Browser-based interaction tests — exercising the harness or a real host via
  browser automation
- Visual regression — screenshot-diff testing, catching unintended visual
  drift a functional test wouldn't catch
- Real Dataverse and Power Apps host tests — Layer C from
  `05-accessibility-verification.md`'s framework applies equally to
  functional/performance testing, not just accessibility
- App/Solution Checker where applicable — Microsoft's own static analysis
  tool for Power Platform solutions
- Dependency and license checks — especially relevant given `08-licensing-and-trademarks.md`'s
  findings on how differently-licensed dependencies can complicate an
  otherwise-permissive top-level license
- Secrets scanning — standard practice; this project's own CI already runs a
  secret scan (`CLAUDE.md` required checks) and the same discipline would
  apply to any component source

## Canvas: candidate verification stack

- Power Apps Studio — the only real authoring/runtime environment; there is no
  meaningful Canvas testing outside it
- Component libraries — Canvas's own reuse packaging mechanism, worth using
  deliberately rather than relying on raw copy-paste YAML if maintainability
  matters
- Modern controls — Power Apps's newer control set (the same
  `LayoutMode`/`AutoLayout`/`LayoutDirection` properties PowerAppsUI's own
  catalogue page names as a prerequisite, per `02-competitor-evidence.md`)
- Auto-layout containers — directly relevant to responsive-behavior testing
- YAML source inspection where supported — reviewing the actual formula text,
  not just the rendered behavior
- Power Fx validation — Studio's own formula-checking, the first line of
  defense against a broken formula
- App Checker — Microsoft's own static analysis for Canvas apps (accessibility
  and performance advisories included)
- Monitor — the standard tool for real formula-evaluation timing
  (`06-performance-verification.md`)
- Sample host apps — a component is only really testable inside a real app
  that uses it, not in isolation
- Solution-aware ALM tests — if packaged via a component library rather than
  raw YAML
- Phone, tablet, and responsive form factors — Canvas's three real target
  form factors
- Manual accessibility testing — Layer B from `05-accessibility-verification.md`
- Real-host keyboard and screen-reader testing — Layer C from the same
  document

## Who/what can actually perform each check

| Check category | Performed by |
|---|---|
| Static analysis, linting, type checking, manifest validation | Automatable — Claude Code or any CI agent can run these directly |
| Unit tests, pure-logic tests | Automatable |
| `pac` CLI-driven build/package/deploy | Requires the Power Platform CLI installed — confirmed not available in this session's sandbox without first installing a full .NET SDK (this session's earlier generator-tooling research) |
| Real environment tests (Dataverse, real Canvas/model-driven host, Studio) | Requires an actual Power Platform environment — not available to this research pass at all |
| Manual keyboard/zoom/reduced-motion checks | Requires a human operator |
| Real screen-reader verification | Requires a human operator with assistive-technology expertise, ideally someone who uses that technology day to day, not just a sighted developer toggling a screen reader on |
| Legal review of dependency licenses, third-party terms, trademark usage | Requires legal review — explicitly flagged wherever it applies in `08-licensing-and-trademarks.md` |

## Explicit statement required by this research's own instruction

**No tool in either stack above is represented as guaranteeing error-free
output.** Every item is a check that can catch some defect classes and not
others — the layered structure in `05-accessibility-verification.md` and the
"who can actually perform each check" table above exist specifically to keep
that distinction visible rather than implying that passing CI, or passing a
linter, means a component is correct, accessible, or performant.
