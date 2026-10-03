---
title: "Approvals that don't stall: reminders, escalation and an audit trail"
slug: approvals-that-dont-stall
type: TUTORIAL
technology: POWER_AUTOMATE
topic: approvals
excerpt: "An approval flow with no timeout waits until the run limit kills it, and nobody is told. Here is how to add a deadline, reminders, escalation to a second approver, and a record of every decision."
---
The default approval flow has one weakness: it trusts the approver to answer. If they're on leave, the request sits in their inbox. After about a month the flow run hits its time limit and fails, and the person who asked is never told what happened.

This tutorial builds an approval that can't stall. It has four parts:

1. **A deadline** on every approval.
2. **Reminders** while the approver hasn't answered.
3. **Escalation** to a second approver when the deadline passes.
4. **An audit trail** of who decided what, and when.

The example is a purchase request in a SharePoint list, but the pattern works for any trigger.

## Why approvals stall

A flow run can't wait forever. Microsoft's limits page gives a maximum run duration of **30 days**, including time spent waiting for an approval; after that, pending steps time out. Its approvals known-issues page describes a flow waiting **28 days** before it fails. Design for the shorter figure.

When the run fails, the approval itself doesn't disappear. It stays in the approver's list in the Power Automate action center with no flow waiting for it. Someone then has to find and delete these abandoned approvals by hand.

> [!WARNING]
> Never rely on the run limit as your timeout. Set your own deadline, well inside it, and decide what happens when it passes.

## Step 1: give the approval a deadline

Add **Start and wait for an approval** as usual. Then open the action's **Settings** and set **Timeout** to an ISO 8601 duration:

| You want | Timeout value |
| --- | --- |
| 2 days | `P2D` |
| 3 days and 12 hours | `P3DT12H` |
| 8 hours | `PT8H` |

When the deadline passes with no answer, the action ends with the status **TimedOut** instead of waiting.

## Step 2: escalate when the deadline passes

Add the escalation steps after the approval, and set them to run only on a timeout:

1. Add an action after the approval, for example **Get manager (V2)** from Office 365 Users, to find the approver's manager.
2. On that action, select **Configure run after**. Clear **is successful**, and select **has timed out**.
3. Add a second **Start and wait for an approval**, assigned to the manager, with its own timeout, for example `P2D`.

The flow now has two paths:

- **Answered in time:** the first approval succeeds, the escalation steps are skipped, and the flow carries on.
- **No answer:** the first approval times out, the escalation runs, and the manager gets the request.

> [!TIP]
> Put the requester's name, the amount and a link to the item in the **Details** and **Item link** fields of both approvals. A manager receiving an escalated request needs the full story without opening the flow. The **Details** field accepts Markdown.

Decide what happens if the escalation also times out. Common choices:

- **Reject automatically**, and tell the requester to resubmit.
- **Notify a shared mailbox** or a Teams channel that owns the process.

Don't let the second timeout end silently.

## Step 3: remind the approver before the deadline

Reminders need the approval to be created without blocking the flow, so this step swaps the single action for two:

1. **Create an approval.** It creates the request and sends the notification, then lets the flow continue.
2. **Wait for an approval.** It waits for the response to that request. Put your timeout on this action.

Then add a **parallel branch** next to **Wait for an approval**, containing:

- **Do until** the approval is complete, with inside it:
  - **Delay** for one day.
  - A check that the request is still pending, and if so, a reminder email or Teams message to the approver with the item link.

Set a variable such as `varDecided` to `true` right after **Wait for an approval** finishes, whether it succeeded or timed out. The **Do until** loop tests that variable, so the reminders stop as soon as there's an outcome.

> [!NOTE]
> Check the **Do until** limits under **Change limits**. It stops after 60 iterations by default, and the underlying engine's default loop timeout is one hour. A daily reminder loop needs a timeout longer than your approval deadline, for example `P3D`.

Microsoft's approval actions compare like this:

| | Start and wait for an approval | Create an approval + Wait for an approval |
| --- | --- | --- |
| Blocks the flow until there's an answer | Yes | Only the **Wait** action does |
| Allows steps (such as reminders) while waiting | No | Yes |
| Responses and comments as outputs | Yes | Yes, from **Wait for an approval** |
| Requester can cancel it from the Sent tab | No | Yes, with **Create an approval (v2)** |

## Step 4: keep an audit trail

Every approval is stored in Dataverse, and the approval action's outputs include the **Outcome** and **Responses** (who responded, their decision, their comments and when). Copy the essentials to the item being approved, so the record lives with the business data:

| Column on the request | Value from the flow |
| --- | --- |
| Decision | The approval's **Outcome** |
| Decided by | The responder's email, from **Responses** |
| Decided on | The response date, from **Responses** |
| Comments | The responder's comments |
| Escalated | `true` if the escalation path ran |

Update these columns in every branch: approved, rejected, escalated and final timeout. A request that ends with an empty **Decision** column is exactly the stall you're trying to prevent, so it should be easy to spot in a view.

> [!TIP]
> Add a view of requests where **Decision** is empty and the item is older than your deadlines combined. It's a one-minute daily check that catches anything the flow missed.

## Longer processes

If the whole process can take longer than about four weeks, a single flow run can't hold it. Microsoft's guidance is to split it:

- **One flow sends the request** with **Create an approval** and ends.
- **A second flow reacts to the response** and runs the business logic.

Keep the request's state in Dataverse or your list so either flow can pick it up.

## Checklist

- Every approval has a timeout well inside the 28-day limit.
- A timed-out approval escalates to a named person or a shared owner.
- The escalation has its own timeout and a defined final outcome.
- Reminders stop as soon as there's a decision.
- The decision, decider, date and comments are written back to the request.
- A view shows requests that never received a decision.

The steps follow Microsoft's documented behaviour for Power Automate approvals and flow limits. The escalation and reminder design is our own recommendation.

## Sources

- [Create and test an approval workflow with Power Automate (Microsoft Learn)](https://learn.microsoft.com/power-automate/modern-approvals)
- [Differences between flow approval actions (Microsoft Learn)](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/approvals/differences-between-flow-approval-actions)
- [Approvals known issues (Microsoft Learn)](https://learn.microsoft.com/power-automate/approvals-known-issues)
- [Limits of automated, scheduled and instant flows (Microsoft Learn)](https://learn.microsoft.com/power-automate/limits-and-config)
- [Cloud flow error code reference: timeouts (Microsoft Learn)](https://learn.microsoft.com/power-automate/error-reference#timeout-and-throttling-errors)
