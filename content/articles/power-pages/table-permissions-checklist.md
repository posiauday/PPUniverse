---
title: "Power Pages data security checklist: table permissions, web roles and sign-in"
slug: table-permissions-checklist
type: REFERENCE
technology: POWER_PAGES
topic: access-and-permissions
excerpt: "A pre-launch and troubleshooting checklist for Power Pages: the access types and privileges in table permissions, the settings that leave data open to anonymous visitors, and the fixes for common sign-in and permission errors."
---
A Power Pages site is the one Power Platform product that faces the open internet, so its mistakes are public. Almost every data leak or "users can't see their records" ticket comes down to table permissions and web roles. Use this checklist before go-live and whenever access looks wrong.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## How access works, in four lines

1. Site users are **contacts** in Dataverse.
2. Contacts get **web roles**. Every signed-in user is automatically in **Authenticated Users**, and every visitor is in **Anonymous Users**.
3. **Table permissions** give web roles rights on a table's rows. A table permission does nothing until it has at least one web role.
4. Lists, forms, Liquid and the Web API only show Dataverse data through table permissions. **Page permissions** separately control who can open a page.

## Access types: which rows a permission covers

| Access type | Covers |
| --- | --- |
| **Global** | Every row in the table |
| **Contact** | Rows related to the signed-in user's contact record, through a relationship you choose |
| **Account** | Rows related to the signed-in user's account (their company), through a relationship you choose |
| **Self** | Only the user's own contact record, for "edit my profile" |
| **Parent** (as child permissions) | Rows related to rows the user can already reach through the parent permission. In the design studio, add a **child permission** to the parent instead of choosing Parent |
| **Custom** (preview, sites with enhanced authorization) | Rows matching a FetchXML filter you write; only the filter is used |

**Privileges** on each permission: **Read**, **Write**, **Create**, **Delete**, **Append** and **Append To**. Append and Append To work as a pair: to link a note to a case, the user needs Append on the note *and* Append To on the case.

> [!TIP]
> Start from **Contact** or **Account** access, and add **child permissions** for related tables. Use **Global** only for genuinely public reference data, such as a product catalogue, and never with Write, Create or Delete.

## Pre-launch checklist

Work through every item before switching the site to public.

**Anonymous access**
- **Check the Anonymous Users role.** For every table permission it has, ask: "Is it fine for the whole internet to read this?" The design studio warns when a public site shows data to anonymous users, so take that warning seriously.
- **Check every list and form has "Enable table permissions" turned on.** With it off, the component skips table permissions completely. That's handy in a dev site and dangerous anywhere else. This includes **each step** of every multistep form; the Site Checker doesn't list multistep form steps, so check them by hand.
- **Check list OData feeds.** A feed on an unsecured list, or on a table that Anonymous Users can read, publishes that data as a machine-readable feed.

**Roles and permissions**
- **Every table permission has a web role.** Without one it does nothing, and the studio won't let you save it.
- **Child permissions only use roles their parent has.** Otherwise you'll see *"One or more roles applied to this permission aren't available to its parent table permission."* Add the role to the parent, or remove it from the child.
- **Keep web roles to a sensible number.** Microsoft's Site Checker flags performance problems above **100** web roles.

**Pages**
- **One active page permission per page.** Several conflicting rules give *"There are multiple, conflicting access control rules applied to this page."* Deactivate the extras.
- **Don't put Anonymous Users directly on a page permission.** It triggers an alert in the Portal Management app.
- **Watch the home page's Grant Change rule.** It takes precedence over Restrict Read rules, so admins with Grant Change on the home page (scope "All content") can open every page.

**Sign-in**
- **Invitation-only sites:** turn off open registration and set `Authentication/Registration/RequiresInvitation` to `true`. With open registration on, people can register without a code.
- **Every contact has a unique email,** including deactivated contacts. Duplicates stop those users signing in.

**Last step:** run the **Site Checker** and fix everything it reports. Treat its findings as blocking.

## Errors and fixes

| What happens | Likely cause | Fix |
| --- | --- | --- |
| Signed-in users see an empty list | No table permission gives their web role Read, or the relationship in a Contact/Account permission doesn't link to their rows | Add or fix the permission; check the relationship points to the right lookup |
| A form shows but won't save | Missing **Write** or **Create**, or **Append** / **Append To** for a lookup on the form | Add the missing privilege to the permission (and child permission) |
| Everyone can see everything | **Global** access on a broad role, or **Anonymous Users** on the permission, or "Enable table permissions" off on the component | Narrow the access type, remove Anonymous, turn table permissions on |
| "Email already in use" when registering | Another contact, possibly a deactivated one, has the same email | Find and merge or clean up the duplicate contacts |
| "Invalid sign-in attempt" | Wrong credentials, a locked-out account, or a deactivated contact | Check the contact's status and the lockout settings |
| AADSTS700016 (application not found) | The Entra ID app registration doesn't match the site's settings, often after recreating a site | Check the Client ID and authority URL, and set the identity provider up again |
| Local sign-in jumps straight to a Microsoft login | A default identity provider is set | Remove the default provider, or review `Authentication/Registration/LoginButtonAuthenticationType` |
| Anonymous and signed-in users see different versions of a page | Anonymous pages can be served from the CDN cache; signed-in pages never are | Check page permissions and the CDN settings |

## Sources

- Microsoft Learn: [Power Pages security overview](https://learn.microsoft.com/power-pages/security/power-pages-security)
- Microsoft Learn: [Configure table permissions](https://learn.microsoft.com/power-pages/security/table-permissions)
- Microsoft Learn: [Assign table permissions](https://learn.microsoft.com/power-pages/security/assign-table-permissions)
- Microsoft Learn: [Site Checker: configuration issues](https://learn.microsoft.com/power-pages/admin/site-checker-configuration-issues)
- Microsoft Learn: [Site Checker: performance](https://learn.microsoft.com/power-pages/admin/site-checker-performance)
- Microsoft Learn: [Set page permissions](https://learn.microsoft.com/power-pages/security/page-security)
- Microsoft Learn: [Set up site authentication: common issues](https://learn.microsoft.com/power-pages/security/authentication/configure-site)
- Microsoft Learn: [Overview of authentication in Power Pages](https://learn.microsoft.com/power-pages/security/authentication/)
