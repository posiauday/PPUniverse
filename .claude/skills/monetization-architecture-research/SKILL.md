---
name: monetization-architecture-research
description: Research-only extension of the LowCodeStacks monetization audit. Manual invocation only.
disable-model-invocation: true
---
# Monetization Architecture Research

Manual-invoke only, research-only. Never triggered automatically. This
skill extends `docs/research/monetization/` — it does not implement any
revenue model, does not change checkout or entitlement logic, does not add
pricing, subscriptions, ads, tracking, or affiliate links, and does not
resolve any commercial, legal, tax, or employment question.

## Before doing anything else

1. Read `CLAUDE.md`, specifically the Decision Validation Rule. A table
   row, an index entry, or a prior research finding (including this
   package's own) is a claim to verify against the current codebase, not a
   decision to trust blindly.
2. Read `docs/research/monetization/README.md` for current scope and the
   strongest findings.
3. Load `evidence-rules.md` before recording any new claim.
4. Load `architecture-audit-template.md` when auditing a new capability
   against real repository code.

## What this skill does

- Extends the research files in `docs/research/monetization/`, following
  the same structure and evidence discipline already established there.
- Adds new rows to `docs/research/monetization/claims-register.csv`
  (continuing the `MON-###` ID sequence), classified per
  `evidence-rules.md`.
- Re-verifies architecture claims against the **current** state of the
  repository before repeating them — a "does not exist" finding from an
  earlier date may have changed if MVP-007, MVP-011, MVP-012, or MVP-013
  have started since.
- Updates `docs/research/monetization/sources.md` for any new source used.

## What this skill never does

- Never implements advertising, tracking scripts, affiliate links,
  sponsored content, pricing, subscriptions, bundles, coupons, commissions,
  creator payouts, tax logic, or Stripe Connect.
- Never changes checkout, entitlement logic, or product licence terms.
- Never modifies `Article`, Prisma schema, or any production code.
- Never modifies CI.
- Never adds a feature flag (none exist in this codebase today — adding one
  is itself a real architecture decision, not something this skill does
  unprompted).
- Never adds a newsletter category, creates content, or creates blog posts.
- Never modifies `docs/final-decisions.md`, MVP statuses, or backlog files.
- Never adds a backlog or proposed story without a later, separate, direct
  instruction.
- Never closes an open question.
- Never resolves a legal, tax, entity, or employment question — it may only
  flag where architecture depends on one, per `evidence-rules.md`.
- Never claims expected revenue for any model.
- Never claims ad-network approval, tax compliance, or legal compliance.
- Never fabricates a claim. A fact with no locatable source is recorded as
  `Unknown`, not filled in with a plausible-sounding answer.

## Required practice

- Every factual claim gets a primary source (official documentation
  preferred over vendor claims) and a classification.
- Every architecture claim is verified against the **real, current**
  repository — not `docs/06-data-model.md`'s placeholder list alone. A
  model named there is not evidence it exists; check the actual Prisma
  schema file.
- Contradictions between sources are preserved side by side, never silently
  resolved.
- Revenue projections are never fabricated — if no reliable revenue figure
  exists for a model, say so, don't estimate one.
- Any decision this research surfaces as unresolved is returned to the
  product owner in the final report, not decided by this skill.

## Output

Keep the report itself out of `docs/final-decisions.md` and out of any
backlog file — it belongs in `docs/research/monetization/` and, for a
chat-session invocation, in the chat response itself. Do not open a pull
request as part of this skill's own output unless the invocation explicitly
asks for one.
