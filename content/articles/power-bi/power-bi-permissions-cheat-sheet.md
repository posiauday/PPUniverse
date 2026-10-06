---
title: "Power BI permissions cheat sheet: workspace roles, apps, Read and Build"
slug: power-bi-permissions-cheat-sheet
type: REFERENCE
technology: POWER_BI
topic: security-and-sharing
excerpt: "Who can see, edit, share and build on what. Workspace roles side by side, the four semantic model permissions, how apps and sharing grant access, what RLS does and doesn't restrict, and answers to the questions people ask every week."
searchPhrase: "power bi workspace roles permissions"
---
Power BI access comes from three places: **workspace roles**, **item permissions** (especially on semantic models) and **apps or sharing links**. Most "why can they see that?" and "why can't they see this?" questions come down to how these combine. Look it up here.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Workspace roles

| Can… | Admin | Member | Contributor | Viewer |
| --- | :-: | :-: | :-: | :-: |
| View and interact with content | ✓ | ✓ | ✓ | ✓ |
| Create, edit and delete content | ✓ | ✓ | ✓ | |
| Analyze in Excel, download the PBIX | ✓ | ✓ | ✓ | Only with **Build** on the model (Excel); PBIX no |
| Schedule refresh through a gateway | ✓ | ✓ | ✓ | |
| Publish an app, or change its audiences | ✓ | ✓ | | |
| Update an existing app | ✓ | ✓ | If the admin allows it | |
| Share items and allow resharing | ✓ | ✓ | | |
| Add people | ✓ | As Members or lower roles | | |
| Remove people, change roles, delete the workspace | ✓ | | | |

**Things that surprise people:**
- A **Member can't change** someone's existing role. An Admin has to remove them first, or change the role themselves.
- **Contributors and above edit everything** in the workspace. Edit rights can't be limited to one report by role alone (see the FAQ below).
- Groups work: everyone in a group gets the group's role, and a person in several groups gets the **highest** one.

## Semantic model permissions

| Permission | Lets someone |
| --- | --- |
| **Read** | View reports and use solutions that read the model, including **Explore** |
| **Build** | Create new reports on the model, use **Analyze in Excel**, export the underlying data, query it through XMLA, and see hidden fields |
| **Reshare** | Give others access to the model |
| **Write** | Republish the model, run **Refresh now**, change most settings, and change it through XMLA |
| *Owner* | Everything, plus scheduled refresh, credentials and automatic aggregations. The owner is the person who configured the model last, for example by **taking it over** |

**How people get them:**
- **Workspace role:** Admin, Member and Contributor get Build and Write automatically. **Viewer gets Read**, which is why viewers **can see the semantic models in the workspace list**. That's by design.
- **App audience:** Read, plus Build if you tick it in the audience's advanced settings.
- **Sharing link or direct access:** Read, with optional Build or Reshare.

## Apps: the right way to reach consumers

- **Workspaces are for builders; apps are for consumers.** Publish an app with one or more **audiences**, each seeing only the reports meant for it.
- **New report not showing in the app?** Changes reach the audience only when someone selects **Update app**. Also check the new report is ticked for that audience.
- **Licences:**
  - in a shared (non-Premium) workspace, consumers need **Pro** or **PPU**;
  - on a Fabric capacity **F64 or larger** (or Premium), a **free** licence with Viewer access is enough.
- **Fabric apps** (the newer data apps) changed in **August 2026**: consumers now need only **Read** on the semantic model, not Build. Authors still need Build.

## Row-level security (RLS): who it applies to

- RLS limits data for people with **Read** or **Build**, such as viewers, app consumers and people a report was shared with.
- Anyone with **Write**, so every Admin, Member and Contributor, **sees all the data**. Never test RLS while signed in as a workspace editor. Use **View as → Other user** in Power BI Desktop, or sign in as a real viewer. See [Dynamic row-level security](/learn/dynamic-row-level-security).
- Use the **Viewer** role or an **app** for people whose data must be restricted.

## FAQ

**One person should edit one report, but only view the rest.**
Put that report and its semantic model in a **separate workspace**, give the person **Contributor** there, and leave them as a viewer, or app user, in the original. Roles apply to the whole workspace, so a separate workspace is the clean way.

**Someone can see the workspace but not the gateway connection.**
Gateway access is separate from workspace roles. They need a role on the **gateway connection**. See [Move, upgrade or share a gateway](/learn/move-upgrade-share-a-gateway).

**A disabled account still appears with access.**
Access records stay until the account is **permanently deleted** in Microsoft Entra ID, but a disabled user can't use them.

**Contributor can't change who an app is shared with.**
Publishing and changing audiences needs Member or Admin. An Admin can allow Contributors to *update* the app, but not to change its permissions.

## Sources

- Microsoft Learn: [Roles in workspaces in Power BI](https://learn.microsoft.com/power-bi/collaborate-share/service-roles-new-workspaces)
- Microsoft Learn: [Semantic model permissions](https://learn.microsoft.com/power-bi/connect-data/service-datasets-permissions)
- Microsoft Learn: [Build permission for shared semantic models](https://learn.microsoft.com/power-bi/connect-data/service-datasets-build-permissions)
- Microsoft Learn: [Semantic model permissions and RLS (REST API)](https://learn.microsoft.com/power-bi/developer/embedded/datasets-permissions)
- Microsoft Learn: [Content creator security planning](https://learn.microsoft.com/power-bi/guidance/powerbi-implementation-planning-security-content-creator-planning)
- Microsoft Learn: [End-to-end: distribute through a Power BI app](https://learn.microsoft.com/power-bi/create-reports/tutorial-end-to-end-power-bi#phase-6-distribute-the-content-through-a-power-bi-app)
- Microsoft Learn: [What's new in Power BI: August 2026](https://learn.microsoft.com/power-bi/fundamentals/whats-new)
