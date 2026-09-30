# Accessibility Verification

Research only. No accessibility conformance is claimed for anything in this
package. Never use, about any component this research discusses: WCAG
compliant, WCAG certified, or fully accessible.

## The finding this research keeps coming back to

Across every source checked in `02-competitor-evidence.md` and
`01-market-landscape.md` — two commercial vendors and three Microsoft
first-party repositories — **not one publicly documented an accessibility
verification method.** Microsoft's own `powercat-creator-kit` README, read
directly, makes no mention of accessibility or WCAG at all (CLM-023, CLM-030).
This is the single most consistent, citable gap this research found. It is
recorded here as a fact about what is publicly visible, not a claim about what
any of these projects actually did or didn't do internally.

## Three verification layers

Accessibility verification for a Power Apps component (Canvas or PCF) is not
one activity — it is at least three, each catching different defect classes,
and none substituting for another.

### Layer A — automated verification

What it can catch: structural/semantic omissions, obvious contrast failures,
missing keyboard-event handlers, focus-state regressions in isolated component
tests.

Examples:
- Static semantic checks (does a control expose the ARIA role/properties it
  should, at the markup level)
- Automated accessibility scans (axe-core or equivalent, run against the
  component in isolation)
- Contrast ratio calculations against declared color tokens
- Property/manifest validation (e.g., a PCF control's declared output types
  match what it actually returns)
- Keyboard-event unit tests (does the handler fire on the right key)
- Focus-state component tests (does a `focus()` call move focus where the test
  expects, in an isolated test environment)

What it explicitly cannot catch: whether a real screen reader announces the
control correctly inside a real Power Apps host, whether focus actually lands
correctly when the host itself manages focus around the component, or whether
the component behaves correctly under real runtime theme changes.

### Layer B — manual verification

What it can catch: everything Layer A structurally cannot, still without a
live Power Apps host.

Examples:
- Keyboard-only operation, exercised by a person, not a script
- Logical focus order (does tabbing through the component make sense)
- No keyboard traps
- Zoom and reflow behavior at high browser zoom levels
- Reduced-motion respect (does the component honor
  `prefers-reduced-motion`)
- High-contrast and forced-colors mode behavior
- Error identification (is a validation error actually perceivable, not just
  present in markup)
- Status announcements (does a live-region update actually get announced)

### Layer C — real Power Apps host verification

What it can catch: everything that only exists once the component is actually
running inside Power Apps — the layer every source surveyed in this research
was silent about.

Examples:
- Canvas host behavior specifically (how the Canvas player wraps/positions the
  component)
- Model-driven host behavior specifically (a different host, different focus
  and layout rules)
- Power Apps Studio behavior during authoring (does the component behave
  sanely for a maker configuring it, not just an end user running the app)
- Screen-reader operation inside the real host — naming the actual assistive
  technology (e.g. NVDA, JAWS, VoiceOver, TalkBack), the actual browser, the
  actual host (Studio/player/Teams-embedded), and the actual scenario tested.
  A screen-reader claim without all four of these named is not a verifiable
  claim.
- Focus entering and leaving the component as the host itself manages
  navigation around it (a component can pass every Layer A/B check and still
  break when the surrounding host's own focus management interacts with it)
- Runtime theme changes (a maker or admin changing the app's theme while the
  app is running — does the component's own theming respond)
- App resizing and orientation changes
- Mobile host behavior specifically, where the component claims mobile support

## Explicit statements required by this research's own instruction

- **Automated tools do not establish conformance.** Layer A is necessary, not
  sufficient. A component that passes every automated scan can still fail
  Layer B or Layer C.
- **LowCodeStacks's marketplace CI does not establish component
  accessibility.** The existing `packages/e2e` Playwright + axe-core gate tests
  the LowCodeStacks *website* (product pages, search, checkout flows, etc.).
  It has never run, and as currently built cannot run, a Power Apps Studio
  host, a Canvas player, or a PCF test harness. Zero of this project's
  existing 855+ accessibility checks (`planning/status.md`) verify anything
  about a Power Apps component's own accessibility — this would need to be
  built from nothing if ever pursued.
- **Accessibility claims require identified scope, method, host, version, and
  residual limitations.** A bare "accessible" label, without naming what was
  tested, how, on what host, on what version, and what wasn't covered, is not
  a claim this research package treats as meaningful — and per the banned-word
  list above, "accessible" as a bare label should not be used at all;
  described, scoped claims should be used instead.
- **Screen-reader testing must name the assistive technology, browser, host,
  and scenario tested.** See Layer C above — this is the standard this
  research holds any future claim to, and the standard by which every
  competitor surveyed in `02-competitor-evidence.md` was found to have
  published nothing.
