# Project Status

Source of truth for status: `planning/mvp-backlog.csv` (`Status` column). `planning/backlog.csv` mirrors it with Sprint/Points for kanban/sprint planning — the two are updated together. Updated per the "Project management rules" in `CLAUDE.md`.

Last updated: 2026-10-10 (latest) — **MVP-052 In Progress: admin redesign phase 2 (lists with search and status tabs).**
- **Built:** Guides, Updates and Products with search, status tabs, a technology filter and aligned rows; the options not taken are in docs/plans/admin-redesign-choices.md.
- **Next:** phase 3, comments, feedback, users, the audit log and the remaining pages' headers.

Last updated (previous): 2026-10-10 — **MVP-052 In Progress: the admin centre redesign, phase 1 (sidebar and Inbox).**
- **Built:** the redesigned sidebar with a one-line menu on phones, a shared page header, and the Overview as an Inbox of everything waiting (docs/final-decisions.md, 2026-10-10).
- **Next:** phase 2, guides, updates and products as tables with search and status tabs.

Last updated (previous): 2026-10-10 — **Full-site review: seven defects fixed (BUG-044 to BUG-050).**
- **Fixed:** an open redirect, unlimited sign-in emails, Google sign-in without a verified email, unbounded search input, account routes without an origin check, and two smaller ones.
- **Next:** the admin centre review; release #156 and #157.

Last updated (previous): 2026-10-10 — **MVP-051 in QA: comments on component pages.**
- **Built:** a Questions and discussion section on every published component page, with the guide comments' rules and moderation (docs/final-decisions.md, 2026-10-10).
- **Next:** merge and release; the product owner's paste-tests of the drafts; then wave 3.

Last updated (previous): 2026-10-10 — **MVP-049 In Progress: the component cards are two looks of each component, alive on hover.**
- **Changed:** all 14 card pictures on `/components`: the standard look behind, the brand colour in front, which is used on hover (docs/final-decisions.md, 2026-10-10).
- **Next:** comments on component pages (asked 2026-10-10); the product owner's paste-tests of the drafts; then wave 3.

Last updated (previous): 2026-10-10 — **MVP-049 In Progress: hover follows each component's own theme in the seven unpublished drafts that had modern buttons on a dark theme.**
- **Changed:** Data table, Pagination, People picker, Dialog, Toast, Date and time picker and States: 33 buttons now use the published Navigation shell's pattern (a modern Icon or Text under a transparent classic button). The Dialog gets a Dark preset.
- **Published:** Button, Floating action button and Navigation shell.
- **Next:** the product owner's paste-tests of the drafts, in light and dark; then wave 3 (Kanban board, screen templates, charts last).

Last updated (previous): 2026-10-09 — **MVP-049 In Progress: wave 2 is drafted (fourteen components); the Stepper is the last.**
- **Drafted:** Stepper 0.1.0 (open to everyone): horizontal or vertical steps with progress, a `CanLeaveStep` check that stops users skipping required steps, Back and Next, and `GoToStep()`.
- **In review:** #139 (Navigation shell), #140 (Tree view), #141 (Stepper) and #142 (admins not limited in profile changes). #136, #137 and the release #138 are merged.
- **Next:** the product owner's paste-tests of wave 2; then wave 3 (Kanban board, screen templates, charts last).

Last updated (previous): 2026-10-09 — **MVP-049 In Progress: the Tree view is drafted (thirteen components).**
- **Drafted:** Tree view 0.1.0 (open to everyone): nested folders or categories from one flat table in one gallery, nodes that open and close, children loaded when a node opens, selection, and the open nodes as an output to save.
- **In review:** #139 (Navigation shell). #136, #137 and the release #138 are merged.
- **Remaining wave 2:** Stepper.

Last updated (previous): 2026-10-09 — **MVP-049 In Progress: the Navigation shell is drafted (twelve components).**
- **Drafted:** Navigation shell 0.1.0 (sign-in to copy): a side menu that collapses to icons and a bottom bar on phones, from one items table, with badges, items hidden or disabled by key, the current screen from your app, and outputs that place it and your content.
- **Merged:** #136 (MVP-050), #137 (BUG-038) and the release #138 (`develop` → `main`).
- **Remaining wave 2:** Tree view, Stepper.

Last updated (previous): 2026-10-09 — **BUG-038 fixed: row-level security on the component library and site switch tables.**
- A migration turns it on for the four tables, and a new test fails CI for any table created without it. #134 and #135 are merged; MVP-050 is in review (#136).

Last updated (previous): 2026-10-09 — **MVP-050 (scheduled publishing and draft previews) built and in review (QA).**
- **Built:** schedule a draft guide or update from its edit page; it goes live on the first visit after the time, with IndexNow; admin-only previews at `/preview/guides/{id}` and `/preview/updates/{id}`; schedules and update publishes in the audit log.
- **Found:** BUG-038, the component library and site switch tables were created without row-level security; fixed in its own PR.
- **Merged by auto-merge (product owner's request):** #134 (BUG-037) and #135 (Data table).
- **Next:** release `develop` → `main`; then Navigation shell, Tree view, Stepper.

Last updated (previous): 2026-10-09 — **MVP-049 In Progress: the Data table is drafted (eleven components).**
- **Drafted:** Data table 0.1.0 (sign-in to copy), built on a gallery: Table, Cards and List views from one switch; columns as text, pills or a progress bar; select a row to open it; sorting, checkboxes with bulk buttons, a row menu, loading and empty states. Live preview and a paste-test checklist.
- **Merged:** #133 (top bar, Guides menu, `/guides`). **Open for the product owner:** #134 (BUG-037, "On this page"); then a release PR `develop` → `main`.
- **Remaining wave 2:** Navigation shell (sign-in), Tree view, Stepper. **Next story:** MVP-050, scheduled publishing and draft previews (docs/final-decisions.md, 2026-10-09).

Last updated (previous): 2026-10-09 — **MVP-049 In Progress: the library has an admin switch and Coming soon; release #129 is merged.**
- **Built:** the component library's on/off switch in `/admin/settings` (database-backed, audit-logged); Coming soon cards and teaser pages for drafts; Copy YAML in the admin. Pagination (#130) is merged into `develop`.
- **Decided today:** the Data table is built on a gallery; a Guides menu with Learn (Soon) replaces Fixes, Patterns and the Learn button, and guides move to `/guides` (docs/final-decisions.md, 2026-10-09).
- **Next:** BUG-036 (the feedback box stays open after sending); the top bar and the `/guides` move; "On this page" on every page; then the Data table.

Last updated (previous): 2026-10-09 — **MVP-049 In Progress: ten components drafted; release #129 open.**
- **Merged:** #124 to #128 (header and the Terms at sign-up; Text field 0.3.0; the Date and time picker; the People picker; BUG-034 and BUG-035). **Release PR #129** (`develop` → `main`) waits for the product owner.
- **Drafted since:** Pagination (0.1.0, open to copy), with a live preview and a paste-test checklist.
- **Remaining wave 2:** Data table (sign-in), Navigation shell (sign-in), Tree view, Stepper.

Last updated (previous): 2026-10-08 — **MVP-049 In Progress: wave 2 has begun; nine components drafted.**
- **Drafted since:** Floating action button; upgrades to Button, Toast, Tabs and States (0.2.0) and Text field (0.3.0, built-in formats); Date and time picker (0.1.0); People picker (0.1.0, sign-in to copy: your app searches the directory through `OnSearch`). Each has a live preview and a paste-test checklist.
- **Fixed:** BUG-033, previews cut off on phones.
- **Waiting on the product owner:** merging #125, #126 and #127 in order (#124 is merged); the paste-tests (`docs/component-paste-tests.md`); the Privacy wording for component ratings.
- **Remaining wave 2:** Pagination, Data table (sign-in), Navigation shell (sign-in), Tree view, Stepper. Then wave 3: Kanban, screen templates, charts.

Last updated (previous): 2026-10-08 — **MVP-049 (the Power Apps component library) In Progress: pipeline, admin and Docs pages built; six components drafted.**
- **Decisions** (`docs/final-decisions.md`, 2026-10-08): design A · Docs; "Component library" and "Marketplace products" in the admin menu; more components may be drafted before the pilot paste-test; the component standard stays a proposal.
- **Built (#116):** `content/components` checked in CI against Microsoft's pa.yaml schema and the standard; drafts imported on each release; `/admin/components` to record a paste-test, set sign-in-to-copy and hidden, and publish once tested (audit logged); `/components` and the component pages behind `FEATURE_COMPONENTS`, with one live view per component (the component on a Power Apps screen, behaving exactly as in Studio, with its variations and the screen's formulas); sitemap entries while it's on.
- **Drafted (#117):** Button (the pilot), Text field, Dialog, Toast, Tabs, Empty/loading/error states, with paste-test checklists (`docs/component-paste-tests.md`). None is tested in Studio yet.
- **Waiting on the product owner:** paste-tests; the Privacy wording for component ratings and "Worked in my app" (plan step 5); a blank gallery's YAML from Studio before the Navigation shell and Data table.

Last updated (previous): 2026-10-08 — **MVP-048 slice 3 built, and the Learn module is benched.**
- **Decisions** (`docs/final-decisions.md`, 2026-10-08): lessons need sign-in (topics stay public); progress is saved to the reader's account; the Privacy notice gains "Learn progress" in the approved wording (version 2026-10-12).
- **Built:** a sign-in prompt for signed-out readers (title, outcomes, "Sign in to read"); "Mark as done" with done rings and a ✓ in the lesson list and topic page, "Continue: lesson N" on the topic; "Learn progress" on the profile with Clear; `POST/DELETE /api/learn/progress`; lessons noindex and out of the sitemap.
- **Benched** at the product owner's request, to move to higher-priority work. Left to launch: write the content, publish it, then `FEATURE_LEARN=on` (`docs/plans/learn-module.md`).

Last updated (previous): 2026-10-08 — **MVP-048 slice 2: the public Learn pages, in the Workspace design, behind FEATURE_LEARN.**
- **Built:** `/topics` (topics by area), a topic page (its lessons, "Start lesson 1"), and the lesson page in three columns: the topic's lessons with the current one's ring filling as you read, the lesson in its fixed shape, and "On this page" with a sliding marker and % read. "Check yourself" is a real knowledge check: answer, see why every option is right or wrong; nothing stored. Next-lesson card. Phones: the lessons fold into a menu above the lesson.
- **Search:** lessons are TechArticles with dates and breadcrumbs; Learn pages join the sitemap and IndexNow, only while the switch is on.
- **Checked locally on a real database** (Prisma's local Postgres): all migrations apply, the importer creates and then skips the drafts, the repository's database tests pass, the pages render at 1440 and 375 px with no console errors, and the gate's page checks pass in Chromium.
- **For the product owner:** `FEATURE_LEARN=on` in Netlify once the first topic is published.

Last updated (previous): 2026-10-07 — **MVP-048 slice 1b: topics and lessons can be written and published in the admin.**
- **Built:** `/admin/topics` (every topic with its lessons and publish buttons), new and edit forms for topics and lessons with a "Start from the lesson outline" button, and "Learn topics" in the sidebar. Publishing writes the audit log.
- **Rules on the server:** admins only; a lesson must follow the fixed shape and the knowledge-check rules to save or publish; a topic needs 3 lessons before it can be published; slug and lesson number unique within a topic.
- **Release #100 is live** (2026-10-08): comments on, IndexNow key served, RSS feed, migrations applied.
- **Next:** slice 2, the public `/topics` pages in the Workspace design.

Last updated (previous): 2026-10-07 — **MVP-048 (Learn module, Workspace design) In Progress: slice 1a, the data, is built.**
- **Decision:** the product owner chose direction 1, "Workspace", from five live redesign directions (`docs/final-decisions.md`, "Learn module design: Workspace").
- **Built:** topics and lessons in the database (migration `20261013000000`, additive, with a rollback); the fixed lesson shape and knowledge-check rules (2 or 3 questions, one right answer, an explanation for every answer, never "all of the above"); `content/topics` files imported as drafts on each release, with a content gate in CI.
- **Next:** slice 1b, writing and publishing topics and lessons in the admin; then the public pages.

Last updated (previous): 2026-10-07 — **MVP-047 (admin panel, concept A) is built and in review.**
- **Slice 1:** a grouped sidebar with live counts on every admin page, and a new overview: what needs you (reported comments, guide reports, drafts), site health over 7 days, recent activity. Comments also get a "Keep it" action that clears reports.
- **Slice 2:** `/admin/users`: everyone with an account, searchable, with their role. A new CONTRIBUTOR role (abilities still to be decided; for now a member's). Role changes are admin only, never your own or the last admin's, and go into the audit log.
- **Slice 3:** `/admin/settings`: which switches are on, and the search and indexing links. Read only; no secret values shown.

Last updated (previous): 2026-10-07 — **MVP-042: the page-speed check is built (report only) and found real problems.**
- **Built:** a Playwright speed check on a throttled phone profile, as a report-only CI job "Page speed".
- **Fixed on the way:** largest paint improved by up to 1.2 s (guide 3.8 s → 2.6 s) by not preloading the accent and code fonts, and by starting the rise animations at 25% opacity instead of invisible.
- **Still over budget (TD-032):** blocking time 380 to 490 ms on every page (framework hydration); the home page shifts (CLS 0.13) when its display font loads, which needs a product-owner choice (`font-display: optional`).

Last updated (previous): 2026-10-07 — **Comments wording approved and on the legal pages; four product-owner decisions recorded.**
- **Decisions** (`docs/final-decisions.md`, "Comments wording, admin panel, speed check and the Learn module"): the comments wording as written; admin panel concept A; the speed check with Playwright instead of Lighthouse CI; the Learn module as planned.
- **Legal pages:** Terms "Comments" and Privacy "Comments and your profile", versions 2026-10-10 (migration `20261011000000`). After the release, the product owner sets `FEATURE_COMMENTS=on`.
- **Next:** the Playwright speed check (MVP-042), then admin panel A (MVP-047), then 3 Learn module concepts.

Last updated (previous): 2026-10-07 — **MVP-040 (comments) is built behind a flag, off until the product owner approves the Terms and Privacy wording.**
- **Built:** comments on guides (shown at once, plain text and code, at most 2 links with `rel="ugc nofollow"`), report and delete, a random display name and avatar for every signed-in reader with `/account/profile` to change them, and `/admin/comments` to remove, restore or accept.
- **Waiting on the product owner:** the proposed Terms and Privacy wording in `docs/plans/mvp-040-comments.md`; then set `FEATURE_COMMENTS=on` in Netlify. Defaults applied: open questions 70 to 75.
- **Not built:** a page-speed budget (MVP-042). Lighthouse CI brings 4 high-severity advisories through its dependencies, so the approach is a question for the product owner.

Last updated (previous): 2026-10-07 — **Quick answers drafted for all 54 remaining guides (MVP-046).**
- **Every launch guide** now has a quick answer in its file: 2 to 4 points, each linking to a heading in the same guide. A new test checks the links for every guide.
- **Drafts only:** published guides don't change from files (product owner, 2026-10-07: drafts for now; admins edit guide text). To publish one, paste its quick answer into the guide in `/admin/content`.

Last updated (previous): 2026-10-07 — **No personal details on the site; MVP-047 added.**
- **Removed:** the owner's name, province and city from About, Privacy and Terms; copyright and the MIT notice now say LowCodeStacks. The Terms' governing law names no province. New Privacy and Terms versions, 2026-10-09.
- **Byline:** guides show "Posted by the Maker Desk". Structured data stays brand only; the named author is withdrawn.
- **New story:** MVP-047, a redesigned admin panel and a Contributor role (abilities to be decided), designed on the canvas first.
- **For the product owner:** the GitHub repository is public. Its history carries the owner's Gmail addresses on 364 commits, and planning files mention the name and province. Making it private keeps them out of view.

Last updated (previous): 2026-10-07 — **MVP-046 and MVP-042 In Progress: AI search code gaps and IndexNow are built and in review.**
- **Built:** guides shared as articles with their dates; LowCodeStacks described as an organisation with a 512 px logo; an RSS feed of guides at `/learn/feed.xml`; IndexNow: the key at `/indexnow-key.txt` and a notice to search engines on every publish.
- **Product owner, Netlify:** add `INDEXNOW_KEY` for Production (`docs/15-deployment.md`, "After launch", which now also lists Bing Webmaster Tools and Brave's submit page).
- **Waiting on the product owner:** how improved guide text reaches published guides (blocks MVP-046's quick answers going live), and the named author (conflicts with an earlier decision that no person is named in structured data).
- **Still in MVP-042:** the Lighthouse speed budget.

Last updated (previous): 2026-10-07 — **MVP-041 In Progress: redesign slice 2 (fix and pattern blocks) is built and in review.**
- **Blocks:** symptom cards, tick-off steps with a count, an animated diagram with a pause box, and Do / Don't cards, from Markdown conventions. Plain Markdown still reads correctly.
- **In the guides:** the 502 guide has symptom cards and four tick-off steps; the child flows guide has a diagram and two Do / Don't pairs. Live guides only change when their text is updated in production (the importer never overwrites a guide): see the open question below.
- **Still to build in MVP-041:** our own dated screenshots and safe image support.
- **Open question for the product owner:** how improved guide text (these blocks, and MVP-046's quick answers) reaches guides already published.

Last updated (previous): 2026-10-07 — **MVP-045 (top bar names) is built and in review; two new stories.**
- **Top bar:** Power Platform ▾ · Fixes · Patterns · Updates, a Learn button, and "Search an error or topic". The product owner chose concept A with two changes (`docs/final-decisions.md`, "Top bar names, AI search readiness, and comments").
- **New in the backlog:** MVP-045 (top bar names) and MVP-046 (AI search readiness: articles marked as such, organisation data, RSS, quick answers on every guide, a named author once the name is confirmed).
- **Comments (MVP-040):** the product owner's choices are recorded: show at once and remove if reported; a random Power Platform-flavoured display name and avatar for every signed-in reader, which they can change.
- **Production:** BUG-027 (a traffic burst filled the database pooler, about 11 minutes of 500s on 2026-10-07) is fixed in PR #91.
- **Remaining, in the product owner's order ("finish all pending items first"):** MVP-041 (guide blocks, slice 2), MVP-046, IndexNow and the speed budget (MVP-042), MVP-040 (comments), a release to `main`; then planning the Learn module.

Last updated (previous): 2026-10-06 (latest) — **MVP-044 (branded emails) moves to QA, and the home page gets a fixes band and "What changed" (#83).**
- **Emails:** the product owner chose concept E1 and delegated the wording. All four emails now share one layout.
- **New in the backlog:** MVP-043, the animated logo, kept for later at the product owner's request.
- **Merge order:** #82 (hubs), then #83 (home), then the emails PR. Each builds on the one before.

Last updated (previous): 2026-10-06 (later) — **MVP-037 (Fix first hubs) moves to QA:** every area's hub is rebuilt to the chosen H1 board, and Power BI to the H2 journey.
- **Each hub:** its headline, a search for that area only, most-needed fixes, a "Look it up" row, every section with guide badges, and "What changed".
- **Headlines:** the product owner delegated the five unapproved ones; recorded in `docs/final-decisions.md`.
- **Release:** password sign-in (MVP-036) went to `main` in #80. The Google button redesign is #81.
- **New tech debt:** TD-030, accessibility shards timing out in CI.
- **Next:** slice 1 of the redesign, the shared guide frame.

Last updated (previous): 2026-10-06 — **MVP-036 (Email and password sign-in) moves to QA:** sign-up with a confirmed email, sign-in, forgot and reset password, in its own PR.
- **Security:** scrypt hashing, the Have I Been Pwned check, attempt limits per account and per IP address, and single-use 1-hour links. The as-built review found and fixed two timing leaks: `docs/plans/mvp-036-password-sign-in.md`.
- **Privacy notice:** new version 2026-10-07 (migration `20261007000100`).
- **Board correction:** MVP-034 (PR #71) and MVP-035 (PR #72) were already merged into `develop`, but the backlog still showed In Progress and Backlog. Both are now QA.
- **Next:** the product owner merges the MVP-036 PR. Then the guide and hub redesign (MVP-037, 038, 039, 041, 042; `docs/plans/guide-and-hub-redesign.md`).

Last updated (previous): 2026-10-03 — **MVP-033 (Navigation restructure) moves to QA:** all four slices are built in PR #62.
- **Slice D:** the Updates page and deprecation tracker, the admin pages for updates, an animated "new" badge (browser-only storage, still under reduced motion), and the Privacy notice updated in the same change.
- **Drafts:** four platform-update drafts are in `content/updates`, each checked against Microsoft Learn.
- **Production:** apply migrations `20261003000000` to `20261003000300` with the 5432 connection before deploying. Then run `updates:import` and publish the drafts after checking them.
- **Open questions:** 65 to 69 record the defaults applied.

Last updated (previous): 2026-10-03 — **MVP-033 slices B and C built** (PR #62):
- **Hubs and Guides page:** the Guides page matches its board (TD-026 resolved).
- **Content model:** articles now have a hub `topic` and can belong to Governance & admin (TD-025 resolved).
- **Bug fixed:** BUG-022, where saving in the admin editor cleared an article's technology.
- **Production:** apply migrations `20261003000000` and `20261003000100` with the 5432 connection before deploying.
- **Next:** slice D (Updates page and badge).

Last updated (previous): 2026-10-02 — **MVP-033 (Navigation restructure) In Progress: slice C (technology hubs) is built and goes to review.**
- **Hubs:** each technology page is a map of its own sections, with a "New here?" path at the end. Old tab addresses redirect to the hub. Governance & admin is the 7th area, at `/governance`.
- **Guides by goal:** `/learn` and the footer use the goal labels: Fix a problem · Choose the right tool · Design it to last · Measure success.
- **Technologies menu:** the large menu from the approved board. It shows all 7 areas, each with its guide count, a start-here guide and its first sections. On phones, the menu shows the areas as tinted tiles.
- **Next:** the product owner reviews and merges the slice C PR into `develop`. Then slice B (topics in the content model) and slice D (Updates).

Last updated (previous): 2026-10-02 — **MVP-032 (About, Privacy and Terms) moves to QA**, and two security fixes are up for review.
- **Pages:** `/about`, `/privacy` and `/terms`, written by the agent at the product owner's instruction from an inventory of what the code does. They name the operator, Uday Posia (Saskatchewan, Canada), and `contact@lowcodestacks.com`, which the product owner must create before launch. Code samples are MIT; text is reserved; there is no compliance claim. A lawyer's review before launch is recommended.
- **Security:** BUG-019 (sign-in links logged in production without an email key) and BUG-020 (uploads open to members) are fixed in PR #54.
- **Next:** the product owner reviews and merges #53, #54 and the MVP-032 PR, retargeting MVP-032 to `develop` before #53's branch is deleted.

Last updated (previous): 2026-10-02 — **MVP-031 (Daylight redesign) moves to QA: the whole public site is rebuilt to the approved canvas, and the accessibility gate passes in all three browsers.**
- **Board fidelity pass:** the built pages were compared side by side with the canvas at desktop and phone widths, and the drift fixed (heading font optical size, header with KPI guides and a Ctrl K search box, the phone Menu, the technology hub's featured guides, the article's Copy link, a footer with link columns).
- **Product decisions recorded** in `docs/final-decisions.md`: the X2 "Code stack" logo; the four board-fidelity choices (three delegated to the agent). Site search now covers guides (open question 63 closed). About, Privacy and Terms need product-owner content (open question 64).
- **Accessibility gate:** 474 checks per browser, all passing. WebKit passed in one run. Chromium and Firefox passed 468 in the full run; their 4 failures were the outdated BUG-004 test locator, and the 6 corrected and new BUG-004 checks then passed in both.
- **Next:** the product owner reviews and merges the MVP-031 PR into `develop`.

Last updated (previous): 2026-10-01 — **MVP-030 (Deploy to Netlify) In Progress, slice 1 of 2 built:** the database client works through Supabase's transaction pooler, `apps/web/netlify.toml` exists, and `docs/15-deployment.md` is the step-by-step runbook. Slice 2 is the first real deploy, with the product owner creating the accounts and entering secrets.

Last updated (previous): 2026-09-30 — **MVP-029 (Launch content) moves to QA: all 24 wave-1 articles are written, and the product owner now reviews and publishes them.** The launch is content-first: the site goes live once they're published (`docs/final-decisions.md`, "Launch is content-first").

Last updated (previous): 2026-09-30 — **Security fix: BUG-018 (critical Next.js advisory) resolved on `develop`; it needs releasing to `main`.** MVP-029 continues unchanged.

Last updated (previous): 2026-09-30 — **MVP-029 (Launch content) In Progress: the pipeline is built and 20 of 24 articles are written (Power Apps, Power Automate, Power BI, Copilot Studio and Dataverse sections complete).**
- **Approval:** the product owner approved the launch content plan (24 wave-1 articles).
- **How articles work:** each is a reviewed Markdown file, checked in CI and imported only as a draft.
- **First article:** "Delegation in Power Apps: why your gallery stops at 500 rows", verified against Microsoft Learn.
- **Research:** a competitor review of Lumeric Visuals is saved in `docs/research/competitors/`.

Last updated (previous): 2026-09-30 — **MVP-028 (Technology sections) is Done, and Release 2 is on `main` (PR #39).**
- Release 2 contains the design system and the technology sections, both slices.
- **Next:** researched launch content, with the article plan going to the product owner first.

Last updated (previous): 2026-09-30 — **MVP-028 (Technology sections) both slices built; status QA.**
- **Six sections, each with four tabs:** Learn, Architecture, Components and KPIs, at `/power-apps` and so on.
- **Navigation:** a Technologies menu in the header, technology tiles on the home page, and chips on `/learn`.
- **Search engines:** empty tabs say "Coming soon" and stay out of search; tabs with content are in the sitemap.
- **`develop` CI** passed on the slice 1 merge (#37).

Last updated (previous): 2026-09-30 — **MVP-028 (Technology sections) In Progress, slice 1 of 2 built: the content model.**
- **Decided by the product owner:** six sections (Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse, Power Pages), four tabs (Learn · Architecture · Components · KPIs), and short addresses (`/power-apps`).
- **Built:** articles can be tagged with a technology; there is a new KPI guide article type; the admin editor has a Technology picker; the API validates both.
- **Fixed:** BUG-017, a test that failed on Windows line endings.

Last updated (previous): 2026-09-30 — **MVP-027 (Design system) is Done.**
- All 4 slices are merged: PRs #31, #33, #34 and #35, each with all 7 checks green.
- **Next:** the design-system release, `develop` → `main`. Then the per-technology sections, whose section list and structure go to the product owner first.

Last updated (previous): 2026-09-30 — **MVP-027 (Design system) all 4 slices built; status QA.**
- **Slice 4 gives every remaining page the new look.** A single set of defaults styles unstyled elements (page width, headings, fields, primary and secondary buttons, tables) in both themes.
- **Pages covered:** sign-in, account, unsubscribe and the admin screens.
- **BUG-009 resolved.**
- **Merged:** slices 1–3 (PRs #31, #33, #34).
- **Next:** once slice 4 merges, a **`develop` → `main` release** for the design-system milestone. Then the per-technology sections.

Last updated (previous): 2026-09-30 — **MVP-027 slice 3 built: the article page.**
- **Contents:** an "On this page" list built from the same parse as the headings.
- **Code:** panels with a language label and a Copy button that has a fallback.
- **Callouts:** `[!TIP]`, `[!NOTE]` and `[!WARNING]` boxes.
- **Title block:** reading time and updated date.
- **Layout:** three columns (contents | article | Keep learning) on wide screens, one column on phones.
- **Merged:** slices 1 and 2 (PRs #31 and #33).

Last updated (previous): 2026-09-30 — **MVP-027 slice 2 built: the Premium 3 home page.**
- **Hero:** a headline beside a layered, decorative Power Apps illustration, with floating code and evidence cards.
- **Sections:** the newest components, the newest articles and all categories. Each is left out when empty.
- **Honesty:** the mockup's wording was made truthful (`docs/final-decisions.md`, "MVP-027 slice 2").
- **Release 1 is merged to `main`** (PR #30).

Last updated (previous): 2026-09-30 — **MVP-027 (Design system) In Progress, slice 1 of 4 built.**
- **Tokens:** the A + B palette as semantic tokens, with contrast checked in both themes.
- **Fonts:** self-hosted Fraunces, Source Sans 3 and IBM Plex Mono.
- **Dark mode on every page,** switched by a header toggle and remembered in a first-party cookie. The accessibility gate now scans every page state in dark as well.
- **Site header and footer** with a skip link and the "not affiliated with Microsoft" line.
- **Motion foundation** that respects reduced motion.
- **Brand refresh:** new favicon and share-image palette.

Release 1 (`develop` → `main`, PR #30) is open for the product owner.

Last updated (previous): 2026-09-30 — **MVP-026 (SEO discoverability) is Done.**
- MVP-007 slice 2 merged first, via PR #27.
- The SEO story merged via PR #28 (merge commit `cb00b6b`) after CI run `36650827876` passed all 7 checks.

The product owner also chose the **Premium 3 "Component showcase" home page**, on top of the A + B design system (`docs/final-decisions.md`, "Home page design: Premium 3").

**Next:**
1. The first `develop` → `main` release.
2. The design-system story.

Last updated (previous): 2026-09-28 — **MVP-026 (SEO discoverability) built, status QA.**
- Articles now render as real formatted pages (TD-017 resolved).
- A new `/learn` hub lists every published article.
- Breadcrumbs and "Keep learning" links tie articles together, and the home page shows the latest articles.
- Every indexable page has a generated share image; the site has a favicon.
- Articles carry LowCodeStacks as author and publisher in structured data.
- The sitemap dates articles (TD-010 partial).
- A repeated query parameter no longer returns HTTP 500 (BUG-002 resolved).

Decisions: `docs/final-decisions.md`, "SEO story (MVP-026): implementation decisions". The product owner has also asked for a content programme, a daily maintenance agent, per-technology sections and a UI overhaul. These are being turned into a researched roadmap to decide on; none of it is built or approved in detail yet. Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-28 — **MVP-007 slice 2 built: one optional price per product.** The product owner clarified the business model: mostly free learning content, ads as the main revenue, only a few priced items, one USD price per product (`docs/final-decisions.md`, "Business model: free learning first; one price per product; work order"). Built: `Price` (RLS, positive-amount CHECK), exact string-based price parsing, the admin price editor, a product page showing the price, "All sales are final" and "Purchasing opens soon", and a **security fix**: the free-download route now refuses priced products (409), so a paid item can never be claimed free. Agreed order next: SEO story, then ads, then checkout (slice 3). Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-28 — **MVP-007 (Checkout, FR-006) In Progress, slice 1 of 3 built.** The product owner answered the questions blocking checkout: launch currency USD only; all sales final (no refunds); prices set by the owner per product and licence tier in the admin editor; slice 1 authorized (`docs/final-decisions.md`, "MVP-007 slice 1 authorized; launch currency; refund policy; pricing mechanism"). Slice 1 adds the `Order` and `PaymentEvent` tables (RLS, `Restrict` FKs, a positive-amount CHECK so a free product can never be a false paid order), `@ppu/domain-commerce` (order state machine), `@ppu/adapter-commerce` (compare-and-swap transitions, duplicate-safe event ledger) and `@ppu/adapter-payments` (Stripe webhook signature verification with Stripe's official library, pinned at 22.6.2). No webhook route, prices, checkout or UI yet. Next: slice 2 (prices and the admin price editor); slice 3 (checkout) waits on the sales-tax decision. Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-28 — **MVP-014 (Immutable published releases, FR-011) and MVP-019 (Operations console and audit, FR-015/NFR-009) are Done.** MVP-014 merged via PR #24 (merge commit `7c1f5d7`) after CI went green on all 6 checks (1,143 accessibility checks, 0 skipped, 0 retries). MVP-019 is Done on merge of PR #25: an independent review (GitHub Copilot) found a real audit-integrity defect in `changeProductStatus` — a claim predicate broad enough to let a concurrent request succeed from a newer status while recording a stale `fromStatus` — which was fixed with an exact-status compare-and-swap and a race test asserting a continuous event chain; the reviewer's final verdict was no remaining BLOCKER/HIGH. Bringing PR #25 up to date with `develop` after #24 merged required resolving 11 conflicts, fixing one real compile break (#25's test helper called `publishProductWithRelease` with the pre-MVP-014 two-argument signature), renumbering MVP-019's tech-debt record to [TD-022](tech-debt/TD-022.md) (both branches had independently created a TD-021), and adding `ReleasePublishEvent` as the fourth source of the `/admin/audit` view — the source MVP-019's own decision said to add once MVP-014 merged. Security and accessibility review: `docs/final-decisions.md`, "MVP-014 and MVP-019: security and accessibility review, Done". Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-26 — **MVP-019 (Operations console and audit, FR-015/NFR-009) implemented, status QA (not Done).** Direct product-owner authorization: the product owner asked this session to evaluate and decide the five open questions its own pre-work analysis (`planning/prework/MVP-019-prework-analysis.md`) had surfaced, rather than answering them separately — full reasoning for each: `docs/final-decisions.md`, "MVP-019 operations console and audit: open questions evaluated and decided." Built two things, both confirmed as the only genuinely buildable slice of FR-015's much broader "admins can manage X" list (Orders/Refunds/Reviews/FeatureFlag all lack a backing model or an owning story): (1) **Product suspend/archive/reinstate** — `ProductStatus` gains `SUSPENDED`/`ARCHIVED`; valid transitions `PUBLISHED ⇄ SUSPENDED`, `PUBLISHED → ARCHIVED`, `SUSPENDED → ARCHIVED`, with `ARCHIVED` terminal and `DRAFT` never a valid source/destination — enforced via a deliberately separate transition table from MVP-012's own initial-publish gate, so a suspended/archived product can never accidentally satisfy that gate's "must be DRAFT" precondition. The claim is a compare-and-swap on the exact validated status (`status: product.status` in the `WHERE` clause), the same atomic-conditional-update family as MVP-014's `Release.publishedAt` claim. A non-empty reason is required for all four transitions (NFR-009), recorded in a new append-only `ProductStatusEvent` audit table. Suspending/archiving never touches any `Entitlement` row — existing customers keep their access regardless. (2) **A unified, read-only admin audit-log view** (`/admin/audit`) that reads and merges `ProductStatusEvent`, `DeletionRequestEvent` (MVP-020) and `ArticlePublishEvent` (MVP-017) at request time — no new physical `AuditEvent` table, avoiding touching three already-shipped write paths for a purely reporting feature. **A real audit-integrity defect was caught by independent review (GitHub Copilot) and fixed before merge**: the first claim predicate accepted any status that could legally reach the target while the event recorded the stale pre-claim `fromStatus`, so a concurrent `PUBLISHED → SUSPENDED` / `PUBLISHED → ARCHIVED` race could yield the false history `PUBLISHED → SUSPENDED`, `PUBLISHED → ARCHIVED`. Fixed with the exact-status compare-and-swap; the race test now asserts a continuous event chain in every interleaving (repeated 8×) and was verified to fail against the old predicate. Detail: `planning/progress-report.md`. **A real accessibility defect was also caught and fixed**: the audit-log table overflowed horizontally at 320/375px until wrapped in the same labelled, keyboard-focusable scrollable region `packages/ui/src/product-evidence.tsx`'s compatibility matrix already established. Verified directly in this session against a real local Postgres: `pnpm build`/`lint`/`typecheck`/`test` all green (48/48 tasks; `@ppu/domain-catalog` 100/100, `@ppu/adapter-catalog` 80/80 including both concurrency tests, `@ppu/web` 325/325), Playwright a11y full page-inventory 207/207 on chromium including the 3 new states (`admin-products-edit-suspended`, `admin-audit-populated`, `admin-audit-denied`). **Stays QA, not Done**: PR opening next; real CI's full 3-engine accessibility matrix has not yet run. New [TD-022](tech-debt/TD-022.md) (Low; created as TD-021, renumbered when merged with MVP-014's own TD-021): the audit log has no pagination, capped at 100 entries, mirroring TD-014's identical accepted precedent. Explicitly out of scope, by direct decision: user management, taxonomy admin CRUD, `Entitlement.revokedAt`'s write path. Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-25 — **MVP-014 (Immutable published releases, FR-011) implemented, status QA (not Done).** Direct product-owner authorization ("PRODUCT-OWNER DECISION AND IMPLEMENTATION AUTHORIZATION — MVP-014 — IMMUTABLE PUBLISHED RELEASES", full detail `docs/final-decisions.md`) following this session's own pre-work analysis (`planning/prework/MVP-014-prework-analysis.md`). Built `ReleasePublishEvent` (append-only audit trail, `action = "PUBLISHED"` only, RLS enabled from the same migration, `Restrict` FKs) and `publishSubsequentRelease` (`PrismaCatalogRepository`), the repository method that publishes any release after a product's first, gated by an **atomic, database-conditional update** (`updateMany` requiring `publishedAt: null` and exactly one affected row) rather than a plain read-then-write — a genuine concurrency defect class the product owner's own technical correction called out. Proven against a real database: a `Promise.allSettled`-based concurrency test confirms exactly one of two simultaneous publish attempts on the same release succeeds. The identical fix was self-applied to the existing `publishProductWithRelease` (MVP-012, PR #23), which had the same latent gap — justified as a safe refactoring invisible to any correctly-behaving caller, confirmed by its full existing test suite passing unchanged. New route `POST /api/admin/products/{id}/releases/{releaseId}/publish`; `ReleasesEditor` extended (not a new admin shell) with a `PublishReleaseControl`. Two new Playwright a11y states (`admin-products-edit-published-draft-ready`, `admin-products-edit-published-draft-not-ready`), verified locally: 36/36 chromium `admin-products-*` states passing, up from 28. Confirmed scope boundaries: `Product` suspend/archive is MVP-019's, not MVP-014's (`ProductStatus` still `DRAFT | PUBLISHED` only); no compatibility/licence snapshot per release ([TD-021](tech-debt/TD-021.md), a recorded gap, not a defect); `Entitlement` stays product-scoped, unchanged; no `ChangelogEntry`; no `currentReleaseId` pointer — the existing `publishedAt DESC, createdAt DESC, take 1` query shape is retained; `Product.publishedAt` is never changed by a subsequent-release publish. Verified directly in this session against a real local Postgres: `pnpm build` 25/25 (new route confirmed in the manifest), `pnpm lint` 25/25, `pnpm typecheck` 48/48, `pnpm test` 48/48 tasks (`@ppu/domain-catalog` 90/90, `@ppu/adapter-catalog` 77/77 including the concurrency test, `@ppu/web` 325/325, `@ppu/e2e` 82/82). **Stays QA, not Done**: PR opening next; real CI's full 3-engine accessibility matrix has not yet run (only a local chromium smoke pass so far), and this authorization explicitly does not permit merging. New [TD-021](tech-debt/TD-021.md) (Medium): a published release has no point-in-time license/compatibility/support-policy snapshot, so a later edit to those product-level fields silently applies to how an older, already-published release's evidence displays — the release's own files/content stay immutable regardless. Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-24 — **MVP-012 (Product and release editor, FR-009) is Done.** A direct product-owner independent review of the initial implementation (below) found three real defects, all corrected on the same branch before merge: (1) a published Product's release/files could be mutated with no restriction at all — fixed by a release-lifecycle model where a published Product is not frozen (further draft releases may follow for future versions) but a published *Release* is immutable (`publishProductWithRelease(productId, releaseId)` now publishes both rows atomically, in one transaction that re-reads and re-validates the Product, the explicitly-selected Release, and every mandatory field fresh from the database); (2) `attachReleaseFile`/new `detachReleaseFile` now take `productId` and reject a release that doesn't belong to it or is already published — closing an unrestricted cross-product/post-publish file-attach gap; (3) the new `release_files` table was missing `ENABLE ROW LEVEL SECURITY`, the only table in the schema's history without it — fixed and re-verified against a real database. **TD-019 (accessibility gate) is now Resolved, not deferred**: 7 new Playwright a11y states were built for `/admin/products`, `/admin/products/new` and `/admin/products/[id]/edit` (populated, denied ×3, new form, draft-missing-fields, published-immutable), mirroring `admin-content-*`'s established convention, verified green on a real CI run (`36099983635`): all 4 shards passed, 963 main-pool tests + 144 self-check (36 × 4) = 1107 total, 0 skipped, 0 retries, 0 flaky. Also found and fixed during this pass: 3 files needed a real Prettier reformat (caught by CI, not locally — a genuine formatting gap, not the known Windows-CRLF false positive), and a fixture-count assertion (`fixtures-cleanup.spec.ts`) hardcoded "3 products per worker" needed updating to 5 once the two new admin-product fixtures were added. New tech-debt record [TD-020](tech-debt/TD-020.md) (Low): 9 orphaned local `postgres.exe` processes found during this session's local verification passes — a tooling-hygiene gap, not a repository code defect. Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-24 — **MVP-012 (Product and release editor, FR-009) implemented, status QA (not Done).** Built the first-party ADMIN-only authoring surface mirroring MVP-017's `/admin/content` pattern exactly: `packages/domain/catalog/src/product.ts` (field validators, `isValidProductStatusTransition`, `checkProductPublishReadiness` implementing the mandatory-field gate from `docs/open-questions.md` item 61's recorded default — license, support policy, compatibility entry, a release with an attached CLEAN file), `PrismaCatalogRepository`'s 13 new admin/write methods (`packages/adapters/catalog`), 8 new API routes under `apps/web/app/api/admin/products/` (identical deny-by-default `requireAdmin()` pattern; `MARKETPLACE_REVIEWED` rejected with a distinct code even for ADMIN — TD-006/TD-008's hard gate), and the `/admin/products/*` editor UI (core fields, license checkboxes, support policy, compatibility entries, releases with file attachment by reference, a publish control extended for a missing-field list). New additive migration: `ReleaseFile` (joins `Release` and `FileScan`, gated to `CLEAN` at write time). `docs/07-api-contracts.md` corrected (open question 62's recorded default); `TD-006` Partially Resolved, `TD-008` updated to record the write path/authorization landing (moderation workflow itself stays unbuilt, no approved successor to superseded MVP-013). **Stays QA, not Done**: `pnpm test:a11y` (the Playwright accessibility gate) needs a production build, a one-time browser install and a local/CI Postgres with `E2E_ALLOW_DATABASE_WRITES=1`, none reliably provisionable in this pass — the 3 new page routes are registered in the Vitest route-coverage guard (`pnpm test` passes) but have no matching Playwright a11y states yet (new [TD-019](tech-debt/TD-019.md)). Verified directly: `pnpm build` 25/25, `pnpm lint` 25/25, `pnpm typecheck` 48/48, `pnpm test` 48/48 tasks (`@ppu/web` 303/303, `@ppu/domain-catalog` 106/106, `@ppu/adapter-catalog` 60/60 against a real local Postgres, `@ppu/e2e` 82/82 including the route-coverage guard). Full detail: `planning/progress-report.md`.

Last updated (previous): 2026-09-24 — **First-party-only publishing model decided**, direct product-owner instruction, reversing the 2026-09-23 invited/vetted third-party creator decision (`docs/final-decisions.md`, "First-party-only publishing model"). MVP-011 (Creator application) and MVP-013 (Submission review queue) marked **Superseded** — preserved as historical records, not deleted or renamed. MVP-012's dependency changes from `MVP-006;MVP-011` to `MVP-006` alone (already Done); MVP-012 is now the recommended next story. Open question 2 closed by the new decision; open question 8 (creator payout terms) closed as obsolete; open question 51 narrowed to a general legal-entity/commercial-readiness flag not blocking engineering; open questions 3 and 7 stay open, unresolved. `planning/proposed-stories.md` gains PROP-009 (Asset and Content Suggestions) as the separate, not-yet-approved successor concept — explicitly not MVP-013 renamed. `planning/tech-debt/TD-018.md` records a follow-up presentation-wording decision (`CREATOR_DECLARED` → "Publisher declared") with no schema, validator, or production code changed. Full impact analysis: `planning/prework/first-party-only-impact-analysis.md`. Documentation and planning only — no product code, schema, UI, route, API, test, or CI changed.

Last updated (previous): 2026-09-24 — **TD-008 (compatibility-evidence vocabulary correction) partially resolved**, own branch (`tech-debt/td-008-evidence-vocabulary`), own PR, per direct product-owner instruction. Added the approved `MARKETPLACE_REVIEWED` enum value and a nullable `reviewedAt` column in two migrations (Postgres requires a new enum value in its own transaction before it can be referenced), with a CHECK constraint keeping the two in lockstep — verified against a real database in both directions (a mismatched row is rejected either way; a correctly-paired row is accepted). `validateCompatibilityEntry` now rejects `TESTED`/`NOT_VERIFIED` as reserved/legacy with a distinct error code, regardless of what else is supplied; the old "Tested requires evidence" special case is now unreachable application-side (the database CHECK still enforces it directly for the reserved value, confirmed by the existing rejection tests passing unchanged). The public legend and compatibility matrix (`present-evidence.ts`) show only the two assignable statuses, using the approved wording verbatim, and fail closed — any `TESTED`/`NOT_VERIFIED` row is filtered out of the public matrix entirely, proven by a dedicated regression test. **Deliberately not built**: the write path, moderation workflow, `ModerationReview`/`AuditEvent` entities and role enforcement — MVP-012/013's scope, per explicit instruction not to build it here. Also reconciled BUG-012 and BUG-014's stale `bugs.csv` entries against merge history and CI evidence (not the records themselves) before this work — see the immediately preceding "Last updated" note. Verified directly in this session against a real local Postgres: `@ppu/domain-catalog` 66/66, `@ppu/ui` 57/57, `@ppu/adapter-catalog` 40/40 (including the 3 new DB-gated CHECK-constraint tests, confirmed individually), full workspace `pnpm lint`/`typecheck`/`build` clean.

Last updated (previous): 2026-09-24 — **BUG-012 and BUG-014 reconciled in `bugs.csv` against merge history and CI evidence, not the records themselves.** BUG-012: confirmed **Resolved** (`bugs.csv` incorrectly said Open) — fix commit `e43e1aa` is merged into `develop`, and the actual merged CI run (`35702619219`, PR #6) shows 0 `TooManyConnections`/`P2037` occurrences in the raw log; `docs/open-questions.md` item 43 was already correctly marked DECIDED. `bugs.csv`'s BUG-012 row was written before the fix merged and never updated afterward, despite the file being touched three more times since. BUG-014: `bugs.csv` said "two occurrences," the record said "three" — the record is correct; the third occurrence (run 15) was added to `BUG-014.md` in MVP-023's final commit, which never touched `bugs.csv`. A full sweep of every other BUG-*/TD-* found no further index-vs-record disagreements (BUG-003–008 share a separate, non-disagreeing staleness: both index and record still say "pending merge" for the long-merged PR #6 — flagged, not corrected, since it wasn't a disagreement).

Last updated (previous): 2026-09-23 — **MVP-017 (Content publishing: tutorials, patterns and comparison pages, FR-014) is Done and merged.** PR #14 merged into `develop` via `gh pr merge` (not squashed) after CI run `35932897213` went green on all 6 checks. A first push found a real defect (the public `/learn/[slug]` page had no keyboard-reachable control at all, WCAG 2.4.1), fixed with the established BUG-008 "back to home" link pattern; the second push's run confirmed the fix directly from the raw log — `@ppu/adapter-content`'s 7 DB-gated integration tests passed for real, zero skips/retries across all four accessibility shards. Built `Article`/`ArticlePublishEvent` (RLS, `Restrict` FKs, `DRAFT`→`PUBLISHED` one-way transition), `@ppu/domain-content` + `@ppu/adapter-content` (replacing the prior placeholder, following the `privacy` package pair's exact structure), the public `/learn/[slug]` page (FR-017 SEO treatment: canonical, metadata, `TechArticle` JSON-LD, sitemap inclusion), and a minimal `ADMIN`-gated editorial surface (`/admin/content/*`) reusing the exact deny-by-default authorization pattern `/admin/deletion-requests` established — no `EDITOR` role exists or was invented (`docs/final-decisions.md`, "content-publishing authorization reuses ADMIN"). Collections are excluded from MVP-017 entirely, resolved by direct product-owner instruction after this session investigated and reported the MVP-017/`/collections/[slug]` scope conflict (`docs/final-decisions.md`). `LearningPath`/`LearningPathItem` are deferred as a fast-follow within FR-014, not silently dropped (`docs/open-questions.md` item 50); FR-014 is Partially Implemented. `Article.body` (Markdown) renders as plain escaped text, not HTML — a deliberate security-first choice closing a stored-XSS surface without a new sanitizer dependency ([TD-017](tech-debt/TD-017.md)); `ArticlePublishEvent` is a bare action log, not full version snapshotting ([TD-016](tech-debt/TD-016.md)). Verified directly in this session (re-run, not taken on trust): `@ppu/domain-content` 15/15, `@ppu/e2e` 82/82 (route-coverage guard included), `pnpm lint` 25/25 clean, `pnpm typecheck` 48/48 clean, `pnpm test` 48/48 tasks (`@ppu/web` 241/241), `pnpm build` 25/25 with every new route in the manifest.

Last updated (previous): 2026-09-23 — **CI infrastructure (not a backlog story): the accessibility suite is now sharded.** PR #12 (`chore/accessibility-suite-sharding`) merged into `develop` via `gh pr merge` (merge commit `9b1c77a7`, not squashed) after the standing mitigation trigger recorded below fired (test execution reached 8.08m, past the 5–8m target). The single accessibility job became a 4-way Playwright `--shard` matrix plus a same-named aggregator required check, so branch protection needed no reconfiguration; every engine/width/rule is preserved unchanged in every shard, and the unconditional self-check now runs a second time in every shard, all three engines. **New governing budget: per-shard test execution, target under 5 minutes, ceiling 8 minutes — the old 10-minute job-wall-clock ceiling below is superseded by this.** Final confirmed run (`35913171170`): all 6 checks green, 178+178+178+177=711 main-pool tests (exact pre-sharding count, zero drops), self-check 36×4=144, total 855, 0 skips, 0 retries. An external code review (GitHub Copilot) was requested before merge; two findings were fixed (a hardcoded shard denominator now derives from `strategy.job-total`; a new step asserts the self-check ran exactly 36 tests, guarding against a silently-shrinking gate) and the rest documented (`docs/final-decisions.md`, "Accessibility suite mitigation: sharding implemented" and "External review requested and addressed, before merge"). Also found and recorded, not fixed here (out of this PR's CI-only scope): BUG-015, a pre-existing, confirmed-flaky test-isolation race in `catalog-repository.integration.test.ts` caused by `@ppu/adapter-catalog` and `@ppu/adapter-entitlements`'s integration suites sharing one CI Postgres container with no cross-package isolation.

MVP-018 (Transactional email and preferences, FR-013) is **Done and merged**. PR #10 merged via `gh pr merge` (not squashed, merge commit `3623d43`) after CI run `35823121452` (head `1c25049`, the actual merged commit) went green on all three jobs on the first attempt: 747/747 accessibility checks (5 new `/unsubscribe` states plus 3 backfilled for the existing `MARKETING_EMAIL` toggle), 0 failed, 0 flaky, 0 skipped; 213/213 `@ppu/web` tests plus every other package's suite green. **The accessibility job's wall-clock was 10m7s — a real breach of the 10-minute ceiling `docs/final-decisions.md` established for MVP-023 (Q39), by 7 seconds.** Product-owner decision "MVP-018 merge / accessibility budget breach" (2026-09-23) authorized merging anyway (the identical suite ran 9m47s on the immediately preceding head with no functional change between them — runner variance at an already-tight budget, not a regression; the gate itself was not weakened), **for this one run only** — not a revision of the ceiling. A standing mitigation trigger is now recorded in `docs/final-decisions.md`: implementation must stop and present options, with a specific measurement set, before either any future story adds new `packages/e2e` page states, or any future accessibility run exceeds 10m00s. Sharding is the recorded (not approved) mitigation preference. Open question 49 was decided before implementation: option (a), a deletion-request acknowledgement on `SUBMITTED` only (`UNDER_REVIEW`/`WITHDRAWN` not approved; `APPROVED`/`COMPLETED` withheld on a truthfulness ground pending questions 46/47; `DENIED` a recorded known gap pending product-owner copy). Built: `EmailSend` (append-only audit table, RLS, `Restrict` FK), `packages/domain/notifications` + `packages/adapters/notifications` (17 unit/integration tests), `ResendEmailAdapter`, `auth.ts` migrated off `ConsoleEmailAdapter`, the one authorized deletion-request acknowledgement send (a send failure never fails the request — verified by a dedicated route test), and a stateless signed unsubscribe token with its own page and API route (deliberately not session-gated; confirmed by grep that `getServerSession` appears nowhere in it). Two real bugs found and fixed locally before any CI push: three `/unsubscribe` states had no keyboard stops at all (fixed with a "back to home" link, matching BUG-008's established pattern), and that link's own touch target was under the WCAG 24px minimum (fixed with padding). TD-015 recorded (email sends synchronously in the request path, no retry — the same class of gap as TD-004). FR-013 is Partially Implemented (MVP-018's half only; MVP-015's "save products" half is not started, depends on MVP-009).

MVP-020 (Consent and legal deletion workflow, FR-004) is **Done and merged**. PR #9 merged via `gh pr merge` (not squashed) after CI run `35809637645` went green on all three jobs on the first attempt: 603/603 accessibility checks (7 new states — `privacy-empty`, `privacy-pending-request`, `privacy-denied`, `privacy-loading`, `privacy-error`, `admin-deletion-requests-populated`, `admin-deletion-requests-denied`), 0 failed, 0 flaky; 205/205 `@ppu/web` tests plus every other package's suite green; the new `Restrict` foreign-key constraint proven not just by a local test but by the real CI Postgres log itself rejecting a deliberately-invalid delete. Open questions 46, 47 and 48 were decided before implementation ("MVP-020 open questions 46, 47 and 48"): 48 closed (`ADMIN` added to `UserRole`, additive only, no application code path ever grants it); 46 and 47 approved as a *direction*, both stay formally open. Built: `PolicyVersion`/`ConsentRecord`/`DeletionRequest`/`DeletionRequestEvent` (RLS-enabled, append-only, `Restrict` FKs — a deliberate divergence from MVP-010's `Entitlement.userId` `Cascade`), `packages/domain/privacy` + `packages/adapters/privacy` (25 unit/integration tests), four API routes (self-only, deny-by-default; the admin route gives an authenticated non-admin the identical 404 an unauthenticated caller gets, verified by a dedicated route test), `/account/privacy` and `/admin/deletion-requests` UI. One real bug (an ambiguous Playwright locator) found and fixed locally before any CI push (full detail: `planning/progress-report.md`). `docs/06-data-model.md` updated with the new Privacy section. TD-014 recorded (admin queue has no pagination yet — deliberate scope narrowing). FR-004 is Implemented; NFR-010 (scheduled retention by data class) stays a gap, unaffected by this story.

MVP-010 (Free entitlement flow, FR-005) is **Done and merged**. PR #8 merged via `gh pr merge` (not squashed) after CI run 2 (`e1d5dcf`, the merged head) went green on all three jobs: 477/477 accessibility checks (three new states — `product-free-idle`, `product-free-entitled`, `product-free-granted` — across all widths and engines), self-check passing in all three engines, the new `@ppu/adapter-entitlements` integration suite (5/5, including a genuine concurrent-request race-safety test against a real database) confirmed passing for real, Secret scan clean. Open questions 44 (universal sign-in, per-product policy deferred) and 45 (product-scoped, permanent-until-revoked, `revokedAt` enforced at read time) were decided and closed before implementation. Run 1 (`77abff0`) failed on two real test-isolation bugs the local dev-mode checks could not have surfaced — found, root-caused and fixed before run 2 (full detail: `planning/progress-report.md`). FR-005 is Implemented; FR-007 (signed delivery) stays explicitly out of scope, blocked by the absent `ReleaseFile` model, owned by MVP-009.

MVP-023 (manual and automated accessibility gate) is **Done and merged**. PR #6 merged via `gh pr merge` (merge commit `ed9b09b`, not squashed) after the final CI run (`aed24d8`, re-confirmed on the actual merged head `7e10c4a`) went green on all three jobs: 423/423 accessibility checks, 0 skipped, 0 retries, self-check passing in all three engines, every DB-gated integration suite passing for real, Secret scan clean. The `develop` branch-protection rule is live (confirmed by reading it back directly, not assumed); the security review and the accessibility review sign-off are recorded in `docs/final-decisions.md`. NFR-001 and NFR-008 are Implemented. Findings resolved along the way: BUG-012 (production `@ppu/db` connection-pool defect, root-fixed), BUG-013 (Firefox title-disappearance after a session revoke, mitigated), and a secret-scanner false positive (a fingerprint-scoped `.gitleaksignore`, this repository's first suppression, `docs/final-decisions.md`). **BUG-014** (intermittent Firefox @320px sign-in-submit signature) stays **open, monitor-only, permanently instrumented** — three occurrences across sixteen CI runs, two evidence-backed investigation rounds complete, root cause unproven, does not block.

## Board

| Column | Count | Stories |
|---|---|---|
| Backlog | 7 | MVP-008, MVP-009, MVP-015, MVP-016, MVP-024, MVP-025, MVP-043 |
| Ready | 0 | — |
| In Progress | 10 | MVP-007 (slices 1–2 of 3), MVP-030 (slice 1 of 2), MVP-038 (slices 1 and 4 built), MVP-040 (built behind a flag; waiting on Terms and Privacy wording), MVP-041 (redesign slice 2 built), MVP-042 (IndexNow built), MVP-045, MVP-046 (code gaps and quick answers built), MVP-048 (code done and benched: content not written; off behind FEATURE_LEARN), MVP-049 (pipeline, admin and pages built; six components drafted, none paste-tested) |
| QA | 11 | MVP-029, MVP-031, MVP-032, MVP-033, MVP-034, MVP-035, MVP-036, MVP-037, MVP-039, MVP-044, MVP-047 |
| Blocked | 0 | — |
| Superseded | 2 | MVP-011, MVP-013 |
| Done | 19 | MVP-001, MVP-002, MVP-003, MVP-004, MVP-005, MVP-006, MVP-010, MVP-012, MVP-014, MVP-017, MVP-018, MVP-019, MVP-020, MVP-021, MVP-022, MVP-023, MVP-026, MVP-027, MVP-028 |
| **Total** | **49** | |

**2026-09-24 — MVP-011 and MVP-013 marked Superseded** (`docs/final-decisions.md`, "First-party-only publishing model"): the product owner reversed the earlier invited-third-party-creator decision to a first-party-only publishing model. MVP-011 (Creator application) implemented a third-party creator-onboarding flow no longer part of the approved business model — not renamed into a suggestion story; see PROP-009 in `planning/proposed-stories.md` for the separate, not-yet-approved successor concept. MVP-013 (Submission review queue) presupposed a submitter distinct from the reviewer, which first-party-only does not have; its quality requirements are redistributed to MVP-012, MVP-014, MVP-006/TD-006/TD-008, and MVP-019 (full detail in the decision entry). **MVP-012's dependency changes from `MVP-006;MVP-011` to `MVP-006` alone (already Done) — MVP-012 is now the next first-party authoring story, gated only by pricing (open question 7) for its pricing-related fields specifically, not by any creator story.**

MVP-005 unblocked MVP-007 (Checkout, which also needs MVP-002 — Done) and MVP-021 (SEO/sitemap); MVP-021 is now Done and, having no dependents, unblocks nothing new. MVP-023 (depends only on MVP-003, already Done) likewise has no dependents in `planning/mvp-backlog.csv` and unblocks nothing new by itself — its value is the accessibility harness (`packages/e2e`) every future UI story now runs against, and the branch-protection rule now enforcing it. MVP-010 (depends on MVP-002 and MVP-006, both already Done) also has no dependents in `planning/mvp-backlog.csv` and unblocks nothing new by itself. MVP-007 is Ready — "Ready" means dependencies are met, and MVP-007 is still gated by unanswered product decisions (see the recommendation below). MVP-012 is now genuinely Ready in substance (MVP-006 is Done, and the `ADMIN` authorization pattern it needs already exists) — its `Status` column still reads `Backlog` pending a formal Ready-column pass, since the product-owner instruction authorizing this update was documentation/planning only and did not direct a full board-recompute beyond the specific rows named above.

## Completed stories

| Story | Epic | Requirement | Points | Completed |
|---|---|---|---|---|
| MVP-001 | Foundation | NFR-007 | 5 | 2026-09-16 |
| MVP-002 | Identity | FR-004 | 8 | 2026-09-18 |
| MVP-003 | Catalog | FR-001 | 8 | 2026-09-18 |
| MVP-004 | Catalog | FR-002 | 8 | 2026-09-21 |
| MVP-005 | Catalog | FR-003 | 5 | 2026-09-21 |
| MVP-006 | Files | FR-007 | 13 | 2026-09-18 |
| MVP-010 | Free assets | FR-005 | 3 | 2026-09-22 |
| MVP-018 | Notifications | FR-013 | 5 | 2026-09-23 |
| MVP-020 | Privacy | FR-004 | 8 | 2026-09-23 |
| MVP-021 | SEO | FR-017 | 3 | 2026-09-21 |
| MVP-022 | Observability | NFR-007 | 8 | 2026-09-18 |
| MVP-017 | Content | FR-014 | 5 | 2026-09-23 |
| MVP-023 | Accessibility | NFR-001 | 13 | 2026-09-22 |
| MVP-012 | Publishing | FR-009 | 8 | 2026-09-24 |
| MVP-014 | Publishing | FR-011 | 3 | 2026-09-28 |
| MVP-019 | Admin | FR-015 | 13 | 2026-09-28 |

### MVP-004 — Catalog filtering and search
- Keyword search (real PostgreSQL full-text search, `to_tsvector`/`plainto_tsquery`/`ts_rank`), category filter, sort (relevance/recent/alphabetical), pagination, clear-all — all via shareable URLs, no client JavaScript required for the core interactions (plain forms/links, fully keyboard/screen-reader accessible by default).
- Two scope boundaries flagged and resolved before coding rather than silently decided: FR-002's license/compatibility/pricing filter axes deferred to MVP-005/007 (fields don't exist yet); "analytically tracked" satisfied via the existing `@ppu/telemetry` logger rather than PostHog (which MVP-022 deliberately deferred).
- Real bug found and fixed at the root: `packages/db`'s `prisma` export was constructed eagerly at module-import time, throwing before any `describe.skipIf` guard could run for a package that only needed the `Prisma.sql` value helper. Fixed with a lazy `Proxy` — benefits every future consumer, not just this story.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

### MVP-005 — Product detail evidence model
- The product page now shows license tiers, the current published version, the support declaration and a compatibility matrix (platform area, minimum release wave, evidence status, last verified, notes), using the compatibility model the product owner approved on 2026-09-21 (closes open question 6 part 1). Products with no evidence show explicit "not provided" wording; no `Product` rows or compatibility data were invented or seeded.
- The database enforces the rules independently of the code (CHECK constraints, unique index, RLS). Proven on real Postgres, and by 18 new DB-gated tests that **passed in CI** (PR #4) — the CI Postgres log shows the constraints rejecting the deliberately-invalid rows.
- Accessibility: real table semantics, status shown as text (never colour alone), labelled keyboard-focusable scroll region on mobile; axe-core 0 violations at 1024px and 375px. Not covered: a real screen-reader pass (MVP-023's scope).
- Recorded rather than hidden: TD-006 (no write path calls the evidence validator yet; no private-data screening), TD-007 (other FR-003 items have no owning story; no E2E yet). FR-003 is **Partially Implemented**. Also caught at the start of this story: FR-002's traceability had been overstated after MVP-004 (TD-005).
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

### MVP-010 — Free entitlement flow
- `POST /api/products/[slug]/entitlement` grants (or idempotently reuses) a free `Entitlement` and records an append-only `Download` audit event, for a signed-in user only — no guest path, no per-product policy field (decision Q44). Product eligibility (`PUBLISHED`) is re-read and re-checked server-side on every request; nothing is ever trusted from the client.
- Does not deliver a file: `ReleaseFile` doesn't exist yet in the schema (confirmed by reading `packages/db/prisma/schema/files.prisma` directly, not assumed), so signed delivery stays entirely MVP-009's, unbuilt here.
- `Entitlement` is product-scoped and permanent-until-revoked; `revokedAt` is present and **enforced at read time**, though nothing in this story ever sets it (decision Q45's amendment) — a future revocation feature only has to write the column, not also add the check.
- A real, reproduced race-safety property, not assumed: two concurrent grant requests for the same user/product against a real database produce exactly one entitlement row, proven by an integration test.
- Two real test-isolation bugs were found by CI's first real production-mode run (not by local testing, which could not have reproduced them) and fixed before merge — full account in `planning/progress-report.md`.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md` and `docs/final-decisions.md`.

### MVP-018 — Transactional email and preferences
- `auth.ts`'s sign-in link migrated off `ConsoleEmailAdapter` onto a real `ResendEmailAdapter`/`ConsoleEmailAdapter` selection (Resend when `RESEND_API_KEY` is set, console logging otherwise — production never fails to start, mirroring `error-monitoring.ts`'s `SENTRY_DSN` fallback exactly). No verified sending domain exists yet (open question 1), so the real vendor is never selected today.
- One deletion-request acknowledgement (`SUBMITTED` only — decision question 49). Every other lifecycle state was deliberately declined: `UNDER_REVIEW`/`WITHDRAWN` for no user value, `APPROVED`/`COMPLETED` because MVP-020 executes no erasure and those messages would describe an action the system doesn't perform, `DENIED` as a recorded gap pending product-owner copy.
- No new preference table: MVP-020's `ConsentRecord` (`MARKETING_EMAIL`) already is the notification preference — this story enforces it fresh on every optional send (built and tested, though no real optional message exists yet) and acts on it via a stateless, HMAC-signed unsubscribe token (no new table; every failure mode returns the identical response, so it can't be used to enumerate addresses or reveal registration).
- Two real bugs found and fixed locally, before any CI push: three `/unsubscribe` states had no keyboard stops at all (fixed with a "back to home" link, matching `BUG-008`'s established pattern for every dead-end page); that link's own touch target was under the WCAG 24px minimum (fixed with padding).
- Recorded: TD-015 (email sends synchronously in the request path, no retry — the same class of gap as TD-004, pending real job-queue infrastructure).
- The merged head's accessibility run breached the MVP-023 10-minute ceiling (10m7s) — authorized to merge anyway for this run only (runner variance, not a regression: the same suite ran 9m47s moments earlier with no functional change). A standing mitigation trigger was recorded in `docs/final-decisions.md`, binding on the next story that adds page states or the next run that exceeds budget. **That trigger has since fired and been addressed — see the CI-infrastructure entry (PR #12, sharding) at the top of this file; the 10-minute job-wall-clock ceiling is superseded by a new per-shard test-execution budget.**
- Full detail, including the security and accessibility reviews: `planning/progress-report.md` and `docs/final-decisions.md`.

### CI infrastructure — Accessibility suite sharding (not a backlog story)
- The accessibility job is now a 4-way Playwright `--shard` matrix plus a same-named aggregator (`accessibility-summary`) required check, so branch protection needed no reconfiguration.
- Every engine (chromium, firefox, webkit), every width (320/375/768/1280) and every rule is preserved unchanged in every shard; the unconditional self-check runs a second time in every shard, all three engines, via output-path namespacing (`E2E_OUTPUT_SUFFIX`) that prevents the two invocations per shard from clobbering each other's report.
- New governing budget: per-shard test execution, target under 5 minutes, ceiling 8 minutes (replacing the single-job 10-minute ceiling). Job wall-clock is still reported but no longer gates.
- Total check count rose from 747 to 855, entirely accounted for by the deliberate self-check replication (36 → 144) required to satisfy "every shard, every engine" — the main pool's 711 tests are unchanged, just redistributed.
- An external code review (GitHub Copilot) fixed two real gaps before merge (a hardcoded shard denominator, no assertion on the self-check's own test count) and surfaced BUG-015 (a pre-existing, unrelated test-isolation flake), recorded but not fixed here.
- Full detail: `docs/final-decisions.md`, "Accessibility suite mitigation: sharding implemented" and "External review requested and addressed, before merge"; `planning/progress-report.md`.

### MVP-017 — Content publishing: tutorials, patterns and comparison pages (Done)
- `Article`/`ArticlePublishEvent` (RLS enabled, `Restrict` FKs on `authorUserId`/`actorUserId`, `DRAFT`→`PUBLISHED` the only allowed transition, `publishArticle` fully transactional with the article update and the event insert in one `$transaction`).
- `@ppu/domain-content` + `@ppu/adapter-content` replace the prior placeholder, built to the exact structural pattern `privacy`'s domain/adapter package pair established.
- Public `/learn/[slug]` page with the same FR-017 SEO treatment already established for products/categories (canonical, metadata, `TechArticle` JSON-LD, sitemap inclusion); a minimal `ADMIN`-gated editorial surface (`/admin/content/*`) reusing `/admin/deletion-requests`' exact deny-by-default authorization pattern (no `EDITOR` role exists or was invented).
- Collections excluded from MVP-017 entirely (product-owner decision, after this session investigated and reported the scope conflict); `LearningPath`/`LearningPathItem` deferred as a fast-follow, not dropped (`docs/open-questions.md` item 50). FR-014 is Partially Implemented.
- `Article.body` (Markdown) renders as plain escaped text, not HTML — closes a stored-XSS surface without a new dependency ([TD-017](tech-debt/TD-017.md)); `ArticlePublishEvent` is a bare action log, not full version snapshotting ([TD-016](tech-debt/TD-016.md)).
- Three real bugs found and fixed before Done (not filed as bug records, per `CLAUDE.md`'s bug-vs-shortcut distinction): a fixture-cleanup FK-ordering bug, non-worker-unique fixture titles causing a Playwright strict-mode violation under parallel workers, and — found by the real CI run on PR #14 — the public `/learn/[slug]` page had no keyboard-reachable control at all (WCAG 2.4.1), fixed with the established BUG-008 "back to home" link pattern.
- CI run `35932897213`: all 6 checks green, confirmed by reading the raw log directly — `@ppu/adapter-content`'s DB-gated integration suite (7 tests) passed for real against CI's throwaway Postgres, `@ppu/domain-content`'s 15 unit tests passed, zero skips, zero retries across all four accessibility shards, and the exact keyboard test that failed on the first push now passes cleanly in all three engines.
- Full detail, including the security and accessibility reviews: `docs/final-decisions.md` ("MVP-017 implementation" entries and "MVP-017: security and accessibility review, Done, merge"), `planning/progress-report.md`.

### MVP-020 — Consent and legal deletion workflow
- Consent capture (`ConsentRecord`, append-only — a change of mind always inserts a new row) and a deletion **request** workflow (`DeletionRequest`/`DeletionRequestEvent`, append-only, no status column — current state is derived from the latest event) — this story records and reviews requests only; it executes no erasure, anonymisation or scheduled retention (open questions 46/47, out of scope by design).
- `Restrict` (not `Cascade`) foreign keys on every new table's `userId`/`actorUserId` — a deliberate divergence from MVP-010's `Entitlement.userId` `Cascade`, so a future user-deletion cannot silently destroy this audit trail. Proven twice: a local integration test, and the real CI Postgres log itself rejecting the deliberately-invalid delete.
- A new `ADMIN` role (`UserRole`, additive only — decision 48) gates `/admin/deletion-requests` and its action route. No application code path ever assigns it; the role is re-queried from the database on every request, never read from the session. A non-admin gets the byte-identical `404` an unauthenticated caller gets — proven by a dedicated route test, not just asserted.
- Seven new accessibility-gated states, including a second database-created `ADMIN` fixture identity (the sanctioned mechanism for test-only admin access). One real bug (an ambiguous Playwright `role="status"` locator) found and fixed locally before any CI push.
- Recorded: TD-014 (admin queue has no pagination — deliberate scope narrowing, not a defect at current scale). Open questions 46 and 47 stay formally open (the eventual erasure-execution treatment and jurisdiction-dependent timelines are not decided by this story).
- Full detail, including the security and accessibility reviews: `planning/progress-report.md` and `docs/final-decisions.md`.

### MVP-021 — Metadata, sitemap, canonical, structured data
- Canonical URLs, page metadata, Open Graph and Twitter tags, `sitemap.xml`, `robots.txt` and schema.org JSON-LD, under the product owner's 2026-09-21 decisions. The site origin is `NEXT_PUBLIC_SITE_URL`, validated in one place, read at runtime, and failing safe (no incorrect canonical URLs) when missing or invalid in production.
- Deny-by-default robots (every page `noindex` unless it opts in). Category policy as approved: empty categories `noindex` and out of the sitemap; valid `?page=N` self-canonical; search, sort, filter and mixed variants `noindex` with the base canonical — an intentional corrective SEO change owned by this story, with MVP-004's search unchanged. Product JSON-LD ships **without Offer data** and with no rich-result claim.
- Verified on the real pages against a real Postgres (dev and production builds), a hostile product in the live browser DOM, and six production site-URL scenarios; **CI: 458 tests passed, 0 skipped**, including all DB-gated suites.
- Recorded: BUG-001 resolved; **BUG-002** (a repeated `q` returns HTTP 500 — MVP-004 code, out of scope, needs a decision, open question 32); TD-009 and TD-010. TD-008 was not touched.
- Full detail, including the security and accessibility reviews: `planning/progress-report.md`.

Full detail on every story is in `planning/progress-report.md`.

## Progress metrics

- Stories done: 19 / 42 active (45%); 2 more are Superseded (44 on the board)
- Stories in QA: 9 / 42 (MVP-029, MVP-031, MVP-032, MVP-033, MVP-037, MVP-034, MVP-035, MVP-036, MVP-044)
- Points done: 139 / 283 (49%), not counting the 13 Superseded points
- P0 points done: 103 / 132 (78%)
- P1 points done: 36 / 141 (26%)
- P2 points done: 0 / 10
- Open bugs: 3 (BUG-010, BUG-011, BUG-014); 1 mitigated not root-fixed (BUG-013); 11 resolved (BUG-002 by MVP-026; BUG-009 and BUG-016 by MVP-027) (see `planning/bugs.csv` and `planning/bugs/`)
- Open tech debt: 19 (see `planning/tech-debt.csv` and `planning/tech-debt/`) — TD-017 resolved and TD-023 added by MVP-026; TD-024 added by MVP-031; TD-010 partially resolved
- Stories blocked: 0

Points in `planning/backlog.csv` are first-pass relative estimates (Fibonacci scale), unchanged from initial planning except MVP-023 (8 → 13 on 2026-09-21: the WCAG A/AA corrective fixes are in scope, decision Q37).

## Remaining work summary

**Updated 2026-10-06: 21 of 40 active stories remain (144 of 283 points).** 7 of them are in QA, mostly waiting for product-owner review, merge or publishing: MVP-029, 031, 032, 033, 034, 035 and 036. The table below is the earlier per-sprint view (2026-09-28), kept for history. Sprint 8 adds MVP-034 to MVP-042: MVP-034, 035 and 036 are in QA; MVP-037 is in progress; MVP-038 to 042 are in the backlog.

**7 of 25 stories remain as active backlog work (44 of 170 points)** — updated 2026-09-28. MVP-014 (3 points) and MVP-019 (13 points) are now Done. Two stories (MVP-011, MVP-013, 13 points combined) are Superseded, not Done and not counted as remaining; they are off the active board per `docs/final-decisions.md`, "First-party-only publishing model." (16 Done + 7 remaining + 2 Superseded = 25 total.)

| Sprint | Stories | Status | Points |
|---|---|---|---|
| 1 | MVP-001 | **Done** | 5 (done) |
| 2 | MVP-002, MVP-003, MVP-006, MVP-022 | **Done** | 37 (done) |
| 3 | MVP-004, MVP-005 | **Done** | 13 (done) |
| 3 | MVP-023 | **Done** | 13 (done) |
| 3 | MVP-010 | **Done** | 3 (done) |
| 3 | MVP-011 | **Superseded** | 5 (not counted toward remaining) |
| 3 | MVP-017 | **Done** | 5 (done) |
| 3 | MVP-018 | **Done** | 5 (done) |
| 3 | MVP-020 | **Done** | 8 (done) |
| 4 | MVP-021 | **Done** | 3 (done) |
| 4 | MVP-007 | In Progress (slices 1–2 of 3) | 8 |
| 4 | MVP-026 (SEO discoverability) | **Done** | 5 (done) |
| 5 | MVP-027 (Design system) | **Done** | 13 (done) |
| 5 | MVP-028 (Technology sections) | **Done** | 8 (done) |
| 6 | MVP-029 (Launch content) | QA (24 of 24 articles written; awaiting product-owner review) | 13 |
| 6 | MVP-030 (Deploy to Netlify) | In Progress (slice 1 of 2) | 5 |
| 6 | MVP-031 (Daylight redesign) | QA (built and gated; awaiting product-owner review and merge) | 13 |
| 6 | MVP-032 (About, Privacy and Terms) | QA (built; awaiting product-owner review and merge after #53) | 5 |
| 4 | MVP-012 | **Done** | 8 (done) |
| 5 | MVP-013 | **Superseded** | 8 (not counted toward remaining) |
| 5 | MVP-008 | Backlog | 8 |
| 6 | MVP-009 | Backlog | 5 |
| 6 | MVP-014, MVP-019 | **Done** | 16 (done) |
| 7 | MVP-015, MVP-016, MVP-024 | Backlog | 15 |
| 8 | MVP-025 (launch gate) | Backlog | 8 |

MVP-025 cannot start until every P0 story above it is Done.

## Next story recommendation

**Updated 2026-10-06.** By dependency (every `Depends on` story Done), four stories are unblocked:
- MVP-007, gated by open questions 3 and 7;
- MVP-024;
- **MVP-041 (Article visuals)**;
- **MVP-042 (SEO additions)**.

**Recommended next: MVP-041 and MVP-042,** the product owner's chosen next work after password sign-in. They are the first, dependency-free slices of the guide and hub redesign (`docs/plans/guide-and-hub-redesign.md`).

MVP-037 (Hub framing) is already in progress, but it formally waits on MVP-033, which is in QA until the product owner closes it. MVP-040 (Community solutions) now needs only MVP-038, because MVP-036 gives it signed-in readers with passwords once MVP-036 is Done.

**Updated 2026-09-28.** MVP-014 and MVP-019 are **Done**. Every remaining story is now either blocked on another story or gated on an open product decision. The launch critical path is `MVP-007` (Checkout) → `MVP-008` (webhook fulfilment) → `MVP-009` (signed downloads) → `MVP-025`, and it starts with **MVP-007, which is Ready by dependency but gated on open questions 3 (countries/currencies/tax/refunds) and 7 (pricing)** — answers only the product owner can give. The Stripe direction and MVP-007 pre-work already exist on the unmerged `docs/mvp-007-stripe-checkout-prework` branch, so answering those two questions is the single highest-leverage unblock. **MVP-024 (Support case workflow, P1)** is newly dependency-unblocked by MVP-019, but its acceptance criterion links a case to an *order*, and no `Order` model exists until MVP-007/008 — it can only be partly built today. Recommendation: answer open questions 3 and 7 so MVP-007 can start; MVP-024 pre-work is the fallback if those answers are not coming soon.

**MVP-011 (Creator application) stays Superseded and is not a candidate** — its underlying business model no longer exists.

**BUG-002 is resolved** (inside MVP-026, 2026-09-28; PROP-006 done).

**Next, per the product owner's work order:** once MVP-026 merges, the ads story, then MVP-007 slice 3 (checkout) and MVP-008. The product owner's new requests (researched launch content, per-technology sections, a daily maintenance and analytics agent, and a UI overhaul) will come back as a roadmap with decisions to confirm before any of them is scheduled.

Dependency-Ready but gated by unanswered product decisions, so not recommended until those are answered: **MVP-007 (Checkout)** — open questions 3 (countries/currencies/tax/refunds) and 7 (pricing); open question 8 (creator payout model) is now closed as obsolete and no longer gates it. **MVP-013 (Submission review queue) is Superseded** — not a candidate; its quality requirements are redistributed to MVP-012, MVP-014, MVP-006/TD-006/TD-008, and MVP-019 (`docs/final-decisions.md`, section 5).

## Open bugs

- **[BUG-019](bugs/BUG-019.md) (P1, security)** and **[BUG-020](bugs/BUG-020.md) (P2, security)**, both **Resolved** 2026-10-02 on `fix/signin-link-logging-and-upload-auth`. Production without an email key used to log sign-in links, which are working credentials; it now fails closed and logs nothing. Upload URLs were open to any signed-in user; they are now admin-only. Nothing is deployed, so nothing was exposed.
6 open, 1 mitigated (not root-fixed), 8 resolved, as last counted. This count predates BUG-016 to BUG-018. `planning/bugs.csv` disagrees with this list for several older bugs (BUG-003 to BUG-009 and BUG-015); reconciling them against git history is a separate cleanup.
- **[BUG-018](bugs/BUG-018.md) (P0, security)** — **Resolved** 2026-09-30: a critical Next.js advisory (GHSA-vcvr-r3jv-pc5j, remote code execution in `next/og` `ImageResponse`) covered our 16.3.5. Upgraded to 16.3.7. Nothing is deployed, so nothing was exposed; `main` still needs the fix released.
- [BUG-016](bugs/BUG-016.md) and [BUG-017](bugs/BUG-017.md) — **Resolved** 2026-09-30 (accessibility-suite fixture cleanup; a test that failed on Windows line endings).
- [BUG-001](bugs/BUG-001.md) — **Resolved** by MVP-021 (PR #5, 2026-09-21): delivered pages emitted relative canonical/`og:url` tags and sign-in/account pages were indexable. No production deployment existed, so nothing was exposed.
- [BUG-002](bugs/BUG-002.md) — **Resolved** by MVP-026 (2026-09-28): a repeated query parameter now uses its first value instead of returning HTTP 500.

- **BUG-003 to BUG-008** — **Resolved** by MVP-023 (F1–F10): [BUG-003](bugs/BUG-003.md) invisible keyboard focus ring on the Search button (was 1.06:1, now 18.13:1); [BUG-004](bugs/BUG-004.md) search input border and placeholder contrast (was 1.35:1/3.46:1, now 7.48:1/7.48:1); [BUG-005](bugs/BUG-005.md) sign-in error identification, focus and title; [BUG-006](bugs/BUG-006.md) session-revoke focus, announcement and title; [BUG-007](bugs/BUG-007.md) skipped heading levels; [BUG-008](bugs/BUG-008.md) 404 landmark and title. Each shipped as its own commit with a regression test shown failing before the fix.

- **[BUG-012](bugs/BUG-012.md) (P1)** — **Resolved** by MVP-023: a production build opened a new Postgres connection pool for every query (reproduced: 40 queries, 41 connections); the shared client is now cached in every environment, not only development and test.
- **[BUG-013](bugs/BUG-013.md) (P3)** — **Mitigated**, not root-fixed, by MVP-023: in Firefox, `router.refresh()` could leave `<title>` removed from `<head>` after a session revoke; `SessionsHeading` now repairs it. The underlying framework gap is tracked as [TD-013](tech-debt/TD-013.md).
- [BUG-009](bugs/BUG-009.md) sign-in and account pages are unstyled (advisory, not fixed by MVP-023); [BUG-010](bugs/BUG-010.md) session-revoke failure path still loses focus (P3, not fixed); [BUG-011](bugs/BUG-011.md) sign-in stays in its sending state if the request throws (P3, not fixed); [BUG-014](bugs/BUG-014.md) (P3) the sign-in submit control (`signin-sent`/`signin-send-failed`) has produced no observable effect three times across sixteen CI runs, Firefox @320px only, never reproduced deterministically — two evidence-backed investigation rounds complete (real-browser-verified node identity/connectivity, then observer liveness/navigation/native-submit), root cause still unproven, permanently instrumented, does not block.
- [BUG-015](bugs/BUG-015.md) (P3, found 2026-09-23 while verifying the accessibility-suite-sharding PR) — `catalog-repository.integration.test.ts`'s `listSitemapEntries` "same order on every call" test can fail intermittently because `@ppu/adapter-catalog` and `@ppu/adapter-entitlements`'s integration suites can run concurrently against the same shared CI Postgres container with no cross-package isolation. Confirmed flaky (not deterministic) by re-running the identical commit's job, which passed clean. An independent code-review recommendation (per-package database isolation) is recorded as received input, not an approved decision.

Earlier real issues (this story's `packages/db` eager-construction bug, and MVP-003's Tailwind/rendering bugs before it) were all caught and fixed within their own story before reaching Done — per `CLAUDE.md`'s bug-vs-shortcut distinction, documented in `planning/progress-report.md`, not filed as bugs.

## Open tech debt

19 open items (4 resolved). See `planning/tech-debt.csv` (index) and `planning/tech-debt/`:
- [TD-001](tech-debt/TD-001.md), [TD-002](tech-debt/TD-002.md), [TD-003](tech-debt/TD-003.md) — Resolved.
- [TD-004](tech-debt/TD-004.md) — **Open**: MVP-006's file-scan pipeline runs synchronously rather than via a durable job queue.
- [TD-005](tech-debt/TD-005.md) — **Open** (new, 2026-09-21): FR-002's license/compatibility/free-paid/accessibility-status/update-recency filters (and "AI") were deferred by MVP-004; FR-002 traceability corrected from "Implemented" to "Partially Implemented". Update: MVP-005 now supplies the license and compatibility fields, so those two filters are unblocked pending a backlog decision.
- [TD-006](tech-debt/TD-006.md) — **Partially Resolved (2026-09-24, MVP-012)**: the write path (`validateCompatibilityEntry` called on every write) and the Creator-Declared-only role rule are now enforced end to end. Stays open for point 2 only — no heuristic private-data (GUID/tenant-ID/secret-shaped-string) screening exists, and MVP-012's scope never included it.
- [TD-019](tech-debt/TD-019.md) — **Resolved (2026-09-24)**: 7 new Playwright a11y states now cover MVP-012's 3 admin pages (mirroring `admin-content-*`'s convention), verified green on real CI (`36099983635`, all 4 shards, 1107 total tests, 0 skips, 0 retries).
- [TD-020](tech-debt/TD-020.md) — **Open** (new, 2026-09-24, Low): local embedded-Postgres helper scripts can leave orphaned `postgres.exe` processes on Windows if not stopped gracefully — a session tooling-hygiene gap, not a repository code defect.
- [TD-022](tech-debt/TD-022.md) — **Open** (new, 2026-09-26, Low): the admin audit log (`/admin/audit`, MVP-019) has no pagination — capped at the 100 most recent events across all domains, mirroring TD-014's identical accepted precedent for `/admin/deletion-requests`.
- [TD-007](tech-debt/TD-007.md) — **Open** (new, 2026-09-21): FR-003 items beyond license/version/support/compatibility (~~creator~~ — moot 2026-09-24, publisher is LowCodeStacks, see `docs/final-decisions.md`; screenshots, demo, price, prerequisites, setup, accessibility statement, changelog, version history, related assets) have no approved delivering story, and there is no Playwright E2E for the product page; FR-003 traceability is "Partially Implemented". Ownership dispositions were recorded 2026-09-21: ~~creator to MVP-011~~ (moot, same decision), price to MVP-007, the rest proposed (not approved).
- **[TD-018](tech-debt/TD-018.md)** — **Open** (new, 2026-09-24, Low): `CREATOR_DECLARED`/`CREATOR_SUPPORTED` compatibility-evidence display labels still read "Creator" after the first-party-only decision; `CREATOR_DECLARED`'s replacement wording ("Publisher declared") is decided, `CREATOR_SUPPORTED`'s is not. No enum, validator, or production code changed.
- [TD-008](tech-debt/TD-008.md) — **Partially Resolved (2026-09-24)**: the schema/validator/presentation correction landed first — `MARKETPLACE_REVIEWED` enum value and nullable `reviewedAt` column (two migrations, CHECK constraint verified against a real database both directions), the validator now rejects `TESTED`/`NOT_VERIFIED` as reserved/legacy, and the public legend/matrix show only the two assignable statuses (fail closed for any legacy row). **Then MVP-012 (same day) landed the write path and ADMIN-only authorization enforcement** this record's own hard gate (section 9) required to wait for. **Still open, deliberately**: the `MARKETPLACE_REVIEWED` moderation workflow itself and the `ModerationReview`/`AuditEvent` entities have no owner — MVP-013, which was going to build them, is Superseded with no approved successor.
- [TD-009](tech-debt/TD-009.md) — **Open** (new, 2026-09-21): no environment-level noindex switch for staging/preview deployments; needs the hosting decision (open question 5).
- [TD-010](tech-debt/TD-010.md) — **Partially Resolved** (2026-09-28, MVP-026): articles and the `/learn` hub carry a real `lastmod`; products/categories still none, and no sitemap index.
- [TD-011](tech-debt/TD-011.md) — **Open** (new, 2026-09-21): `main` is unprotected and no reviewer or approval rules exist; `develop` protection is decided for MVP-023 but the rest of open question 17 is not (Medium).
- [TD-012](tech-debt/TD-012.md) — **Open** (new, 2026-09-21, Low): a root `.pnpmfile.cjs` removes Next.js's optional `@playwright/test` peer declaration so dev-only Playwright cannot be linked into the web app's production tree.
- [TD-013](tech-debt/TD-013.md) — **Open** (new, 2026-09-21, Medium): `router.refresh()` can briefly leave `<title>` absent from `<head>`; only `/account/sessions` has a mitigation, the underlying framework gap is not understood or fixed.
- [TD-014](tech-debt/TD-014.md) — **Open** (new, 2026-09-22, Low): the admin deletion-request queue (`/admin/deletion-requests`, MVP-020) has no pagination, filtering or sorting — a deliberate scope narrowing, not a defect at current/near-term scale.
- [TD-015](tech-debt/TD-015.md) — **Open** (new, 2026-09-22, Medium): transactional email (MVP-018) is sent synchronously in the request path with no retry — the same class of gap as TD-004, pending real job-queue infrastructure.
- [TD-016](tech-debt/TD-016.md) — **Open** (new, 2026-09-23, Low): `ArticlePublishEvent` (MVP-017) is a bare publish-action log, not full content-version snapshotting — nothing to snapshot yet, since no correction/republish path exists either.
- [TD-017](tech-debt/TD-017.md) — **Resolved** (2026-09-28, MVP-026): article Markdown renders as structured HTML (react-markdown + remark-gfm, no raw HTML).
- [TD-023](tech-debt/TD-023.md) — **Open** (new, 2026-09-28, Low): the `/learn` hub has no pagination — capped at the 500 newest articles.
- [TD-024](tech-debt/TD-024.md) — **Open** (new, 2026-10-02, Low): guide search builds its full-text vector per query (no index) and lists at most 20 guides, with no paging.
- [TD-021](tech-debt/TD-021.md) — **Open** (new, 2026-09-25, Medium): MVP-014 does not snapshot license/compatibility/support-policy evidence at each release's publish time — an explicit scope exclusion, not an oversight; the `Release`/`ReleaseFile` immutability guarantee itself is unaffected, only the surrounding evidence display is not point-in-time.

## Proposed stories (not approved — not on the board, not counted above)
[`planning/proposed-stories.md`](proposed-stories.md) holds proposals from the product owner's 2026-09-21 FR-003 disposition (PROP-001 Product Media and Screenshots, PROP-002 Product Documentation and Prerequisites, PROP-003 Product Accessibility Disclosure, PROP-004 Product Releases and Changelog, PROP-005 Related Assets, deferred), the 2026-09-24 PROP-008 (Power Apps component generator/library, Declined for now), and the 2026-09-24 PROP-009 (Asset and Content Suggestions, Proposed — the successor concept to MVP-011, per `docs/final-decisions.md`, "First-party-only publishing model"). Status **Proposed** until the product owner directly approves each. ~~Creator (ownership) is assigned to MVP-011~~ (moot 2026-09-24, same decision — publisher is LowCodeStacks) and price to MVP-007.

## Notes
- `planning/mvp-backlog.csv` is the canonical status record; `planning/backlog.csv` mirrors Sprint/Points/Status.
- `docs/final-decisions.md` is the binding scope/architecture/process record; `CLAUDE.md`'s Decision Validation Rule and the stop-conditions protocol have now each caught real scope-boundary issues before code was written (license tiers, MVP-003's "filtering framework", MVP-004's analytics-tracking conflict).
- Branching: `develop` is the integration branch (real PRs via `gh`); `main` is promoted from it as a deliberate release decision (not yet done).
- See `planning/progress-report.md` for complete implementation detail on every story and governance action.
