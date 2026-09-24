# Report Template

Loaded by `component-opportunity-research` when producing a final report.
Use exactly these headings, in this order, matching the structure the
original research consolidation instruction (2026-09-24) established:

```
FILES CREATED
FILES MODIFIED
CLAIMS RECORDED
CONTRADICTIONS RECORDED
LICENSING FINDINGS
PRICING FINDINGS
ADOPTION FINDINGS
QUALITY-BAR FINDINGS
PAIN POINTS
FACTS STILL UNKNOWN
PRODUCT-OWNER DECISIONS EVENTUALLY REQUIRED
SKILL CREATED OR UPDATED
CONFIRMATION OF NO IMPLEMENTATION
CONFIRMATION OF NO BACKLOG OR DECISION CHANGE
```

Under each heading, be concrete — file paths, claim IDs, exact figures — not a
narrative summary. "CONFIRMATION OF NO IMPLEMENTATION" and "CONFIRMATION OF NO
BACKLOG OR DECISION CHANGE" must each state explicitly what was checked (e.g.
"no `.ts`/`.tsx` file was created or modified outside `docs/research/` and
`.claude/skills/`; `planning/mvp-backlog.csv` and `docs/final-decisions.md`
were not touched") rather than asserting compliance without evidence.

Do not open a pull request as part of this skill's own output unless the
invocation explicitly asks for one — the original research branch this skill
extends (`research/power-apps-component-landscape`) was deliberately left
without a PR, per direct instruction, so the product owner controls when it
becomes visible for review.
