# Microsoft icons, logos and screenshots: what Microsoft allows (research, 2026-10-09)

**Status: research and recommendations for the product owner. Nothing here is an approved decision.** Under the decision validation rule in `CLAUDE.md`, anything accepted from this note must be recorded in `docs/final-decisions.md` (or an ADR) before it is treated as decided. Several existing decisions say the opposite of some options below; section 7 lists them.

**Not legal advice.** This is a reading of Microsoft's published terms. Section 8 says when to ask a lawyer.

**What was asked (as relayed to this research session):** the product owner wants to use official Microsoft product logos and icons (Power Apps, Power Automate, Power BI, Copilot Studio, Dataverse, Power Pages, Azure and its services, Entra, Fabric and others) in the header mega menu, technology hubs, guide cards and component pages. They also want real product screenshots (Power Apps Studio, the Azure portal and so on) in guides. Their reason: the site feels less trustworthy without them.

---

## The short version

- **Product names in text are fine.** Microsoft allows truthful, referential use of its product names, used less prominently than our own brand, with no hint of endorsement [1].
- **Logos and product icons need a licence by default.** Microsoft's general rule is that logos, app icons and product icons can't be used without an express licence or a published permission [1]. The Microsoft 365 guidelines, which list the Power Apps, Power Automate, Power BI, Power Pages and Copilot app icons, say the same [5].
- **There is one published permission for icons.** The official icon sets on Microsoft Learn (Power Platform, Azure, Entra, Fabric, Microsoft 365, Dynamics 365) may be used **only in architecture diagrams, training materials and documentation**, unchanged, and never to represent your own product [6]–[11]. Entra's terms also rule out marketing [8].
- **That permission does not cover site chrome.** A header menu, hub banner, guide card, share image, component card or paid product page is navigation, decoration or promotion, not a diagram or documentation. Microsoft's own copyright page says icons may not be used as graphical or design elements [3]. So: **avoid official icons there**, unless Microsoft gives written permission.
- **Inside guides, official icons are allowed in real diagrams.** For example, a diagram showing how Power Apps, Dataverse and Power Automate connect. Conditions: the official files, unchanged, labelled with the product name, kept current, and not animated.
- **Screenshots are allowed, with strict conditions** [3]. Our own screenshots of released products may go on websites and in documentation. But: **no editing except resizing, no cropping to a part, no third-party content, no identifiable people**, no splash screens, no beta or unreleased products, and the statement "Used with permission from Microsoft." must be shown.
- **That conflicts with the current screenshot decision.** The 2026-10-06 decision says each screenshot is "cropped" and given "numbered callouts". Under Microsoft's conditions both are edits. Callouts and dates should go beside the image, not on it.
- **Because we can't blur or cover, sensitive details must be kept out at capture time.** Use a test tenant with made-up names and data, and pick screens with no tenant, subscription or object IDs, emails, connection strings or real people. If a screen can't be captured clean, don't use it; draw it instead.
- **Microsoft does enforce this.** In June 2024 Microsoft's legal team told the Simple Icons project that it could only include Microsoft icons from the official Learn icon pages, unedited. The project removed 54 Microsoft icons, including Power Apps, Power Automate, Power BI, Power Pages, Dataverse and Azure [17][18].
- **Other community sites are inconsistent.** Many Power Platform bloggers put product icons on video-style thumbnails, and one consultancy shows them in its menu. Almost none show a Microsoft trademark notice or an independence line. Common practice is not permission.
- **Recommendation:** keep our own glyphs in all site chrome (menu, hubs, cards, share images, component and paid pages). Allow official icons only inside real explanatory diagrams in guide and lesson bodies. Allow our own clean, unedited screenshots in free guides, with the Microsoft attribution line. Strengthen the footer notice. If the product owner still wants icons in the menu or hub headers, ask Microsoft in writing first.

---

## Method and limits

**Read on 2026-10-09:**
- Microsoft's Trademark and Brand Guidelines, its publications guidelines and its "Use of Microsoft copyrighted content" page, read in full from the live pages [1]–[3].
- Microsoft's logo guidance (August 2025) and Microsoft 365 trademark guidelines (dated 1 September 2026), as PDFs [4][5].
- The Microsoft Learn icon pages for Power Platform, Azure, Entra, Fabric, Microsoft 365 and Dynamics 365, through the Microsoft Learn tools [6]–[11]. Microsoft's diagram guidance [12].
- Licences for related icon packages: the Fabric npm package, the Fluent UI assets licence, Fluent UI System Icons, and the Microsoft Docs repositories [13]–[16].
- The Simple Icons removal issue and release notes on GitHub [17][18].
- The home pages of twelve community and training sites [19]–[30].

**Limits:**
- **The downloadable icon ZIP files were not opened.** Downloading them needs the product owner's OK. The Entra package says it includes its own terms of use and a branding playbook [8]. The Dynamics 365 page mentions an FAQ that seems to be in its package [11]. Read those before using any icon.
- **Community sites:** home pages only, on one day. We can't see private licences or partner agreements, so what a site shows tells us nothing about what it is allowed to do.
- Microsoft says it may change or revoke these permissions at any time [1]. Check them again before anything ships.

---

## 1. Microsoft Trademark and Brand Guidelines [1]

### 1.1 Product names: allowed, as references
- You may use Microsoft's product names in text to describe things truthfully. For example, that a guide is about Power Apps, or that a component works in Power Apps.
- Use the name unchanged, as an adjective before a noun ("Power Apps components"), never as a verb or plural, and never merged with other words or slogans.
- Use Microsoft's names **less prominently than your own brand**, unless you have a strategic partnership with Microsoft.
- News article titles may use the names when truthful and not misleading.
- You may say a product is compatible or interoperable when that is true. You may only say "certified" if it went through Microsoft's certification process.

### 1.2 Logos and product icons: a licence by default
- Microsoft treats logos, logo lockups (including Microsoft Azure's), **product and app icons** (it names Microsoft 365, Dynamics and Azure) and badges as brand assets that need its authorisation.
- Without a written licence or a permission in another Microsoft guideline, you may not use Microsoft's logos, icons or designs in any manner.
- Microsoft's logos and icons may never be used as your own app's icon. In app advertising they need a licence agreement.
- An app's name, logo, description and **screenshots** must be free of Microsoft brand assets unless you have a licence. The only exception is a truthful compatibility statement in the description text. The page illustrates an approved app listing as one with no Microsoft content in its images.

### 1.3 No implied affiliation or endorsement
- Don't suggest affiliation, endorsement, sponsorship or approval by Microsoft.
- Don't use brand assets in a way that suggests Microsoft published, developed or endorsed your product.

### 1.4 Names of businesses, products, domains and groups
- No Microsoft brand assets in the name of a business, product, app, domain, social account, user group or tech community, even a non-profit one.
- LowCodeStacks, `/azure` as a path (not a subdomain) and the generated reader names already follow this (`docs/final-decisions.md`, 2026-10-09, "Top bar: Azure, coming soon").

### 1.5 The trademark notice
- Microsoft asks for a trademark footnote. Its suggested form starts with "Microsoft", lists the other marks in alphabetical order, and ends: "are trademarks of the Microsoft group of companies".
- Our footer already has this sentence. Its list is in registry order, not alphabetical (`apps/web/app/SiteFooter.tsx`).

### 1.6 The publications guideline [2]
- Microsoft lets publications, seminars and conferences use its **word marks** (not logos) in their titles, if the name relates to the product discussed, your own name is more prominent, and a disclaimer of affiliation is shown prominently.
- The mark may not be the leading word or the most prominent part of the publication's title. "LowCodeStacks" is our title, so this is met. Guide titles that start with a product name are closest to article titles, which the guidelines allow when truthful (section 1.1). Keep the LowCodeStacks name more prominent than product names in the page frame.
- **Microsoft logos may not be used at all** under this guideline.
- If you include a trademark footnote, it must add: "All other trademarks are the property of their respective owners."
- Its sample disclaimer says the publication is independent and is not affiliated with, authorised, sponsored or approved by Microsoft Corporation. Our footer line says nearly the same.

### 1.7 Product-specific guidelines [4][5]
- **Microsoft logo (four squares):** a formal licence is required, apart from two narrow cases: material about a business relationship with Microsoft (such as being a reseller) that also shows at least one other company you have a similar relationship with, or an area dedicated to selling Microsoft products. Neither fits us [4].
- **Microsoft 365 guidelines (1 September 2026):** a trademark use licence is needed to use the Microsoft 365 trademarks and app icons [5]. The app icon list includes **Power Apps, Power Automate, Power BI, Power Pages and Copilot**. It also says: "Avoid using product app icons decoratively or as logos." Don't alter, distort or crop them. In third-party marketing, put "Microsoft" before the app name on first use, and never shorten Microsoft 365 to "M365".

### 1.8 Permissions can be withdrawn
- All use benefits Microsoft only. Microsoft may change or revoke any permission at any time, worldwide. Questions go to trademarks@microsoft.com or a Microsoft contact [1].

---

## 2. The Power Platform icon set [6]

**What it is.** The official icons for Power Platform, Power Apps, Power Automate, Power BI, Power Pages, Copilot Studio, Dataverse, AI Builder, Power Fx and (since December 2025) Microsoft Agent 365, as SVG files from the Learn page. All Power Platform and Copilot Studio icons were updated in December 2025.

**The terms, paraphrased.**
- Microsoft allows the icons in **architecture diagrams, training materials or documentation**.
- You may copy, share and display them only for those uses, unless Microsoft gives you explicit permission. Microsoft keeps all other rights.

**Do:**
- Use an icon to show how products work together.
- In diagrams, put the product name near the icon.
- Show the icon as it appears in the product.

**Don't:**
- Crop, flip or rotate it.
- Distort it or change its shape.
- "Don't use Microsoft product icons to represent your product or service."

**Not stated, so treat as not allowed without asking:** recolouring, single-colour versions, animation, use in marketing, and use in navigation or as decoration. Recolouring and single-colour versions change the icon "as it appears in the product". The general guidelines also ban animating or altering brand assets [1].

**Microsoft's copyright page agrees [3].** It says product icons may not be used in advertising, online locations, software or video, with one exception: training manuals or documentation about a Microsoft product. Even then, the icon must match what it does in the software, must not be a graphical or design element, and must not be changed.

**Does each surface count as "diagrams, training materials or documentation"?**

| Surface | Covered? | Why |
|---|---|---|
| Header mega menu | No | Site navigation. The icon would be a design element and a way of labelling our menu, not explaining how products work together. |
| Technology hub header | Unclear at best | The hub is part of our documentation, but an icon in a page banner is decoration and branding, which [3] and [5] warn against. |
| Guide and lesson cards | No | Listing and promotion. The icon would be decorative. |
| Diagram inside a guide or lesson | Yes | The exact use the terms describe. |
| Inline mention in a step ("select the + icon") | Mostly yes | The copyright page allows icons in documentation about a Microsoft product when tied to what the icon does in the software [3]. |
| Component library pages | No | The icon would sit next to our product and stand for it, which the terms forbid. |
| Social share images | No | Promotional images shown in feeds. |
| Paid product pages | No | Advertising and listing. Section 1.2 and [3] need a licence there. |

---

## 3. Azure, Entra, Fabric, Microsoft 365, Dynamics 365, Copilot and Fluent

- **Azure architecture icons [7]:** the same terms as Power Platform (diagrams, training, documentation; unchanged; not for your own product). The set is large and updated often (July 2026 added Foundry icons). Microsoft's own diagram guidance tells architects to use the latest official icons and not to stretch or recolour them [12]. Azure **logo lockups** need authorisation [1].
- **Microsoft Entra icons [8]:** the same terms, plus: "Don't use Microsoft product icons in Marketing communications." The download includes its own terms of use and a branding playbook, which this research did not open.
- **Microsoft Fabric icons [9]:** the same terms. The page also mentions slide decks. Microsoft also publishes the icons as an npm package under the MIT licence "for use in Microsoft Fabric platform extension development" [13]. **An MIT licence on the files covers copyright only. It gives no trademark rights**, and the Learn page still limits the purpose. Don't treat it as a way round the terms.
- **Microsoft 365 architecture icons [10] and Dynamics 365 icons [11]:** the same terms.
- **Copilot:** the Copilot Studio icon is in the Power Platform set [6]. Microsoft Foundry icons are in the Azure set [7]. The Microsoft 365 **Copilot** app icon is in the Microsoft 365 guidelines, which need a licence [5]. No separate public permission for Copilot icons was found.
- **Fluent UI:** Fluent UI System Icons are generic interface glyphs (arrows, gear, plus) under the MIT licence [15]. They are not product logos. The older Fluent/Fabric assets (Office app icons, Segoe font) are under a separate licence [14]. It only covers developers who use a Microsoft API in their app, website or product, or who show that their app integrates with Microsoft products, and it adds quality conditions. That doesn't fit a learning site.
- **Microsoft Learn text and images:** the Learn documentation repositories are under CC BY 4.0. Their notice says the licence **gives no right to use Microsoft names, logos or trademarks** [16]. The decision that we never copy Learn screenshots stands (2026-10-06).
- **Third-party icon packs** (Simple Icons, Font Awesome brands and similar) give no rights in Microsoft's marks. Simple Icons removed all its Microsoft icons at Microsoft's request in 2024 [17][18].

---

## 4. Screenshots [3]

### 4.1 What Microsoft allows
Every permitted use must meet four general requirements:
1. Use the product's **full name** when you refer to it (for example "Microsoft Power Apps"), following the trademark guidelines.
2. Link to Microsoft only with **plain text links**.
3. No offensive, disparaging or defamatory use.
4. Include the statement: **"Used with permission from Microsoft."**

For screenshots specifically:
- **Not allowed:** boot-up, opening or splash screens, and screens from **beta or other products not yet commercially released**.
- **Allowed:** other screenshots in advertising, documentation (including educational material), tutorial books, videos and websites, if you also:
  - don't alter the screenshot except to resize it;
  - don't use portions of a screenshot;
  - don't put screenshots in your own product's user interface;
  - don't use screenshots that contain third-party content;
  - don't use screenshots that show an identifiable person.

Free guides and learning pages clearly fit "documentation", "tutorial" and "websites". Paid product pages fit "advertising", which is also listed, but section 1.2 adds that a product listing's screenshots should be free of Microsoft brand assets unless licensed.

### 4.2 What this means for us
- **Resizing only.** No cropping after capture, no arrows, boxes, numbered markers, blur or highlights drawn on the image. Capture exactly the area you want (a whole window or the app's page area) and don't cut it down afterwards. Whether capturing only the app's page area counts as a "portion" is not stated; capturing it whole at capture time is the safest reading.
- **Callouts go beside the image.** Put the numbered steps in a list under or beside the screenshot, and the date in the caption. Overlays drawn on top of the image by the page would still change what readers see, so avoid them too.
- **No third-party content.** No browser chrome (address bar, tabs, extensions, bookmarks), no other apps or desktop, no third-party connector logos or content (for example a Salesforce or Google connector), no third-party images inside the app.
- **No identifiable people.** No profile photos and no real names, including the product owner's. The test account should have a made-up name and no photo.
- **Released products only.** Microsoft labels many features "preview". The page bans beta and unreleased products. Whether a public preview counts is not stated; the safe reading is no screenshots of preview features (open question 3).
- **Attribution.** Show "Used with permission from Microsoft." with each screenshot, or at least once on each page that has screenshots, and use the full product name in the caption.
- **Motion.** The 2026-10-06 decision wants motion where it helps. Screenshots must stay still and unedited; motion can only be on our own elements around them.

### 4.3 What must never appear, kept out at capture time
Because blurring or covering is an edit, a screenshot that shows any of these must not be used. Stage the screen so they never appear:
- tenant IDs, subscription IDs and names, object IDs, application (client) IDs, environment IDs and environment URLs (for example `orgxxxx.crm.dynamics.com`);
- secrets, keys, tokens, SAS URLs and connection strings;
- email addresses, user principal names, display names of real people, profile photos;
- tenant, organisation or domain names that point to a real organisation;
- customer data, real business data, real file names, chat or notification pop-ups;
- **anything about the Government of Saskatchewan** (names, projects, screens, data), which `CLAUDE.md` forbids in public content.

How to stage it:
- Use only a dedicated test tenant (for example a free developer environment), never a work tenant. The product owner signs in; the agent never handles credentials (2026-10-06 decision).
- Give the tenant, environments, users and resources neutral made-up names. Use made-up data.
- Use a clean browser profile, full-screen or app-area capture, and no other windows.
- Prefer screens without IDs. Some Azure portal pages (for example a subscription's Overview) always show IDs; describe those in text or draw them.
- Before publishing, a second person checks each screenshot against this list. The image file is never edited, so a failed check means a new capture.

### 4.4 Paid product pages and component pages
- Screenshots are allowed in advertising under the same conditions [3]. But section 1.2 says a product listing should be free of Microsoft brand assets unless licensed, and its example of an approved listing has no Microsoft content in its images [1].
- The 2026-10-08 decision already makes component previews interactive web replicas built by us, not screenshots. That fits these terms well.

---

## 5. How comparable independent sites handle it

Seen on home pages on 2026-10-09. This describes what each site shows. It says nothing about what licences or agreements they may hold.

| Site | Type | Microsoft product icons seen | Microsoft notice seen |
|---|---|---|---|
| Matthew Devaney [19] | Power Platform blog | Text-only menu. Post cards are video-style thumbnails with the Copilot Studio icon, the author's photo and large title text. | None found |
| Reza Dorrani [20] | Power Platform blog and videos | Thumbnails with product icons (a Dataverse post shows the Dataverse icon under large title text). | Own copyright line only |
| SharePains [21] | Power Platform and SharePoint blog | A post image whose alt text describes a graphic of the SharePoint logo. A Microsoft MVP badge. | "All rights reserved" only |
| Tomasz Poszytek [22] | Power Automate blog | Own logo and an MVP badge. No product icons on the home page. | None found |
| Lisa Crosbie [23] | Power Platform videos and blog | No product icons on the home page. | None found |
| SQLBI [24] | Power BI training and tools (paid courses) | Own logo and own tool logo. No Microsoft product icons on the home page. | States its own trademark only |
| RADACAD [25] | Power BI training and consulting | No product icons on the home page; photos and customer logos. | Own copyright line only |
| PowerApps911 [26] | Consultancy and training | Small product icons (Power Apps, Power Automate, Power BI, Power Pages, Copilot Studio, Copilot, SharePoint, Dataverse, Fabric) beside items in a "Supported technologies" menu, and larger ones in a "Products we support" block. | Own copyright line only |
| Collab365 [27] | Paid Microsoft 365 and Power Platform courses | Course cards use the site's own illustrations, not product icons. | None found |
| Enterprise DNA [28] | Paid data and AI training | A technology strip with single-colour brand glyphs for Power BI (yellow) and Azure (black), in the style of community icon packs, next to other vendors' marks. | Own copyright line only |
| Build5Nines [29] | Azure blog and books | Featured images with a mark like the Azure icon and mock interface art; book covers. | Own copyright line only |

**Patterns:**
- Personal and MVP blogs often put product icons on video-style thumbnails. Few use them in navigation.
- One consultancy uses them in its menu. Firms like this may hold partner agreements we can't see.
- Paid training sites split: some use their own art, others use vendor logo strips.
- Almost none show a Microsoft trademark notice or an independence line. Our footer already does better.
- **Microsoft has acted against redrawn icons.** In June 2024 Microsoft's legal team told Simple Icons that the only Microsoft icons it could include were those from the official Learn icon pages (Power Platform, Dynamics 365, Microsoft 365, Azure), without edits [17]. Simple Icons 13.0.0 (30 June 2024) removed 54 Microsoft-related icons, including Power Apps, Power Automate, Power BI, Power Pages, Power Fx, Dataverse and Microsoft Azure [18]. Single-colour redraws like the ones in some logo strips are exactly what was removed.

**Lesson:** common practice is not permission. Our trust advantage is being visibly careful and independent, not looking like Microsoft.

---

## 6. Recommendation for LowCodeStacks, by surface

**Key:** Allowed = fine under Microsoft's published terms. With conditions = allowed only if every listed condition holds. Avoid = not covered by any published permission; would need Microsoft's written permission.

| Surface | Official icons or logos | Screenshots | Recommendation |
|---|---|---|---|
| Header mega menu | Avoid | Not relevant | Text names, as now. Any glyph is our own and must not look like a Microsoft icon. |
| Technology hub headers | Avoid | Avoid in the header | Product name as text with our own art. A real diagram lower on the hub may use official icons (see guide bodies). |
| Guide, lesson and update cards | Avoid | Avoid | A text technology tag and our own art. |
| Home page "technologies we cover" | Avoid | Avoid | Text links. No logo wall. |
| Guide and lesson bodies: diagrams | With conditions | Not relevant | Official icons allowed in real explanatory diagrams. |
| Guide and lesson bodies: step-by-step | Inline UI icons with conditions; words preferred | With conditions | Our own clean screenshots, unedited, steps written beside them. |
| Component library pages | Avoid | Avoid (web replicas, as decided) | Truthful, evidence-backed text only ("paste-tested in Power Apps Studio, version, date"). |
| Social share images (`/og`) | Avoid | Avoid | Generated text cards, as now, with the LowCodeStacks mark clearly visible. |
| Paid product pages | Avoid | Avoid for now (own replica imagery instead) | Text compatibility facts with recorded evidence. "Microsoft" before the product name on first mention. |
| Emails and newsletters | Avoid | Avoid | Marketing. Text only. |
| Microsoft corporate logo (four squares) | Avoid everywhere | Not relevant | Needs a formal licence [4]. |

### 6.1 Header mega menu: avoid
- Not a diagram, training material or documentation. Icons there are design elements and wayfinding [3][5].
- Next to our logo, a row of Microsoft icons makes the site look like a Microsoft property, which works against the independence line.
- Keep product names as text. They are allowed as references [1].
- If the product owner still wants icons here, ask Microsoft in writing first (section 8.3). Don't ship on silence.

### 6.2 Technology hub headers: avoid; diagrams on the hub are allowed with conditions
- A banner icon is decoration, not "showing how products work together".
- A hub can still show real Microsoft visuals in a legitimate way: an "at a glance" architecture diagram in the page body (for example, Power Apps reading from Dataverse and calling a Power Automate flow), drawn with the official icons and labelled. That is squarely documentation use.

### 6.3 Guide, lesson and update cards: avoid
- Listing and promotion, so decorative use. Keep our own art and a text tag. Thumbnails like the ones on many blogs are the riskiest pattern for a site that also sells.

### 6.4 Guide and lesson bodies: allowed with conditions
**Diagrams with official icons** (needs the 2026-10-06 "own glyphs only" rule changed, section 7):
- Download from the official Learn pages only [6]–[11]. Never redraw, trace, recolour or use a single-colour version.
- No cropping, flipping, rotating, stretching, shadows or outlines. Keep the shape and colours.
- Label each icon with the product's name next to it.
- Use icons to show how products work together, not as decoration or headings.
- Keep icons still. Motion may highlight connectors or steps, but never move, fade or reshape the icon itself.
- Replace icons when Microsoft updates them (Power Platform icons were updated in October and December 2025).
- Never on our own products, and never in the marketing parts of paid pages.
- Keep a list of every page that uses official icons, so they can be swapped or removed quickly.
- Alt text names the products and the relationship, as the 2026-10-06 accessibility rule already requires.

**Inline references to on-screen buttons:** prefer words ("select **+ New**"). If an icon helps, it must be shown exactly as in the product and only where it means what it does there [3].

**Screenshots:** follow all of section 4. In short:
- our own captures of released (generally available) features, from a staged test tenant;
- resized only, never cropped, marked up or blurred;
- no browser chrome, no third-party content, no real people, no IDs, no secrets, no customer or Government of Saskatchewan data;
- numbered steps and the date beside the image, in text;
- the caption uses the full product name and "Used with permission from Microsoft.";
- alt text plus the steps written in the text.

### 6.5 Component library pages: avoid icons and screenshots
- A Power Apps icon next to our component would make Microsoft's icon stand for our product, which every icon page forbids.
- Keep the interactive web replica and our own card art (2026-10-08 decisions).
- Compatibility wording only with recorded evidence, per `CLAUDE.md`: for example "Paste-tested in Power Apps Studio on 2026-10-09 (Studio version x)". Never "official", "certified" or "Microsoft-approved".

### 6.6 Social share images: avoid
- They appear in feeds and promote our pages. That is promotion, not documentation, and Entra's terms rule out marketing outright [8].
- Keep today's generated text cards. Product names as plain text in the title are fine, with our mark clearly visible.

### 6.7 Paid product pages: avoid icons and logos; no Microsoft screenshots for now
- Advertising needs Microsoft's prior permission for icons and logos [3]. Listings should be free of Microsoft brand assets unless licensed [1].
- Show our own product with our own imagery (replicas, our own drawings).
- If a screenshot of our asset running in Power Apps is ever wanted, decide it explicitly (open question 7). It would need all of section 4's conditions.
- Text: "Microsoft Power Apps" on first mention [5], then "Power Apps". Compatibility facts only with recorded evidence (`CLAUDE.md`; every paid asset needs compatibility metadata).

### 6.8 Notice text to add
**Footer (proposed; replaces the current sentence):**

> © 2026 LowCodeStacks. LowCodeStacks is an independent publication. It is not affiliated with, endorsed, sponsored, approved or certified by Microsoft. Microsoft, Azure, Copilot Studio, Dataverse, Power Apps, Power Automate, Power BI and Power Pages are trademarks of the Microsoft group of companies. All other trademarks are the property of their respective owners.

Changes from today's footer:
- the marks after "Microsoft" are in alphabetical order, as Microsoft suggests [1];
- "All other trademarks are the property of their respective owners." is added, as the publications guideline requires when a trademark footnote is used [2];
- "independent publication" and "sponsored, approved" follow the publications guideline's disclaimer [2]. "Certified" stays, from our own rule.
- When Entra, Fabric or other products get sections, add their names to the list.

**About and Terms pages:** their trademark sentence lists the Power Platform products but not Azure, while the footer now includes Azure (`apps/web/lib/legal/pages.ts`). Align them with the footer when this is decided.

**Screenshot caption (each screenshot):**

> Microsoft Power Apps, Power Apps Studio, 9 October 2026. Used with permission from Microsoft.

**Diagram caption (when official icons are used; optional, for transparency):**

> Product icons: Microsoft's official icon set, shown unchanged.

### 6.9 Ways to look trustworthy without logos
- Real, dated screenshots in step-by-step guides (allowed).
- Official icons inside real architecture diagrams (allowed).
- "Checked against Microsoft Learn on (date)" with links, as the How we write page describes.
- "Paste-tested in Power Apps Studio (version, date)" on components, in our own design.
- The visible independence line. Honesty is a trust signal.
- Our own glyphs should stay clearly ours. Don't mimic Microsoft icon shapes, gradients or product colour schemes, because Microsoft counts trade dress and designs as brand assets too [1].

---

## 7. Existing decisions this touches

| Decision (`docs/final-decisions.md`) | What it says now | What would need the product owner to change it |
|---|---|---|
| 2026-10-06 "Article visuals", diagrams | "We use only our own glyphs, never Microsoft product logos or icons." | Allowing official icons in guide and lesson diagrams (6.4). Without a change, official icons stay out everywhere, which is also safe. |
| 2026-10-06 "Article visuals", screenshots | Each screenshot is cropped, given numbered callouts and labelled with the date. Microsoft's rules must be checked and recorded before the first one is published. | Replace "cropped, given numbered callouts" with "resized only; callouts and date beside the image, in text". Record the outcome of this check in `docs/final-decisions.md`, as that decision requires. Note that story MVP-041 (article visuals) is built to this rule. |
| 2026-10-06 "Article visuals", motion | Motion where it helps understanding. | Add: screenshots and official icons never move or change; motion stays on our own elements. |
| 2026-10-08 "Component library: learning from MIT-licensed samples" | Icons stay our own glyphs ("own glyphs only" rule). | No change recommended. |
| 2026-10-08 "Power Apps component library", item 8 | Previews are interactive web replicas, not screenshots. | No change recommended; it fits Microsoft's terms. |
| 2026-10-08 "Reader avatars" | Our own drawing with no product logos. | No change recommended. |
| 2026-09-30 "Design system", footer line | Independence line plus trademark notice on every page. | Proposed wording change (6.8). |
| 2026-10-09 "Top bar: Azure, coming soon" | `/azure` path; Azure in the trademark line; teaser says the site is independent. | No change recommended. |
| PROP-001 (product media and screenshots, still Proposed) | Not yet decided. | Use section 6.7 as input: no Microsoft icons or logos on paid pages, and no Microsoft screenshots there for now. |
| `CLAUDE.md` delivery rules | No Microsoft endorsement, certification, compatibility or security claims without recorded, approved evidence. | Unchanged. Everything here is consistent with it. |

---

## 8. Risks, open questions and when to ask a lawyer

### 8.1 Risks
- **Takedown or a formal complaint.** Microsoft has acted against icon misuse (Simple Icons, 2024). A complaint could also reach our host as a takedown notice, which could take pages offline.
- **Implied affiliation.** Product icons in our menu, hubs and cards would make the site look official. That undercuts the independence line, which is part of our trust story.
- **Paid products raise the stakes.** Anything near a price is advertising. Microsoft's terms are strictest there.
- **Edited screenshots.** Cropping, callouts, blur and highlights all break Microsoft's conditions. So does capturing browser chrome or a real person's name or photo.
- **Leaking sensitive details.** Since screenshots can't be edited, a careless capture can't be fixed, only replaced. IDs, emails and Government of Saskatchewan data would also break `CLAUDE.md`.
- **Preview features.** Many Copilot Studio and Power Apps features start in preview. Screenshots of them may fall under the "beta or unreleased" ban.
- **Churn.** Microsoft redraws icons and renames products often (Copilot Studio icons changed twice in 2025). Old icons make guides look stale, so swapping must be easy.
- **Revocation.** All permissions can be changed or withdrawn at any time. Keep a register of pages with official icons or screenshots.

### 8.2 Open questions for the product owner
1. Allow official icons inside guide and lesson diagrams (changing the "own glyphs only" rule for diagrams only)? Recommended: yes, with the 6.4 conditions.
2. Change the screenshot rule from "cropped with numbered callouts" to "resized only, callouts and date beside the image"? Recommended: yes, it is required to use Microsoft's permission.
3. Screenshots of preview features: never, or only after asking Microsoft? Recommended: never, until answered.
4. Where does "Used with permission from Microsoft." go: in each caption (recommended) or once per page?
5. Adopt the proposed footer wording (6.8), and align the About and Terms pages with it?
6. Ask Microsoft in writing for permission to use product icons in the menu and hub headers, or drop the idea? Recommended: drop it, unless the product owner feels strongly; then ask first.
7. Paid product pages: keep Microsoft screenshots out completely (recommended for now), or allow a screenshot of our asset running in Power Apps under section 4's conditions?
8. Approve downloading the official icon ZIP files so their bundled terms (Entra terms of use and branding playbook, Dynamics FAQ) can be read and recorded before any icon is used?

### 8.3 If the product owner wants icons beyond diagrams
- Email trademarks@microsoft.com [1]. Describe the site, its independence, each surface with a mock-up, that the icons would be unchanged, and the notices shown.
- Use icons there only after a **written** yes, and keep that permission on file (for example as an ADR or in `docs/final-decisions.md`).
- No reply is not permission.

### 8.4 When to ask a lawyer
- Before any use of Microsoft icons or logos outside the published permissions, even with a Microsoft email that seems to allow it, so its scope is read correctly.
- Before launching paid products whose pages show any Microsoft imagery or make compatibility claims.
- If Microsoft or anyone else sends a complaint, takedown or cease-and-desist.
- If relying on fair dealing (Canada) or fair use (US) instead of Microsoft's permissions. These defences depend on the facts and are not a substitute for the published terms.
- Alongside the planned trademark clearance for "LowCodeStacks" (open question 1).

---

## Sources

1. Microsoft. *Microsoft Trademark and Brand Guidelines.* https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks (read 2026-10-09)
2. Microsoft. *Publications, seminars, and conferences guidelines.* https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/publications (via https://aka.ms/trademarks-publications; read 2026-10-09)
3. Microsoft. *Use of Microsoft copyrighted content* (permissions: screenshots, icons, logos, box shots). https://www.microsoft.com/en-us/legal/intellectualproperty/copyright/permissions (read 2026-10-09)
4. Microsoft. *Microsoft logo third party usage guidance* (August 2025, PDF). https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/mscle/documents/legal/intellectualproperty/trademarks/Microsoft_logo_third_party_usage_guidance_.pdf (read 2026-10-09)
5. Microsoft. *Microsoft 365 trademark guidelines* (dated 1 September 2026, PDF). https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/mscle/documents/presentations/FY27_Microsft_365_Trademark_Guidelines.pdf (read 2026-10-09)
6. Microsoft Learn. *Microsoft Power Platform icons.* https://learn.microsoft.com/en-us/power-platform/guidance/icons (read 2026-10-09)
7. Microsoft Learn. *Download Azure icons to use in architecture diagrams and documentation.* https://learn.microsoft.com/en-us/azure/architecture/icons/ (read 2026-10-09)
8. Microsoft Learn. *Microsoft Entra architecture icons.* https://learn.microsoft.com/en-us/entra/architecture/architecture-icons (read 2026-10-09)
9. Microsoft Learn. *Microsoft Fabric product, workload, and item icons.* https://learn.microsoft.com/en-us/fabric/fundamentals/icons (read 2026-10-09)
10. Microsoft Learn. *Microsoft 365 architecture templates and icons.* https://learn.microsoft.com/en-us/microsoft-365/solutions/architecture-icons-templates (read 2026-10-09)
11. Microsoft Learn. *Microsoft Dynamics 365 icons.* https://learn.microsoft.com/en-us/dynamics365/get-started/icons (read 2026-10-09)
12. Microsoft Learn. *Architecture design diagrams* (Azure Well-Architected Framework). https://learn.microsoft.com/en-us/azure/well-architected/architect-role/design-diagrams (read 2026-10-09)
13. npm. *@fabric-msft/svg-icons* (registry metadata: MIT; for Fabric extension development). https://www.npmjs.com/package/@fabric-msft/svg-icons (read 2026-10-09)
14. Microsoft. *Microsoft Fabric Assets License Agreement* (November 2019; Fluent UI assets). https://aka.ms/fluentui-assets-license, resolving to https://res-1.cdn.office.net/files/fabric/assets/microsoft_fabric_assets_license_agreement_nov_2019.pdf (read 2026-10-09)
15. Microsoft. *Fluent UI System Icons* (MIT). https://github.com/microsoft/fluentui-system-icons (read 2026-10-09)
16. MicrosoftDocs. *powerapps-docs: ThirdPartyNotices and LICENSE* (CC BY 4.0; no trademark rights). https://github.com/MicrosoftDocs/powerapps-docs/blob/main/ThirdPartyNotices (read 2026-10-09)
17. Simple Icons. *Issue #11236, "Removal: All Microsoft Icons"* (June 2024). https://github.com/simple-icons/simple-icons/issues/11236 (read 2026-10-09)
18. Simple Icons. *Release 13.0.0* (30 June 2024; removed-icons list) and *DISCLAIMER.md*. https://github.com/simple-icons/simple-icons/releases/tag/13.0.0 and https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md (read 2026-10-09)
19. Matthew Devaney. Home page. https://www.matthewdevaney.com/ (seen 2026-10-09)
20. Reza Dorrani. Home page. https://www.rezadorrani.com/ (seen 2026-10-09)
21. SharePains. Home page. https://sharepains.com/ (seen 2026-10-09)
22. Tomasz Poszytek. Home page. https://poszytek.eu/en/ (seen 2026-10-09)
23. Lisa Crosbie. Home page. https://www.lisacrosbie.com/ (seen 2026-10-09)
24. SQLBI. Home page. https://www.sqlbi.com/ (seen 2026-10-09)
25. RADACAD. Home page. https://radacad.com/ (seen 2026-10-09)
26. PowerApps911. Home page. https://www.powerapps911.com/ (seen 2026-10-09)
27. Collab365. Home page. https://collab365.com/ (seen 2026-10-09)
28. Enterprise DNA. Home page. https://enterprisedna.co/ (seen 2026-10-09)
29. Build5Nines. Home page. https://build5nines.com/ (seen 2026-10-09)
30. Project files: `CLAUDE.md`; `docs/final-decisions.md` (2026-09-30 design system footer; 2026-10-06 article visuals; 2026-10-08 component library, avatars and MIT samples; 2026-10-09 Azure top bar); `apps/web/app/SiteFooter.tsx`; `apps/web/lib/legal/pages.ts`; `docs/research/power-apps-components/08-licensing-and-trademarks.md`.
