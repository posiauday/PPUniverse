---
title: "Dataverse access cheat sheet: privileges, access levels and 'missing privilege' errors"
slug: security-access-cheat-sheet
type: REFERENCE
technology: DATAVERSE
topic: security-model
excerpt: "How Dataverse decides whether someone can see or change a row, what each privilege and access level really grants, and the fix for every common access error, from 'missing privilege' to 'can't open the environment'."
searchPhrase: "dataverse missing privilege error"
---
"It works for me but not for them" is the most common Dataverse support request. Dataverse runs two checks every time someone touches a row, and almost every access error means one of them failed. Once you know which one, the fix is quick.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The two checks

**1. The privilege check: are they allowed to do this to this *kind* of row at all?**

The user needs the privilege, for example **Write** on the Contact table, through a security role assigned to them directly, or to a team they're in. The access level doesn't matter yet; this check only asks "is the privilege there?" If it fails, they get a **missing privilege** error.

**2. The access check: may they do it to *this particular* row?**

Only once the privilege check passes does Dataverse look at the row itself. Access can come from any one of four routes:

| Route | They get access because… |
| --- | --- |
| **Ownership** | They own the row, or a team they belong to owns it |
| **Role access** | Their role's **access level** reaches the row's business unit (table below) |
| **Shared access** | Someone shared the row, or a related row, with them, their team or the whole organization |
| **Hierarchy access** | Hierarchy security is on for that table, and they manage the owner (needs Business Unit or Parent:Child access) |

If the privilege check passes and all four routes fail, the error says they don't have the *access right* for that row, not that a privilege is missing. That difference tells you where to look.

## The eight privileges

| Privilege | Lets them… |
| --- | --- |
| **Create** | Add a new row |
| **Read** | Open and view a row |
| **Write** | Change a row |
| **Delete** | Permanently remove a row |
| **Append** | Attach *this* row to another row (for example attach a note to an opportunity: Append on **Note**) |
| **Append To** | Have other rows attached to *this* row (for example add a note to an opportunity: Append To on **Opportunity**) |
| **Assign** | Give the row to a different owner |
| **Share** | Give someone else access to the row while keeping their own |

> [!TIP]
> Setting a lookup is "attaching". To fill **Account** on a Contact, the user needs **Append** on Contact *and* **Append To** on Account. For many-to-many relationships, they need **Append** on *both* tables. Missing one half is the classic cause of "I can edit the row but can't set that lookup".

## The access levels

Each privilege in a role has an access level. It decides *which* rows the privilege applies to.

| Level | Applies to rows… | Typical for |
| --- | --- | --- |
| **None** | none | |
| **User** | they own, that their teams own, or that are shared with them or their teams | Most users |
| **Business Unit** | owned by anyone in their business unit | Team leads |
| **Parent: Child Business Units** | in their business unit and every unit below it | Managers of a division |
| **Organization** | in the whole environment | Admins, people working across all data |

Each level includes everything above it in this table. Tables owned by the **organization** (rather than by users or teams) only have **None** or **Organization**, and so do the miscellaneous and privacy privileges, such as "Export to Excel".

> [!WARNING]
> Granting Organization-level Read "just to make it work" exposes every row in the table to everyone with that role. Fix the actual gap instead.

## Teams, in one minute

- **Owner teams** can own rows and have security roles. Members get the team's privileges *plus* their own.
- **Access teams** have no roles and own nothing. Rows are shared with them with specific rights (Read, Write, Append and so on).
- **Team roles and a member's own rows** depend on the role's **Member's privilege inheritance** setting. Set to **Team privileges only**, a role with User-level access applies only to rows the *team* owns, so members can't use it on their own rows. If members must create and edit rows they own, give them a role directly, or check that setting.

## Errors and what to do

| What they see | Which check failed | Fix |
| --- | --- | --- |
| "One or more commands are unavailable due to your current privileges for this environment" | Privilege | Add a role with the missing privilege. For solution work, they usually need **Environment Maker** or **System Customizer** |
| "Principal user (Id=…) is missing *prvReadAccount* privilege" (code `-2147220960`) | Privilege | The name says it all: `prv` + action + table. Add **Read** on **Account** to one of their roles |
| "CrmCheckPrivilege failed … on UserId … and Privilege …" (code `-2147220839`) | Privilege | Same fix: find the named privilege and grant it |
| "Principal with id … does not have CreateAccess right(s) for record … " (code `-2147187962`) | Access | The privilege exists but doesn't reach this row. Raise the access level, change the owner, or share the row |
| Can't set a lookup, or the related row doesn't appear in the lookup | Privilege (Append or Append To) | Grant **Append** on the row being edited and **Append To** on the related table |
| The user can't open the environment or app at all | Before both checks | They need a role in the environment, a valid licence, and membership of the environment's security group if it has one |
| A newly licensed or newly added user still can't get in | Before both checks | Licence and group changes take time to sync. An admin can re-add the user to the environment to force the sync |
| A flow or integration fails with a "missing privilege" error | Privilege, for the connection's identity | The account or **application user** the connection runs as needs the role, not the person who built the flow |

## How to find out what someone can see

- **Check Access.** On any row in a model-driven app, select **Check Access**. It shows your own rights on that row and which route gives them. Admins can look up another user, and with two environment settings turned on, see **who has access** to the row and why: direct role, team role, shared or application user.
- **Test as them.** Make a test user with exactly the target roles and sign in as them. Admin accounts pass every check, so testing as yourself proves nothing.

## Start from the right role

- **App Opener:** the minimum needed to run an app. Use it as the base for a custom role.
- **Basic User:** the minimum plus the core business tables.
- **Copy a template, don't start from scratch.** Use **Copy table permissions** to give several custom tables the same settings at once, but remember it overwrites the target tables' settings.

## Sources

- Microsoft Learn: [How access to a record is determined](https://learn.microsoft.com/power-platform/admin/how-record-access-determined)
- Microsoft Learn: [Security roles and privileges](https://learn.microsoft.com/power-platform/admin/security-roles-privileges)
- Microsoft Learn: [Security concepts in Dataverse: ownership and access](https://learn.microsoft.com/power-platform/admin/wp-security-cds)
- Microsoft Learn: [Configure user security: common issues](https://learn.microsoft.com/power-platform/admin/database-security#common-issues)
- Microsoft Learn: [Troubleshoot Dataverse client errors](https://learn.microsoft.com/troubleshoot/power-platform/dataverse/user-permissions/client-errors)
- Microsoft Learn: [Troubleshoot user access problems](https://learn.microsoft.com/troubleshoot/power-platform/dataverse/environment-app-access/troubleshooting-user-needs-read-write-access-organization)
- Microsoft Learn: [Use access teams and owner teams](https://learn.microsoft.com/power-apps/developer/data-platform/use-access-teams-owner-teams-collaborate-share-information)
- Microsoft Learn: [Check user access to a row](https://learn.microsoft.com/power-apps/user/access-checker)
