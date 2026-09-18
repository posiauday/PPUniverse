# Tech debt records

One file per item: `TD-XXX.md`. `planning/tech-debt.csv` is a lightweight index (ID, title, related story/requirement, impact, status) kept in sync with the files here — the `.md` file is the authoritative record.

Logged when a story ships with an intentional shortcut: a non-blocking check that should be blocking, a scope cut, a pinned/downgraded dependency, a manual step that should be automated. See the "Project management rules" in `CLAUDE.md`.

## Template

```markdown
---
id: TD-XXX
title:
related_story:
related_requirement:
impact: Low | Medium | High
status: Open | In Progress | Resolved | Accepted
created_date:
---

## What was deferred and why


## Risk if left unresolved


## Proposed resolution


## Resolved by (story/commit, once closed)

```
