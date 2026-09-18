# GitHub Project Board Structure

Design for a GitHub Projects (v2) board. Content only — creating the project is a side-effectful GitHub action requiring explicit confirmation and a configured remote.

## Project
- Name: `Power Platform Marketplace — MVP`
- Linked repository: this repository (once a remote exists)
- Items: all Epics, Features, Stories, and Bugs from `01-epics.md`–`04-bug-template.md`.

## Custom fields
| Field | Type | Values |
|---|---|---|
| `Priority` | Single select | P0, P1, P2, P3 |
| `Epic` | Single select | The 20 values in `01-epics.md` |
| `Requirement` | Text | e.g. `FR-006`, `NFR-001` |
| `Status` | Single select | Backlog, Ready, In Progress, In Review, Blocked, Done |
| `Wave` | Number | Execution wave 1–8, from `docs/13-implementation-readiness-plan.md` §8 |
| `Security Gate` | Single select | N/A, Pending, Passed |
| `Accessibility Gate` | Single select | N/A, Pending, Passed |

## Status column definitions
- **Backlog** — created, not yet ready (dependencies unmet or awaiting an open-question resolution).
- **Ready** — all `Depends on` issues are in Done; can be picked up.
- **In Progress** — actively being implemented under `/vertical-slice`.
- **In Review** — PR open, CI running or awaiting review/approval.
- **Blocked** — explicitly stalled; must carry `status:blocked` label and a linked blocking issue or open-question reference.
- **Done** — merged, CI green, and (where applicable) security/accessibility gates passed.

## Views
1. **Delivery board** (board view, grouped by `Status`) — default working view for engineering.
2. **By Epic** (board view, grouped by `Epic`) — for the product owner to see cross-cutting progress against BRD objectives.
3. **By Wave** (table view, sorted by `Wave` then `Priority`) — mirrors the execution sequence in `docs/13-implementation-readiness-plan.md` §8, used for sprint/iteration planning.
4. **Security & Accessibility gate tracker** (table view, filtered to `Security Gate != N/A OR Accessibility Gate != N/A`) — used before any release to confirm both gates named in `docs/08-security-privacy-compliance.md` and `docs/05-ux-design-system.md` are clear.
5. **P0 launch-gate view** (table view, filtered to `Priority = P0`) — must be 100% Done before FEAT-025 (launch gate) can start, matching its "Depends on: All P0 Features" rule.
6. **Bug triage** (board view, filtered to `type:bug`, grouped by computed severity) — separate from feature delivery so incoming defects don't get lost in Epic swimlanes.

## Automation
- New issue with label `type:feature` or `type:story` → auto-added to project, `Status = Backlog`.
- Issue closed via a merged PR → `Status = Done`.
- PR opened referencing an issue → issue `Status = In Review`.
- Label `status:blocked` added/removed → `Status` field synced to `Blocked` / previous status.
- A Feature's `Status` cannot move to `Ready` while any linked "Depends on" issue is not `Done` — enforced by a scheduled check or manual gate review, since dependency-aware automation is not native to Projects v2 without a custom Action.

## Governance tie-in
- Every board item must carry `Requirement` so `planning/requirement-traceability.csv` can be reconciled against the board periodically (owner: technical lead, per `docs/00-document-index.md` change-control table).
- `Wave` values must not be edited independently of `docs/13-implementation-readiness-plan.md` §8 — if the execution sequence changes, update that document first, then the board, to keep one source of truth.
