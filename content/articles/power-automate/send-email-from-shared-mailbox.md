---
title: "Power Automate: send email from a shared mailbox, and fix the permission errors"
slug: send-email-from-shared-mailbox
type: TUTORIAL
technology: POWER_AUTOMATE
topic: triggers-and-design
excerpt: "To make Power Automate send email from a shared mailbox, use the shared mailbox action and give the connection's account Send As. Here's the setup, which permission does what, and the fixes for 'You do not have the permission to send the message on behalf of the specified user'."
searchPhrase: "power automate send email from shared mailbox"
---
Notifications from a flow look more trustworthy, and replies reach the whole team, when they come from a **shared mailbox** such as support@ instead of one person. Power Automate can send from a shared mailbox, but only when the right **permission** is in place, and the error when it isn't is confusing.

> [!ANSWER] Quick answer
> 1. [Use the shared mailbox action](#1-pick-the-right-action): **Send an email from a shared mailbox (V2)**, with the mailbox's address typed in **Original Mailbox Address**.
> 2. [Grant Send As](#2-get-the-permission-right): an Exchange admin gives the **connection's account** the **Send As** permission on that mailbox.
> 3. [Still refused?](#3-fix-the-common-errors) Permissions take up to about an hour to apply. Wait, then run the flow again.

> [!NOTE]
> Checked against Microsoft Learn on 8 October 2026.

## 1. Pick the right action

| Action | Sends as | Copy lands in |
| --- | --- | --- |
| **Send an email from a shared mailbox (V2)** | The shared mailbox | The shared mailbox's **Sent Items** |
| **Send an email (V2)** with **From (Send as)** filled in | The shared mailbox | Usually the connection account's own Sent Items |
| **Send an email (V2)** | The connection's own account | The account's Sent Items |

Use **Send an email from a shared mailbox (V2)** when the team should see what was sent. Type the full address, such as `support@contoso.com`, rather than picking it from dynamic content, so the mailbox resolves reliably.

## 2. Get the permission right

The flow sends with its **connection's** account: whoever signed in to the Office 365 Outlook connection, not whoever triggered the flow. That account needs a permission on the shared mailbox, granted by an Exchange admin in the Exchange admin center (**Recipients** > **Mailboxes** > the mailbox > **Delegation**):

| Permission | What it allows |
| --- | --- |
| **Send As** | Send mail that appears to come from the mailbox. **This is the one you need** |
| **Send on Behalf** | Send mail shown as "your name on behalf of Support" |
| **Read and manage (Full Access)** | Open and read the mailbox. Needed for shared mailbox **triggers**, but it doesn't let you send as it |

> [!TIP]
> Use a **service account** for the connection, not a person's account. When a person leaves, their connection breaks and so does every flow on it.

## 3. Fix the common errors

**"You do not have the permission to send the message on behalf of the specified user"**

- The connection's account doesn't have **Send As** yet. Ask an admin to grant it.
- It was granted recently. Microsoft says a new shared mailbox or permission can take about an hour to replicate. Wait, then run the flow again.
- The flow uses a different connection than you think. Open the action and check which account it shows.

**"The specified object was not found in the store" or "Default folder Inbox not found"** (on the trigger **When a new email arrives in a shared mailbox (V2)**)

- The connection's account needs **Full Access** to the mailbox, not just Send As.
- A commonly reported fix: sign in to Outlook on the web as that account and open the shared mailbox once (**Open another mailbox**), then run the flow again.
- If it still fails, delete and recreate the Outlook connection, and select it again in the trigger.

**The email never arrives**

- Check the run history: if the action succeeded, look in the recipient's Junk and Focused folders, and in any Outlook rules.
- Sending lots of mail? The Office 365 Outlook connector allows far more calls than the older **Mail** connector, which is limited to 100 a day.

## 4. Replies and attachments

- **Replies** go to the shared mailbox, so the whole team sees them. To send replies somewhere else, fill in **Reply To**.
- **Attachments**: add them in the action's **Attachments** with a name and the file content. If the flow starts from an email in the shared mailbox, set the trigger's **Include Attachments** to **Yes**, or the content will be empty. See [Files and attachments in flows](/learn/files-and-attachments-in-flows).

## Sources

- Microsoft Learn: [Send an email from a distribution list or shared mailbox](https://learn.microsoft.com/power-automate/email-top-scenarios#send-an-email-from-a-distribution-list-or-shared-mailbox)
- Microsoft Learn: [Troubleshoot common issues with email in flows](https://learn.microsoft.com/power-automate/email-troubleshooting)
- Microsoft Learn: [About shared mailboxes: send permissions error](https://learn.microsoft.com/microsoft-365/admin/email/about-shared-mailboxes#troubleshoot-shared-mailbox-problems)
- Microsoft Learn: [Issues triggering emails with attachments from a shared mailbox](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/issues-triggering-emails-with-attachments-from-shared-mailbox)
- Microsoft Learn: [Office 365 Outlook connector](https://learn.microsoft.com/connectors/office365/)
