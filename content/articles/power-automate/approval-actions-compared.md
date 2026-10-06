---
title: "Approval actions compared: start and wait, create plus wait, types, sequential and parallel"
slug: approval-actions-compared
type: REFERENCE
technology: POWER_AUTOMATE
topic: approvals
excerpt: "Which approval action and approval type to use, what each one waits for, what outputs you get, and the limits that trip people up: attachments, Markdown in Teams, the same approver twice, and flows stuck between create and wait."
searchPhrase: "start and wait for an approval"
---
Power Automate gives you three approval actions, including the familiar **Start and wait for an approval**, and five approval types. Picking the right pair decides when your flow continues, what data you get back, and whether you can add reminders or Teams cards. Use this page to look it up; for deadlines and escalation, see [Approvals that don't stall](/learn/approvals-that-dont-stall).

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The three actions

| | **Start and wait for an approval** | **Create an approval** + **Wait for an approval** |
| --- | --- | --- |
| What it does | Creates the approval, notifies approvers, and pauses the flow until it's finished or times out | **Create** sends it and the flow carries on; **Wait** pauses later until it's finished |
| Responses and comments as outputs | Yes, right after the action | Only from **Wait for an approval** |
| Adaptive card output you can post to Teams | No | Yes, from **Create an approval** |
| Steps between sending and waiting | Not possible | Yes: log the request, post Teams cards, send reminders |
| Best for | Simple, single-step approvals | Reminders, custom Teams cards, logging who was asked and when |

> [!WARNING]
> Keep **Create an approval** and **Wait for an approval** close together. If an approver responds before the flow reaches the **Wait** action, the flow can get stuck waiting. Microsoft lists this as a known issue.

## The five approval types

| Type | The flow continues when… | Use it for |
| --- | --- | --- |
| **Approve/Reject – Everyone must approve** | **All** approvers approve, **or one** rejects | Sign-off that needs everyone |
| **Approve/Reject – First to respond** | **Any one** approver responds | A team or shared queue where anyone can decide |
| **Custom Responses – Wait for all responses** | Everyone has picked one of your options | Votes, or choosing among options |
| **Custom Responses – Wait for one response** | Anyone picks one of your options | Choices like "Up to 5% / Up to 10% / Denied" |
| **Sequential Approval** | Each approver in turn has responded, in order | Line manager first, then a director |

**Reading the result:** check the action's **Outcome**. For Approve/Reject types, the values are `Approve` and `Reject`, and **they're case-sensitive** in a condition. With *Everyone must approve*, one rejection makes the whole request rejected.

## Sequential or parallel?

- **Sequential:** use the **Sequential Approval** type, with one **Assigned to** per step. Each step waits for the one before. **You can't use the same approver in two steps.**
- **Parallel:** use **parallel branches** in the flow, each with its own approval action, when different people must decide independently and at the same time. Then combine their outcomes in a condition after the branches.

## Limits that catch people out

| Limit | Detail |
| --- | --- |
| Attachments in the email | Attached until the email reaches **5 MB**. After that, approvers are pointed to the approvals centre in Power Automate |
| Attachments in total | **50 MB** for all attachments on one approval |
| Size of each file | Dataverse's limit, **5 MB by default**. An admin can raise it under **Settings → Email → Email settings** |
| Blocked file types | Dataverse blocks some extensions. An admin manages the list under **Settings → Product → Privacy + Security** |
| File names | Can't contain characters such as `, / \ | ? * < > "` |
| Attachment content | Must be base64. Most file actions already return it; for your own text, use `base64()` |
| Markdown in **Details** | Works in Outlook and Power Automate, but **not in the Approvals app in Teams**. Support varies by client, so test where your approvers actually read it |
| Custom responses + Everyone must approve | Can fail when sent to many people, because the results field gets too large |
| Duplicate users | If an email address matches two accounts in your directory, the approval won't be created |

## Good habits

- **Approvals need Dataverse.** The first approval in an environment provisions the Approvals tables. If you see `CdsInstanceNotReady`, run the flow again once provisioning has finished.
- **Never loop on an approval with Do until.** Handle every outcome (Approved, Rejected, Canceled, or your custom options) with a **Condition** or **Switch**. A Do until loop can spin forever on an outcome you didn't expect.
- **Approvers on phones:** the Power Automate mobile app was retired on 31 August 2026. Point mobile approvers to the **Approvals app in Microsoft Teams** or to Outlook.

## Sources

- Microsoft Learn: [Differences between flow approval actions](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/approvals/differences-between-flow-approval-actions)
- Microsoft Learn: [Get started with approvals: approval types](https://learn.microsoft.com/power-automate/get-started-approvals#approvals-actions)
- Microsoft Learn: [Set up sequential approvals: limitation](https://learn.microsoft.com/power-automate/set-up-sequential-approvals)
- Microsoft Learn: [Create parallel approvals](https://learn.microsoft.com/power-automate/parallel-modern-approvals)
- Microsoft Learn: [Manage sequential approvals: Approve and Reject are case-sensitive](https://learn.microsoft.com/power-automate/sequential-modern-approvals#add-a-condition)
- Microsoft Learn: [Approvals known issues](https://learn.microsoft.com/power-automate/approvals-known-issues)
- Microsoft Learn: [Common errors creating and assigning approvals](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/approvals/common-errors-creating-and-assigning-flow-approvals)
- Microsoft Learn: [Use Markdown in approval requests](https://learn.microsoft.com/power-automate/approvals-markdown-support)
- Microsoft Learn: [Troubleshoot email in flows: approval attachments](https://learn.microsoft.com/power-automate/email-troubleshooting)
- Microsoft Learn: [Important changes coming: Power Automate mobile app](https://learn.microsoft.com/power-platform/important-changes-coming#deprecation-of-the-power-automate-mobile-app)
