---
title: "Invite users to a Power Pages site: invitation codes, emails and fixes"
slug: invite-users-to-power-pages
type: TUTORIAL
technology: POWER_PAGES
topic: sign-in-and-identity
excerpt: "Let only the people you choose sign up. Create single or group invitations that assign web roles on redemption, send them, make the site invitation-only so nobody can bypass the code, and fix the usual problems: no email, wrong address, 'email already in use'."
---
Invitations are how you let **specific** people onto a site: partners, members, a pilot group. Each invitation carries a code. When someone redeems it while signing up, their account links to a **contact you prepared**, and they can automatically get **web roles**, an **account**, or a workflow. Here's the full setup and the fixes for when it misbehaves.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## How it fits together

1. You create a **contact** for the person, with their **primary email**.
2. You create an **invitation** for that contact, choosing roles and expiry.
3. The **Send Invitation** workflow emails them a link and a **code**.
4. They open the redemption page, enter the code, and sign up with **any** sign-in method your site offers.
5. Power Pages links the new sign-in to the prepared contact and applies the roles. It also records an **Invite Redemption** activity on both the invitation and the contact.

## Step 1: Create the invitation

Open the site in Power Pages design studio, then select **…** → **Portal Management**.

- **For one person:** go to **Security → Contacts**, open the contact, and select **Create Invitation**.
- **For several at once:** go to **Security → Invitations** and select **+ New**.

The fields that matter:

| Field | Set it to |
| --- | --- |
| **Type** | **Single** (one person, one use) or **Group** (several contacts; set **Maximum Redemptions Allowed**) |
| **Invited Contact(s)** | The prepared contact or contacts |
| **Assign to Web Roles** | The roles they should get, such as *Partner*. On sites with the **enhanced data model**, this field can differ, so check it's on the form |
| **Assign to Account** | Optional: link them to their company's account |
| **Expiry Date** | Optional, but recommended: for example 14 days |
| **Invitation Code** | Generated for you. Change it only if you must |
| **Owner/Sender** | Whoever owns the invitation sends it, so make sure that person can send email |

Select **Save**.

## Step 2: Send it

In the invitation, select **Flow → Send Invitation**, then **OK**. To send many at once, select them in the **New invitations** view and run **Send Invitation** once.

Before the first send, **edit the workflow's email template** so it contains the link to your site's **redeem invitation** page and the code.

> [!WARNING]
> Don't convert the **Send Invitation** workflow to a real-time workflow. Microsoft says this isn't supported and breaks invitations.

## Step 3: Make the site invitation-only

If **open registration** is on, anyone can sign up without a code. To require one, set these **site settings**:

| Site setting | Value |
| --- | --- |
| `Authentication/Registration/Enabled` | `true`: registration must be on for invitations to work |
| `Authentication/Registration/InvitationEnabled` | `true`: shows the code-redemption form |
| `Authentication/Registration/OpenRegistrationEnabled` | `false`: no sign-up without a code |
| `Authentication/Registration/RequiresInvitation` | `true`: turns the invitation requirement on and open registration off |

## Fixes

| Problem | Likely cause and fix |
| --- | --- |
| **No email arrives** | The workflow sends **only** to the contact's **primary email** (`emailaddress1`), never to the secondary or alternate address. Check that field, then the invitation's **owner**: they must be allowed to send email from your environment. If the workflow run shows an error, a quick test is to make yourself the owner and send again |
| **People sign up without a code** | Open registration is still on (step 3) |
| **"Email already in use"** | Another contact already has that email, **including deactivated ones**. Find and merge or clean up the duplicate |
| **Signed in, but no access** | The roles weren't applied, or the page or table permissions don't use those roles. Check the contact's **Web Roles**, and see the [table permissions checklist](/learn/table-permissions-checklist) |
| **Code says it's invalid or used** | It has expired, a **Single** invitation was already redeemed, or a **Group** invitation reached its maximum. Check the invitation's status and redemptions |

## Sources

- Microsoft Learn: [Invite contacts to your Power Pages site](https://learn.microsoft.com/power-pages/security/invite-contacts)
- Microsoft Learn: [Local authentication, registration and other settings](https://learn.microsoft.com/power-pages/security/authentication/set-authentication-identity)
- Microsoft Learn: [Set up site authentication: troubleshooting](https://learn.microsoft.com/power-pages/security/authentication/configure-site#troubleshoot-common-authentication-issues)
- Microsoft Learn: [Configure site settings](https://learn.microsoft.com/power-pages/configure/configure-site-settings#site-settings)
- Microsoft Learn: [Overview of authentication: open registration](https://learn.microsoft.com/power-pages/security/authentication/)
