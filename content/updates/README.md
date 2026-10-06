# Platform updates (drafts)

Short notes on Power Platform changes for `/updates` and its deprecation tracker (MVP-033 slice D). The agent drafts them **from Microsoft's own documentation only**. They're imported as **drafts**, and the product owner reviews and publishes them in `/admin/updates`. The agent never publishes.

## Import
```
DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=<an existing ADMIN> pnpm --filter @ppu/adapter-content updates:import
```
- Every file is validated first; if any is invalid, nothing is imported.
- Existing slugs are skipped, never overwritten.

## Format
`content/updates/<slug>.md`:
```
---
title: "Power Automate mobile app retired"
slug: power-automate-mobile-app-retired
kind: RETIREMENT           # FEATURE | LICENSING | DEPRECATION | RETIREMENT
technology: POWER_AUTOMATE # optional: one of the seven areas
action: "Move approvers to Teams"   # optional, 40 characters at most
source: https://learn.microsoft.com/...   # required: https on microsoft.com
effective: 2026-08-31      # optional: YYYY-MM-DD; puts it in the tracker (DEPRECATION/RETIREMENT)
replacement: "Approvals app in Microsoft Teams"   # optional: what to switch to
---
One or two plain sentences, in our own words (500 characters at most).
```

## Rules
- **Verify every fact against the linked Microsoft page** on the day you draft it, and state the check date in the pull request.
- **Use our own words.** Never copy Microsoft's text.
- **Give dates as Microsoft gives them.** If Microsoft says only a month ("Effective March 2026"), use the first of that month: the tracker shows month and year only.
- **Make no endorsement claims.**
