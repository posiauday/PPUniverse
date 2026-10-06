# Content brief: Power Automate (all sections), 2026-10-06

**Status:** titles proposed for product-owner approval (`docs/final-decisions.md`, 2026-10-06, "Content plan targets and order").

## Method and limits
- **Demand:**
  - about 35 recent threads in the official Power Platform Community, Power Automate forum, read 2026-10-06. Read-only, used only to see which problems recur; nothing is copied and no usernames are recorded. Themes are paraphrased.
  - the forum's **featured topics**, pinned because they come up repeatedly: start-and-wait approvals; restoring a deleted flow; asking for help with a workflow.
  - Microsoft Learn's troubleshooting pages (see `docs/research/technology-daily-needs.md`).
- **Limits:**
  - the sample is recent activity, not all-time volume;
  - the forum's "most replied" sort couldn't be used from the page;
  - there's no Search Console data yet.

  Re-rank after 4–8 weeks of search data.

## Demand themes, strongest first

| # | Theme (paraphrased) | Seen as | Section |
| --- | --- | --- | --- |
| 1 | Large SharePoint lists: getting past 100 or 5,000 items; exporting very large lists quickly | Several threads, plus Microsoft's own Get items page | Triggers & flow design |
| 2 | Filter queries that error: dates ("last 2 days"), lookups, SQL and SharePoint syntax | Several threads | Triggers & flow design |
| 3 | Dynamic content that "isn't there": columns missing from the picker, nested JSON from webhooks, loops | Several threads | Triggers & flow design |
| 4 | Files and attachments: Forms uploads into folders, email attachments (including .msg), SMTP attachments, Create file and Convert file failures | Many threads | Triggers & flow design |
| 5 | Intermittent 502 Bad Gateway and InternalServerError on actions that used to work | Several threads in two days | Errors, retries & limits |
| 6 | Desktop flows: machine runtime "connected" but the cloud flow says "Connection not found"; browser extension not detected; UI elements not found after changes | Several threads, plus a pinned known-issue | Desktop flows |
| 7 | Solutions: moving a cloud flow into a solution; missing dependencies on import | Several threads | Run & monitor (ALM) |
| 8 | Approvals: start-and-wait behaviour, reminders | Featured topic | Approvals |
| 9 | Reminder emails for items due soon (scheduled flow, date filters) | Threads | Triggers & flow design |
| 10 | AI actions (Run a prompt, agents) failing on capacity or entitlement | Threads | Choose the right tool |
| 11 | Child flows: retries and errors | Threads | Errors, retries & limits |

## What exists
- **Approvals:** "Approvals that don't stall" (TUTORIAL).
- **Errors, retries & limits:** "Try, catch and finally" (PATTERN) and "Cloud flow error codes" (REFERENCE).
- **Choose the right tool:** "Cloud flows or Logic Apps?" (COMPARISON).
- **Run & monitor:** "Flow health KPIs" (KPI_GUIDE).
- **Empty:** Triggers & flow design; Desktop flows.

## Proposed titles

Priority **P1** = write in the next session; **P2** = the session after. Every title targets a phrase people actually type.

**Triggers & flow design** (empty, highest demand)

| Kind | Title | Targets | Priority |
| --- | --- | --- | --- |
| REFERENCE | OData filter query cheat sheet for SharePoint, Dataverse and SQL Server | "filter query power automate date", "get items filter lookup" | P1 |
| TUTORIAL | Get more than 5,000 SharePoint items: pagination, thresholds and faster options | "get items more than 5000", "power automate pagination" | P1 |
| TUTORIAL | Dynamic content missing? Parse JSON, nested arrays and loops explained | "dynamic content not showing", "parse json nested array" | P1 |
| TUTORIAL | Why didn't my trigger fire? (already planned on the board) | "power automate trigger not firing" | P1 |
| TUTORIAL | Files and attachments in flows: Forms uploads, email attachments and folders | "save forms attachment to sharepoint folder" | P2 |
| PATTERN | Reminder emails for items due soon | "send reminder email before due date" | P2 |

**Errors, retries & limits** (2 items)

| Kind | Title | Targets | Priority |
| --- | --- | --- | --- |
| TUTORIAL | 502 Bad Gateway and other intermittent failures: retry, wait or report | "502 bad gateway power automate" | P1 |
| PATTERN | Child flows that fail well: retries, errors and returning results | "child flow error handling" | P2 |

**Desktop flows** (empty)

| Kind | Title | Targets | Priority |
| --- | --- | --- | --- |
| TUTORIAL | "Connection not found": fixing machine and runtime connections for desktop flows | "desktop flow connection not found machine" | P1 |
| PATTERN | UI elements that survive changes: robust selectors for desktop flows | "ui element not found power automate desktop" | P2 |

**Approvals** (1 item)

| Kind | Title | Targets | Priority |
| --- | --- | --- | --- |
| REFERENCE | Approval actions compared: start-and-wait, create plus wait, sequential, parallel and timeouts | "start and wait for an approval" | P2 |

**Choose the right tool** (1 item)

| Kind | Title | Targets | Priority |
| --- | --- | --- | --- |
| COMPARISON | Cloud flow, agent flow or desktop flow? | "agent flow vs cloud flow" | P2 |

**Run & monitor** (1 item)

| Kind | Title | Targets | Priority |
| --- | --- | --- | --- |
| TUTORIAL | Move a cloud flow into a solution, and fix "missing dependencies" on import | "add existing flow to solution", "missing dependencies import solution" | P1 |
| TUTORIAL | Restore a deleted flow | "restore deleted flow power automate" | P2 |

**Totals:** 13 new items (P1: 7, P2: 6). With the 5 existing ones that makes 18 items for Power Automate, and every section has at least 2.

## Ground truth to check each guide against
- [Working with Get items and Get files](https://learn.microsoft.com/sharepoint/dev/business-apps/power-automate/guidance/working-with-get-items-and-get-files) (100 default, 5,000 threshold)
- [Limits and configuration](https://learn.microsoft.com/power-automate/limits-and-config) (pagination 5,000 Low / 100,000 others)
- [Troubleshoot cloud flow errors](https://learn.microsoft.com/power-automate/troubleshoot-flow-errors) and [Fix connection failures](https://learn.microsoft.com/power-automate/fix-connection-failures)
- [Troubleshoot triggers](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot)
- Desktop flows: machine and connection troubleshooting pages on Microsoft Learn (to fetch when writing)
- Solutions: "Create a cloud flow in a solution" / "Add an existing flow to a solution" (to fetch when writing)
