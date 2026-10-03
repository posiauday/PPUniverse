---
title: "Security roles, business units and teams without the tangle"
slug: security-roles-business-units-teams
type: PATTERN
technology: DATAVERSE
topic: security-model
excerpt: "Dataverse security is powerful and easy to get into a knot. A pattern for roles, business units and teams that gives each person exactly the access they need, stays readable as the organisation grows, and avoids the one mistake you can't undo."
---
Dataverse security is a set of simple parts: privileges, access levels, roles, business units and teams. The tangle comes from combining them without a plan: a role per person, business units copied from the org chart, teams created ad hoc, and records shared by hand until nobody can say who sees what.

This pattern keeps it untangled. It starts from one rule that shapes everything else.

## The rule: access only adds up

All Dataverse privileges are **cumulative**, and the greatest access wins. If any role a user holds, directly or through a team, grants organization-wide read on contacts, there is no way to hide one contact from them with another role.

So design security as "grant the minimum, then add", never as "grant broadly, then take away".

## The parts in one minute

- **Privileges:** Create, Read, Write, Delete, Append, Append To, Assign and Share, set per table.
- **Access levels:** how far each privilege reaches:
  - **User:** rows they own or that are shared with them or their teams.
  - **Business Unit:** rows owned in their business unit.
  - **Parent: Child Business Unit:** their business unit and everything below it.
  - **Organization:** everything.
- **Security roles:** sets of privileges with access levels.
- **Business units:** containers that rows and users belong to, arranged in a hierarchy.
- **Teams:**
  - **Owner teams** can own rows and hold security roles.
  - **Access teams** hold no roles. Rows are shared with them, granting rights such as Read or Write on those rows.

## Step 1: design roles around jobs, not people

Create a small number of roles, each matching a job: *Loan Desk*, *Equipment Manager*, *Auditor*. Start from Microsoft's minimal predefined roles rather than from scratch. **Basic User** gives the core privileges most app users need, and **App Opener** has the minimum privileges to run an app. Copy one, then add only what the job needs.

Give each role a name and description that say who it's for. A user's access is then explained by a short list of job roles, not by a unique pile of permissions.

## Step 2: use business units for real boundaries only

Business units are for **data boundaries**: groups whose records must be separated, such as regions, subsidiaries or departments with confidential data. They're not a copy of the org chart.

- If everyone can see everyone's records, you may need just the root business unit.
- If regions must not see each other's records, create one business unit per region and grant roles at **Business Unit** level.

> [!TIP]
> Every extra business unit is something to maintain: roles assigned in it, users moved between units, records reassigned when people change jobs. Add one only when you can name the data it keeps apart.

## Step 3: let people work across units the modern way

Traditionally, a user belonged to one business unit, and cross-unit access meant owner teams in each unit. With **record ownership across business units**, the matrix data access structure, enabled in the Power Platform admin center, you can:

- **Assign roles from several units.** A user can hold security roles from more than one business unit, and gets access to the records each of those units owns.
- **Choose a record's owning unit.** Records carry an **Owning Business Unit** that users with the right privileges can set.
- **Rely on roles, not the user's unit.** Access to records follows the roles, not the user's own business unit.

That makes cross-unit roles, such as a manager overseeing two regions, a role assignment instead of a team workaround. Turn it on deliberately and early: it changes how ownership and access are calculated across the environment.

## Step 4: manage membership through Microsoft Entra groups

Don't assign roles to individuals one at a time. Instead:

1. Create a Microsoft Entra security group per job, such as "Loan Desk – North".
2. Create a Dataverse **group team** linked to that group.
3. Assign the security role, from the right business unit, to the group team.

Adding someone to the Entra group then gives them the right access the next time they sign in, and removing them takes it away. Your identity team can manage access without opening Dataverse. Microsoft's security guidance recommends exactly this for environment access and role assignment.

## Step 5: use access teams for record-by-record collaboration

When the people who need a specific record can't be predicted in advance, such as the reviewers of one case or the people on one project, use **access teams**. The record is shared with the team with specific rights, and team members get those rights on that record only.

Remember that access teams don't grant the right to **create** records. Members still need a role that includes Create.

## Step 6: protect sensitive columns separately

Row access and column access are separate. If some columns, such as salary or a medical note, must be hidden from people who can otherwise read the row, use **field-level security** on those columns. Also keep sensitive data out of **primary name** columns: anyone who can read a row with a lookup sees the related row's primary name.

## Checklist

- Roles match jobs, start from Basic User or App Opener, and grant the minimum.
- No role grants Organization-level access unless the job truly needs it.
- Business units exist only where data must be separated.
- Cross-unit access uses record ownership across business units, not team workarounds.
- Role membership is managed through Microsoft Entra group teams.
- Access teams handle record-by-record collaboration.
- Sensitive columns use field-level security, and primary names contain nothing sensitive.

The pattern follows Microsoft's documented Dataverse security model. The order of steps and the role-design advice are our own recommendations.

## Sources

- [Security concepts in Microsoft Dataverse (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/wp-security-cds)
- [Security roles and privileges (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/security-roles-privileges)
- [Modernized business units security (Microsoft Learn)](https://learn.microsoft.com/power-platform/admin/modernized-business-units-security)
- [Use access teams and owner teams to collaborate and share information (Microsoft Learn)](https://learn.microsoft.com/power-apps/developer/data-platform/use-access-teams-owner-teams-collaborate-share-information)
- [Secure your Copilot Studio projects: Entra ID groups and group teams (Microsoft Learn)](https://learn.microsoft.com/microsoft-copilot-studio/guidance/sec-gov-phase3)
