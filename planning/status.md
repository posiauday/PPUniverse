# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-09-18 — MVP-003 (Taxonomy and catalog pages) Done.

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 10 | MVP-007, MVP-008, MVP-009, MVP-012, MVP-013, MVP-014, MVP-015, MVP-016, MVP-019, MVP-021, MVP-024, MVP-025 |
| Ready | 9 | MVP-004, MVP-005, MVP-010, MVP-011, MVP-017, MVP-018, MVP-020, MVP-023 |
| In Progress | 0 | — |
| QA | 0 | — |
| Blocked | 0 | — |
| Done | 5 | MVP-001, MVP-002, MVP-003, MVP-006, MVP-022 |
| **Total** | **25** | |

(Backlog count above is 10 items listed but 12 remain in Backlog status — MVP-021 depends on MVP-005, which is now Ready but not Done, so MVP-021 stays Backlog until MVP-005 completes.)

MVP-003 completing unblocked 4 new stories: MVP-004 (Search/filter), MVP-005 (Product detail evidence model), MVP-017 (Tutorials/content), MVP-023 (Accessibility gate) — all depended only on MVP-003.

## Completed stories

### MVP-001 — Repository and CI Baseline
- Foundation · NFR-007 · P0 · Sprint 1 · 5 pts · Completed 2026-09-16

### MVP-002 — Account registration and session
- Identity · FR-004 · P0 · Sprint 2 · 8 pts · Completed 2026-09-18

### MVP-003 — Taxonomy and catalog pages
- Catalog · FR-001 · P0 · Sprint 2 · 8 pts · Completed 2026-09-18
- Category and product listing pages, public/unauthenticated, SEO metadata. `Category`/`Product` schema (6 locked taxonomy categories seeded as real reference data — zero fake product inventory). `packages/ui` established (Tailwind v4 + shadcn/ui conventions) — first UI-heavy story. Scope kept strictly to its documented acceptance criteria after catching a "filtering framework" item that actually belongs to MVP-004 (confirmed with the product owner before coding, per the Decision Validation Rule).
- Real bugs found via actually loading the dev server in a browser (not just `pnpm build` passing): Tailwind wasn't scanning `packages/ui`'s source at all (fixed with `@source`), and the catalog pages were being incorrectly statically prerendered at build time (fixed with `export const dynamic = "force-dynamic"`, which is also the semantically correct choice for content that changes as products get published).
- Full detail, including the security review: `planning/progress-report.md`.

### MVP-006 — Quarantine scan and private storage
- Files · FR-007 · P0 · Sprint 2 · 13 pts · Completed 2026-09-18

### MVP-022 — Observability (operational scope)
- Observability · NFR-007 · P0 · Sprint 2 · 8 pts · Completed 2026-09-18

Full detail on every story, including security reviews and the CI-debugging trail, is in `planning/progress-report.md`.

## Progress metrics

- Stories done: 5 / 25 (20%)
- Points done: 42 / 165 (25%)
- P0 points done: 42 / 140 (30%)
- P1 points done: 0 / 25 (0%)
- Open bugs: 0 (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 1 (see `planning/tech-debt.csv` and `planning/tech-debt/`)
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning.

## Remaining work summary

20 of 25 stories remain (123 of 165 points). Grouped by sprint (sprint numbers = execution waves from `docs/13-implementation-readiness-plan.md` §8):

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-003, MVP-006, MVP-022 | **Done** | 37 (done) |
| 3 | MVP-004, MVP-005, MVP-010, MVP-011, MVP-017, MVP-018, MVP-020, MVP-023 | Ready | 44 |
| 4 | MVP-007, MVP-012, MVP-021 | Backlog | 19 |
| 5 | MVP-008, MVP-013 | Backlog | 16 |
| 6 | MVP-009, MVP-014, MVP-019 | Backlog | 21 |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

Eight stories are Ready. **MVP-005 (Product detail evidence model)** and **MVP-004 (Search/filter)** are the two strongest — both directly extend MVP-003's catalog work while it's fresh, and MVP-005 additionally unblocks MVP-007 (Checkout) and MVP-021 (SEO/sitemap). MVP-010, MVP-011, MVP-018, MVP-020, MVP-017, MVP-023 remain reasonable to parallelize.

## Open bugs

None found. See `planning/bugs.csv` (index) and `planning/bugs/` — both empty. Real issues (Tailwind content scanning, static-vs-dynamic rendering, and the CI infrastructure bugs from earlier stories) were all caught and fixed within their own story before reaching Done — per `CLAUDE.md`'s bug-vs-shortcut distinction, documented in `planning/progress-report.md`, not filed as bugs.

## Open tech debt

1 open item (3 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md), [TD-002](tech-debt/TD-002.md), [TD-003](tech-debt/TD-003.md) — Resolved.
- [TD-004](tech-debt/TD-004.md) — **Open**: MVP-006's file-scan pipeline runs synchronously rather than via a durable job queue.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` is the binding scope/architecture/process record.
- `CLAUDE.md`'s Decision Validation Rule caught two real scope-creep attempts this session (license tiers, MVP-003's "filtering framework") before either was silently built or locked in.
- `docs/open-questions.md` item 24 (new): `/collections/[slug]` and `/creators/[handle]` have no owning backlog story — found during MVP-003, not resolved (safest reversible default: not built).
- Branching: `develop` is the integration branch (real PRs now, via `gh`); `main` is promoted from it as a deliberate release decision (not yet done).
- See `planning/progress-report.md` for complete implementation detail on every story and governance action.
