# Admin centre redesign: the choices made, and the options not taken

Story MVP-052 (docs/final-decisions.md, 2026-10-10, "Admin centre: concept A with B's Inbox"). The product owner asked to see, on their return, which options were rejected or not proceeded with. Each phase lists what was built, then the alternatives and why they weren't taken. Any of these can still be revisited.

## Before phase 1: the direction (chosen by the product owner)

| Option | Status |
|---|---|
| **A: polished command centre** (labelled sidebar, colourful "needs you" tiles, tables) | **Chosen, with B's Inbox as the Overview** |
| **B: Inbox** (one to-do list, split views, icon-only rail) | **Inbox taken for the Overview.** The icon-only rail and split views were not taken: page names would hide behind tooltips, and the split view hides most of a long list. |
| **C: Studio** (gradient header, coloured stat tiles, guides as cards) | **Not taken.** Most eye-catching, but cards are slow to scan with 84+ guides. |

## Phase 1: the shell and the Inbox (#160)

**Built:**
- A labelled sidebar with icons, red and amber counts, the purple current-page pill, and a one-line "Admin · page" bar with a Menu button on phones.
- A shared page header.
- The Inbox, with this week's numbers, Quick create and recent activity.

**Not taken:**
- **A "Good morning" greeting as the page title** (concept A's mock-up). The Inbox says what waits instead, which is more useful every visit.
- **Sparkline charts in "Site health".** They need day-by-day numbers the database doesn't keep for every measure (votes, comments, publishing). They'd be invented trends, so they wait for real daily counts.
- **A bottom tab bar on phones** (concept B). The site already has a menu button in its top bar; a second bar at the bottom would cover content and clash with the cookie and Next.js indicators.
- **A horizontal chip scroller for the phone menu** (concept C). Twelve areas don't fit; most would be hidden off-screen with no hint they exist.
- **Acting on every inbox item without leaving the page** (for example closing a guide report with a reason). The Inbox offers the same controls as each item's own page, so behaviour can't drift; deeper actions stay on that page.
- **Showing every waiting item.** The Inbox shows up to 5 of each kind, and the kind's page has the rest. Hundreds of rows would make it slow and hard to read.

## Phase 2: the lists (Guides, Updates, Products)

**Built:**
- Each list gets a search box, status tabs with counts that keep the search, and a technology filter on Guides and Updates.
- Rows show the title, kind and technology chips, a status pill, the last change, and Preview or View, Edit and Publish (Updates also link to the Microsoft source).
- Columns line up on wide screens and stack on phones, and every row control is 44 px tall.

**Not taken:**
- **Searching as you type.** A form the server answers works without JavaScript, can be shared as a link, and avoids a request per keystroke. With under a few hundred rows it's instant either way.
- **A real HTML table.** Rows stack into cards on a phone. A table would need a sideways scroll there, which the accessibility checks fail, or a second copy of the markup. A list reads each row as one item to a screen reader, and the column headings are only a visual aid.
- **Sorting by clicking the column headings.** The default order (newest first, as the repository returns them) plus status tabs covers the daily jobs; sortable columns can come later if you want them.
- **Selecting several rows to publish or delete at once.** Publishing is deliberately one at a time (each publish is checked and audited); bulk actions would need their own confirmation and audit design.
- **Paging the lists.** At about 100 guides and products, one page with search is faster to use. Paging can come when a list passes a few hundred.
- **Including Learn topics and Components in this phase.** Their pages already group things meaningfully (topics with their lessons; components with paste-test state) and are short. They get the shared header in phase 3 rather than a table.
