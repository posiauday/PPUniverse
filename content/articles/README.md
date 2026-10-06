# Launch articles

Each article is one Markdown file, reviewed in a pull request, then imported as a **draft** for the product owner to publish (MVP-029; `docs/final-decisions.md`, "Launch content plan approved").

## Where a file goes
`content/articles/<section>/<slug>.md`, where `<section>` is the technology's URL segment (`power-apps`, `power-automate`, `power-bi`, `copilot-studio`, `dataverse`, `power-pages`, or `governance` for Governance & admin), or `general` for an article with no section. The file name must be the slug.

## Format
```
---
title: "The article's title"
slug: the-article-slug
type: TUTORIAL            # TUTORIAL | PATTERN | COMPARISON | KPI_GUIDE | REFERENCE
technology: POWER_APPS    # optional: one of the six products, or GOVERNANCE_ADMIN
topic: data-and-delegation # optional: the hub section, one of that technology's
                          # TECHNOLOGY_TOPICS ids (packages/domain/content/src/technology.ts)
excerpt: "One or two sentences for search results and cards."
---
The Markdown body.
```

In the body:
- Headings start at `##`.
- Fenced code blocks name their language (` ```powerfx `, ` ```dax `, ` ```json `).
- Callouts use `> [!TIP]`, `> [!NOTE]` or `> [!WARNING]`.
- Do not use task-list checkboxes (`- [ ]`); they render as unlabelled form controls.

## Rules
- **Original writing only.** Cite Microsoft Learn and other sources in a closing "Sources" list, and never copy their text.
- **Examples** follow Microsoft's documented behaviour. Say "tested" only when an example has actually been run.
- **Checks:** CI validates every file (`packages/adapters/content/src/content-files.test.ts`): it must parse, pass the admin editor's rules, have a unique slug, and sit in the right folder.

## Import
```
DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=<an ADMIN's email> pnpm --filter @ppu/adapter-content content:import
```
- The command creates drafts only.
- It skips any slug that already exists and never overwrites one.
- If any file is invalid, it imports nothing.
