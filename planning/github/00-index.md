# GitHub Delivery Structure — Index

Planning artifacts only. No application code. Derived from `CLAUDE.md`, `planning/mvp-backlog.csv`, `docs/01-brd.md`, and `docs/02-prd.md`. Scope is limited to the approved MVP backlog (MVP-001…MVP-025); nothing here expands it.

| File | Contents |
|---|---|
| [01-epics.md](01-epics.md) | GitHub Epics — one per backlog Epic column, 20 total |
| [02-features.md](02-features.md) | GitHub Features — one per backlog row (MVP-001…MVP-025), 25 total |
| [03-user-stories.md](03-user-stories.md) | GitHub User Stories — persona-based breakdown of each Feature |
| [04-bug-template.md](04-bug-template.md) | GitHub Bug issue template |
| [05-labels.md](05-labels.md) | GitHub label taxonomy |
| [06-project-board.md](06-project-board.md) | GitHub Project (v2) board structure, views, and automation |

## Hierarchy

```
Epic (business capability, BRD-aligned)
 └── Feature (one MVP-xxx backlog row; requirement-traceable)
      └── User Story (persona-based slice of a Feature; PRD-aligned)
           └── (implementation tasks are created during /vertical-slice work, not here)
```

## Creating these in GitHub

Nothing in this folder has been pushed to GitHub — creating issues, labels, and a project board are visible, side-effectful GitHub actions and require explicit confirmation and a configured remote (none exists yet per `git status`). These files are the content to create from, either by hand or via an approved automation (e.g., `gh issue create`, `gh label create`, `gh project create`) once the user authorizes it.
