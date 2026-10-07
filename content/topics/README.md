# Learn topics (MVP-048)

Topics for the Learn module at `/topics`, written as Markdown, reviewed in a pull request, and imported as **drafts**. The product owner publishes them in the admin. See `docs/plans/learn-module.md` for what a topic is.

## Layout

```
content/topics/<area>/<topic-slug>/topic.md
content/topics/<area>/<topic-slug>/<position>-<lesson-slug>.md
```

`<area>` is the technology's folder name, as in `content/articles` (`power-apps`, `power-automate`, `power-bi`, `copilot-studio`, `dataverse`, `power-pages`, `governance`). A topic has 3 to 6 lessons, numbered 1, 2, 3 with no gaps.

## topic.md

Front matter only:

```
---
title: "Delegation in Power Apps"
slug: power-apps-delegation
technology: POWER_APPS
summary: "Why a gallery stops at 500 rows, and how to see every row."
order: 1
---
```

`order` sorts the area's topics, lowest first.

## A lesson

```
---
title: "Which formulas delegate"
slug: which-formulas-delegate
position: 2
minutes: 12
outcome: "Tell a delegable formula from one that isn't"
outcome: "Know why the delegation warning matters"
checkedOn: 2026-10-07
---
## The idea
## How it works
## The important things
## Try it
## Check yourself
## Sources
```

- **Outcomes:** 2 or 3 `outcome` lines. They become "What you'll understand".
- **Sections:** exactly these six `## ` headings, in this order. Use the guide blocks (diagram, Do / Don't) inside them.
- **Try it:** in a trial or developer environment, never a real tenant.
- **Check yourself:** 2 or 3 questions. Each has 2 to 4 answers, exactly one right (`[x]`), and an explanation under **every** answer. There's no penalty for a wrong answer, and never "all of the above" or "none of the above".

  ```
  > [!CHECK] Does Today() stop a filter delegating?
  > - [ ] Yes
  >   It doesn't depend on the row, so it's worked out first.
  > - [x] No
  >   Correct: it's sent to the source as a plain value.
  ```

- **Sources:** at least one `learn.microsoft.com` page the lesson was checked against. Write in our own words, and set `checkedOn` to the date you checked.

## Importing

The content gate (`packages/adapters/content/src/learn-files.test.ts`) checks every file in CI. On each release the Netlify production build imports new topics and lessons as drafts. Existing slugs are skipped, so edits made in the admin are never overwritten. To import by hand:

```
DATABASE_URL=... ARTICLE_AUTHOR_EMAIL=admin@example.com pnpm --filter @ppu/adapter-content topics:import
```
