# GitHub Labels

Content for `gh label create` (or manual setup) once a GitHub remote exists. Colors are suggestions; keep them consistent, not prescriptive.

## Type
| Label | Color | Description |
|---|---|---|
| `type:epic` | `#5319E7` | Business capability tracking a set of Features |
| `type:feature` | `#0052CC` | One backlog row (MVP-xxx); requirement-traceable |
| `type:story` | `#1D76DB` | Persona-based slice of a Feature |
| `type:bug` | `#D73A4A` | Defect in shipped or in-progress work |
| `type:chore` | `#C5DEF5` | Non-functional maintenance (deps, config, docs) |
| `type:security` | `#B60205` | Security or privacy-impacting item; requires security/privacy sign-off |
| `type:accessibility` | `#0E8A16` | Accessibility defect or gate item |
| `type:spike` | `#FBCA04` | Time-boxed investigation, no shipped behavior |

## Priority
| Label | Color | Description |
|---|---|---|
| `priority:P0` | `#B60205` | Required for MVP launch gate (MVP-025) |
| `priority:P1` | `#D93F0B` | Post-P0, still in approved MVP scope |
| `priority:P2` | `#FBCA04` | Degraded but non-blocking (bug severity only) |
| `priority:P3` | `#C2E0C6` | Minor (bug severity only) |

## Epic (one per `01-epics.md` entry)
`epic:foundation`, `epic:identity`, `epic:catalog`, `epic:files`, `epic:commerce`, `epic:entitlements`, ~~`epic:creator`~~ (reworded 2026-09-24, `docs/final-decisions.md`, "First-party-only publishing model" — see `epic:publishing` below), `epic:moderation` (scope under review, same decision), `epic:publishing`, `epic:account`, `epic:reviews`, `epic:content`, `epic:notifications`, `epic:admin`, `epic:privacy`, `epic:seo`, `epic:observability`, `epic:accessibility`, `epic:support`, `epic:launch`
Color: `#E4E6EB` for all (grouping label; priority/type labels carry the emphasis).

## Requirement (applied per issue, values from PRD/TRD)
Format `requirement:FR-xxx` or `requirement:NFR-xxx`, e.g. `requirement:FR-006`, `requirement:NFR-001`. Created on demand as issues reference requirements — not a fixed enumerable set, since the PRD may add requirement IDs over time within approved scope.
Color: `#BFD4F2`

## Area (technical surface, applied per issue)
| Label | Color | Description |
|---|---|---|
| `area:frontend` | `#FEF2C0` | Web UI |
| `area:api` | `#FEF2C0` | Route handlers / server API |
| `area:db` | `#FEF2C0` | Schema, migrations, queries |
| `area:worker` | `#FEF2C0` | Background jobs |
| `area:infra` | `#FEF2C0` | CI/CD, deployment, environments |
| `area:adapter` | `#FEF2C0` | Identity/payments/storage/scanning/search/email adapters |

## Status (workflow, usually board-driven rather than manually applied)
| Label | Color | Description |
|---|---|---|
| `status:blocked` | `#000000` | Cannot proceed; blocking issue must be linked |
| `status:needs-decision` | `#EE0701` | Blocked on an item in `docs/open-questions.md` |
| `status:needs-security-review` | `#B60205` | Awaiting the security gate named in `docs/08-security-privacy-compliance.md` |
| `status:needs-accessibility-review` | `#0E8A16` | Awaiting the accessibility gate |

## Usage rules
- Every issue gets exactly one `type:*` and one `priority:*` (bugs only) or is a Feature/Story inheriting priority from its backlog row.
- `epic:*` is mandatory on Features and Stories, optional on Bugs (apply if root-caused to a specific Epic).
- `type:security` and `type:accessibility` are additive — apply alongside the primary type label, never instead of it.
- Do not invent new `epic:*` values outside the 20 in `01-epics.md` without an approved backlog/scope change, per CLAUDE.md's "MVP scope cannot expand" rule.
