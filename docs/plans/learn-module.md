# Plan: the Learn module (in-depth topics)

**Status:** approved (`docs/final-decisions.md`, 2026-10-07: "the Learn module: go ahead as planned", and "Learn module design: Workspace"; 2026-10-08: "Learn: lessons need sign-in; progress saved to the account"). Story: MVP-048.

**Benched (2026-10-08, product owner: "finish the setup required for learn and then bench it and move to high priority things first").** The code is complete: data, importer, admin, public pages, sign-in for lessons, and progress. It is off in production (`FEATURE_LEARN`). What's left to launch it:
1. **Content:** the first topics as drafts in `content/topics` (format: `content/topics/README.md`), each lesson checked against Microsoft Learn. The plan's first six topics are below.
2. **Publish** them in Admin → Learn topics.
3. **Switch on:** `FEATURE_LEARN=on` in Netlify (Production).
4. Not built, by choice: RSS for lessons, and View Transitions between lessons.

**Asked for (product owner, 2026-10-07):** *"plan learn module where I want to explain topics in a detailed manner and important things"*, after the pending work is finished.

## What it is, and how it differs from guides

| | Guides (today) | Learn (new) |
| --- | --- | --- |
| Starts from | A problem in front of you | A topic you want to understand |
| Length | One page, 5 to 10 minutes | A short series of lessons, 10 minutes each |
| Shape | Symptom, fix, why | Concept, how it works, the important things, try it, check yourself |
| Reader | Stuck right now | Building skill: new makers, people moving up, admins |

Guides answer "how do I fix this?"; Learn answers "how does this actually work?". Each lesson links to the guides that apply it, and each guide can link back to the lesson behind it, which also strengthens internal linking for search.

## Proposed structure

1. **Topics** (for example "Delegation in Power Apps", "Dataverse security", "Error handling in Power Automate", "DAX filter context"). A topic is 3 to 6 **lessons**.
2. **A lesson** has a fixed shape, so every one is easy to scan:
   - **What you'll understand**: 2 or 3 outcomes.
   - **The idea**: the concept in plain words, with one of our own diagrams (slice 2's blocks: diagram, Do / Don't).
   - **How it works**: the detail, with a worked example.
   - **The important things**: a short "remember these" card, the part the product owner asked for. It's the summary people come back to.
   - **Try it**: a small exercise in a trial or developer environment, never a real tenant.
   - **Check yourself**: 3 questions, answered on the page (no sign-in, nothing stored).
   - **Sources**: the Microsoft Learn pages it was checked against, with the date.
3. **Progress** (optional): a signed-in reader can tick lessons as done, shown on their profile. It reuses the comments' profile.

**Not proposed:** certificates, points or badges. Microsoft runs credentials; ours would carry no weight and could look like a claim to be official.

## Where it lives

`/learn` is today the guides index, and every guide's address is `/learn/<slug>`. The guides keep their addresses, which matters for search.

**Recommendation:** topics live at `/topics/<topic>/<lesson>`. The top bar's **Learn** button opens a new `/topics` home, and **Fixes** and **Patterns** keep pointing at the guides. Alternatives: `/learn/topics/...` (longer), or moving the guides (not recommended: it breaks every indexed address).

## Content

- Researched against Microsoft Learn and written in our own words, like the guides. Each lesson dated and sourced; drafts only until the product owner publishes.
- **First topics:** one per technology, chosen from what the guides show people struggle with:
  - Power Apps: delegation;
  - Power Automate: error handling;
  - Power BI: filter context;
  - Dataverse: the security model;
  - Copilot Studio: knowledge and grounding;
  - Power Pages: table permissions.

  6 topics × 4 lessons is 24 lessons.
- Diagrams use slice 2's blocks; screenshots wait for MVP-041's screenshot rules.

## Search and AI tools

- Each lesson is a normal indexable page with `TechArticle` data, a quick answer ("The important things" doubles as one), and breadcrumbs (topic › lesson).
- **Not used:** Google's Course structured data. Google stopped showing it in September 2025 and removed the documentation.
- Lessons go in the sitemap and the RSS feed, and IndexNow on publish.

## Build, as vertical slices

1. **Data and admin:** topics and lessons (a migration), written in the admin (or imported as drafts like guides), with the same Markdown blocks.
2. **Pages:** `/topics`, a topic page (lessons in order, time to read), a lesson page (outcomes, the fixed shape, previous and next, "check yourself").
3. **Progress** (if approved): tick lessons as done, signed in.
4. **Content:** the first 6 topics, as drafts.

Each slice has tests, the accessibility gate and docs, and is designed on the canvas first (3 concepts) for sign-off.

## Decisions needed from the product owner

1. **Shape:** topics made of lessons, as above, or something else (for example one long page per topic)?
2. **Address:** `/topics/...` (recommended) or another?
3. **Progress tracking for signed-in readers:** yes or not for now?
4. **"Check yourself" questions:** yes or no?
5. **First topics:** the six above, or a different list?

## Design: Workspace (chosen 2026-10-07)

- **Lesson page:** three columns. Left: the topic's lessons, each with a ring that fills as it's read, the current one highlighted. Middle: the lesson in the fixed shape. Right: "On this page", with a marker that follows the reader, and a reading-progress bar. On a phone the side columns collapse into a lesson menu at the top.
- **Knowledge check:** 2 or 3 multiple-choice questions at the end, with an explanation for every answer and no penalty. Nothing is stored for guests. Multiple choice only, never "all of the above".
- **Moving on:** a "Next lesson" card; the next lesson slides in (View Transitions where supported, otherwise a plain page load).
- **`/topics` and topic pages:** same style: a calm list of topics per technology, and a topic page with its lessons, rings and a "Start" or "Continue" button.
- **Motion:** rings filling, the page marker sliding, the lesson slide; all of it off with reduced motion.
- Reference mock (not committed): `.nav-mock/learn-redesign.html`, direction 1.
