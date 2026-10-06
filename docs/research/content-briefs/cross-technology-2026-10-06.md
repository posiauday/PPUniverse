# Content brief: Power BI, Power Pages, Copilot Studio, Power Apps (2026-10-06)

**Status:** all 12 proposed titles **approved** by the product owner on 2026-10-06 (multiple choice: every option selected in each group). The approval is recorded in `docs/final-decisions.md`, "Content plan targets and order (2026-10-06)". Method as set out in that entry.

## Method
- **Demand:** threads with a **verified or accepted answer**, read on 2026-10-06 from:
  - the Power Platform Community forums: Copilot Studio (26 answered of 100), Power Apps (14 of 86), Power Pages (9 of 80);
  - the Microsoft Fabric Community, Power BI Service and Desktop "Solutions" tabs (about 110 solved threads, asked 8 Sep to 5 Oct 2026).

  We read these pages only. Themes are paraphrased. No text is copied and no usernames are recorded.
- **Verification:** every theme below was checked against Microsoft Learn on 2026-10-06; the source is listed beside it. An accepted answer is evidence of *demand*, not of *correctness*.
- **Official changes:** Learn "What's new" pages for Power BI (August 2026), Copilot Studio (September 2026), the Power Pages and Power Apps release plans, "Important changes coming", and the gateway sign-in notice.

## Power BI

| Theme (accepted answer, date) | Verified on Learn | Proposed title | Kind | Pri |
| --- | --- | --- | --- | --- |
| Users can't see the gateway or its connections after a migration; moving a gateway to new servers (Sep 21–25) | Gateway and connection roles are separate; add a member with **Add to an existing cluster** and the recovery key (`data-integration/gateway/manage-security-roles`, `service-gateway-install`) | Move, upgrade or share an on-premises data gateway without breaking refresh | TUTORIAL | P1 |
| Viewer sees semantic models; edit rights for one report only; app doesn't show a new report (Sep 11–25) | Fabric app consumers now need only **Read**, not Build (August 2026 what's new) | Power BI permissions cheat sheet: workspace roles, apps, Build and Read | REFERENCE | P1 |
| Retry a failed refresh automatically; table-level refresh (Sep 19) | Enhanced refresh `retryCount`, 24-hour total limit (`power-bi/connect-data/asynchronous-refresh`); new **Refresh data only / Sync schema only** and table-level options (August 2026) | Refresh on your terms: table-level refresh, retries and refreshing from Power Automate | TUTORIAL | P1 |
| RLS filters on the wrong table (Sep 18) | — check before drafting | Dynamic row-level security with USERPRINCIPALNAME that actually filters | PATTERN | P2 |
| Proving incremental refresh only loads the recent window (Sep 24) | — check before drafting | Incremental refresh: set it up and prove it's working | TUTORIAL | P2 |

The existing pages "Refresh failed" and "Why are my totals wrong?" already cover the credentials and totals themes. Add links to them; don't write new pages.

## Power Pages

| Theme | Verified on Learn | Proposed title | Kind | Pri |
| --- | --- | --- | --- | --- |
| How authenticated users are counted and billed (Oct 3) | Unique users per website per calendar month, keyed on the Contact ID; per-user Power Apps and Dynamics 365 users aren't counted; trial and private sites aren't metered (licensing FAQ, pay-as-you-go meters) | Power Pages licensing explained: who counts as an authenticated or anonymous user | REFERENCE | P1 |
| Invitation codes for first-time users; invitation email fails (Jul–Sep) | Single and group invitations; sent only to `emailaddress1`; don't convert the send-invitation workflow to real-time (`power-pages/security/invite-contacts`) | Invite users to a Power Pages site: invitation codes, emails and fixes | TUTORIAL | P1 |
| Web role assigned but table permissions ignored (Sep 18) | Covered by the existing checklist. Add the "same website" check if it's missing | (update the existing page) | — | — |
| Web API ETag/412 not honoured (Sep) | Power Pages Web API is a subset of the Dataverse Web API; check its error list before drafting | Power Pages Web API cheat sheet | REFERENCE | P2 |

## Copilot Studio

| Theme | Verified on Learn | Proposed title | Kind | Pri |
| --- | --- | --- | --- | --- |
| Do people chatting with a published agent need a licence? | "Users of your agents don't need a special license" (`requirements-licensing`); test chat isn't billed; unused credits don't carry over (billing FAQ) | Copilot Studio licensing and Copilot Credits: who needs what, and what gets billed | REFERENCE | P1 |
| SharePoint answers work for owners but not visitors | Security trimming; Restricted SharePoint Search; encrypted labels; lists need Dataverse search (`troubleshoot/.../knowledge/sharepoint-no-response`) | Already covered by "Copilot Studio knowledge: limits…". Add the list rules (Dataverse search, 35,000 rows, 10 lists) | — | — |
| New in September 2026: Dataverse tables as knowledge; Word, Excel and PowerPoint attachments now GA | Copilot Studio what's new (September 2026) | Ground an agent in Dataverse tables | TUTORIAL | P2 |

## Power Apps

| Theme | Verified on Learn | Proposed title | Kind | Pri |
| --- | --- | --- | --- | --- |
| Save attachments and photos from an app to a SharePoint library | — check before drafting | Save Power Apps attachments and photos to a SharePoint library | TUTORIAL | P1 |
| Past 2,000 records: load collections in ID ranges | Overlaps the two existing delegation pages. Add a section, not a new page | (update the existing page) | — | — |
| "Database capacity" email from an environment nobody provisioned | — check before drafting | Why did I get a Dataverse capacity email? | TUTORIAL | P2 |

## Official changes to draft (`content/updates/`)
- **Drafted on this branch:**
  - `on-premises-gateway-sign-in-update` (enforcement complete 31 Aug 2026);
  - `power-bi-desktop-old-file-picker-retired` (October 2026).
- **Already drafted:** mobile app retired, help chatbot removed, grids deprecated, classic look removed.
- **Candidates, not yet drafted:**
  - Dataverse audit events to Purview lose before-and-after values (May 2026);
  - the Power Automate for Excel add-in is deprecated (no date given; use the Automate tab);
  - release plans stop in September 2026 and move to the "AI at Work" roadmap;
  - Power Pages: merging web roles with Dataverse security roles (preview 8 Jul 2026, GA planned Nov 2026);
  - Fabric apps need Read instead of Build (August 2026).

## Next
After approval: draft the P1 titles. Each fact is checked against Learn on the day it's written, and every page gets a "Checked against Microsoft Learn" note.
