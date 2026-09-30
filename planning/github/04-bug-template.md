# GitHub Bug Report Template

Intended target: `.github/ISSUE_TEMPLATE/bug_report.md` (or the equivalent YAML issue-form) once a GitHub remote exists. Content only — not installed by this task.

```markdown
---
name: Bug report
about: Report a defect in a shipped or in-progress feature
title: "[BUG] "
labels: type:bug
assignees: ''
---

## Summary
One or two sentences describing the defect.

## Severity
Select one, using the incident priorities in `docs/12-devops-runbook.md`:
- [ ] P0 — security, payment, or data exposure
- [ ] P1 — checkout or download outage
- [ ] P2 — degraded search, notifications, or first-party publishing workflow (reworded 2026-09-24, `docs/final-decisions.md`)
- [ ] P3 — minor content or admin issue

## Affected requirement / feature
- Requirement ID (FR-xxx / NFR-xxx):
- Related Feature/Epic issue (#):

## Environment
- Environment: local / preview / staging / production
- Browser/OS (if UI):
- User role (guest / member / admin) — ~~creator / moderator~~ removed 2026-09-24, `docs/final-decisions.md` (first-party-only publishing; no creator role, moderator scope under review):

## Steps to reproduce
1.
2.
3.

## Expected behavior


## Actual behavior


## Evidence
- Correlation ID (from response header or logs):
- Screenshots / screen recording:
- Relevant log excerpt (no secrets, no payment details, no uploaded file contents — per NFR-006):

## Security or privacy impact
- [ ] This bug could allow unauthorized data access, authorization bypass, payment manipulation, or malware delivery.
      If checked, also apply the `type:security` label and notify the security/privacy owner before public discussion, per `docs/08-security-privacy-compliance.md`.

## Accessibility impact
- [ ] This bug blocks keyboard, screen-reader, or WCAG 2.2 AA conformance.
      If checked, also apply the `type:accessibility` label.

## Suggested fix (optional)

```

## Field notes
- Never paste actual secrets, tokens, payment details, customer PII, or uploaded file contents into an issue — use the correlation ID to look up logs instead, consistent with NFR-006.
- A P0 bug must page on-call per the incident runbook, not wait for normal triage.
- Every bug references the requirement or feature it regressed so the traceability CSV in `planning/requirement-traceability.csv` stays accurate.
