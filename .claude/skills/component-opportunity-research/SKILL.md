---
name: component-opportunity-research
description: Research-only extension of the Power Apps component landscape package. Manual invocation only.
disable-model-invocation: true
---
# Component Opportunity Research

Manual-invoke only, research-only. Never triggered automatically. This skill
extends `docs/research/power-apps-components/` — it does not build, prototype,
propose a final catalogue, or decide Canvas vs. PCF, pricing, licensing, or
architecture. Nothing it produces is approved by running it.

## Before doing anything else

1. Read `CLAUDE.md`, specifically the Decision Validation Rule. A table row, an
   index entry, or a prior research finding is a claim to verify, not a
   decision to trust — that rule applies to this skill's own past output too.
2. Read `docs/research/power-apps-components/README.md` for current scope and
   the strongest open questions.
3. Load `evidence-rules.md` before recording any new claim.
4. Load `quality-matrix.md` only if the task touches component quality,
   accessibility, or performance dimensions.
5. Load `report-template.md` only when producing a final report back to the
   user.

## Terminology (non-negotiable)

Canvas component, PCF code component, and complete Canvas app template are
three different asset types with different implementation, testing,
installation, security, support, and distribution requirements. Never combine
them into one generic "Power Apps component" model. See
`docs/research/power-apps-components/03-canvas-vs-pcf.md`.

## What this skill does

- Extends the research files in `docs/research/power-apps-components/` with
  new findings, following the same file structure and evidence discipline
  already established there.
- Adds new rows to `docs/research/power-apps-components/claims-register.csv`,
  classified per `evidence-rules.md`.
- Updates `docs/research/power-apps-components/sources.md` for any new source
  used.

## What this skill never does

- Never creates production code, a component, a scaffold, or a prototype.
- Never creates a backlog item (`planning/mvp-backlog.csv`,
  `planning/backlog.csv`) or a new proposed story
  (`planning/proposed-stories.md`) — extending PROP-008's own scope, once it
  exists, is a product-owner decision, not something this skill does on its
  own initiative.
- Never modifies `docs/final-decisions.md`.
- Never marks any research conclusion, claim, or recommendation as approved.
- Never claims WCAG conformance, certification, or "fully accessible" —
  see `evidence-rules.md`'s banned-word list.
- Never claims zero defects or "error-free."
- Never claims Microsoft endorsement, certification, or official status.
- Never fabricates a number, date, or source. A claim with no locatable source
  is recorded as `Unknown`, not filled in with a plausible-sounding answer.

## Required practice

- Every factual claim must have a primary source and a classification
  (`evidence-rules.md`).
- Contradictions between sources are preserved side by side, never silently
  resolved in favor of the more convenient reading.
- Any decision this research surfaces as unresolved (shape, pricing,
  architecture, Canvas-vs-PCF scope) is returned to the product owner in the
  final report, not decided by this skill.

## Output

Follow `report-template.md`'s heading structure when reporting back. Keep the
report itself out of `docs/final-decisions.md` and out of any backlog file —
it belongs in `docs/research/power-apps-components/` and, if the invocation
was a chat-session request rather than a durable extension, in the chat
response itself.
