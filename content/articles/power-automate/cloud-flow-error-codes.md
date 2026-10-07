---
title: "Cloud flow error codes: what each one means and how to fix it"
slug: cloud-flow-error-codes
type: REFERENCE
technology: POWER_AUTOMATE
topic: errors-and-limits
excerpt: "Every common Power Automate error, from 401 and 429 to ExpressionEvaluationFailed and FlowRunQuotaExceeded: what it means, how to confirm the cause in run history, the fix, and how to stop it happening again."
searchPhrase: "power automate error codes"
---
A red action in Power Automate's run history tells you *that* something failed. The error code on it tells you *why*, but only once you know where to look and what each code really points to. Keep this page open next to your run history.

> [!ANSWER] Quick answer
> 1. [Open the failed run and find the first red action](#first-find-the-real-error): later red actions are usually knock-on failures.
> 2. [Read its **Outputs**, not the headline](#first-find-the-real-error): the real status code and message are there.
> 3. [Look the code up in the quick index](#quick-index). No run at all? [The trigger is the problem](#when-the-flow-didnt-run-at-all).

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026. Limits change over time; the **Sources** list at the end links to Microsoft's current pages.

## First, find the real error

Most failures surface as a generic wrapper, and the useful detail is one level down.

1. Open the flow, then **Run history** (the **28-day run history** on the details page), and select the failed run.
2. Find the first action with a red icon. Later red actions are usually just knock-on failures.
3. Expand it and read **Outputs**, not just the headline. The headline often says **ActionFailed**; the outputs hold the real status code and the service's own message.
4. Inside a **Scope**, expand the scope and find the first failed action *inside* it. A scope reports failure on behalf of its contents.

> [!TIP]
> Run history only shows runs that started. If there's nothing there at all, the problem is the trigger, not an action. Jump to **The flow didn't run at all** below.

## Quick index

| Code or message | Usually means | Try this first |
| --- | --- | --- |
| 400 BadRequest | The data you sent doesn't fit what the service expects | Compare the action's **Inputs** with the field types |
| 401 Unauthorized | The connection's sign-in is no longer valid | **Connections** → **Fix connection** |
| 403 Forbidden | Signed in, but not allowed: permissions, a data policy or a licence | Check access to the resource, then data (DLP) policies |
| 404 NotFound | The list, file, folder or record isn't where the flow expects | Check it wasn't renamed, moved or deleted |
| 429 Too Many Requests | You hit a connector's rate limit | Slow down: retry with backoff, fewer calls, a delay in loops |
| 500 / 502 | A problem on the service's side, or between it and Power Automate | Wait and retry; check service health |
| ActionFailed | A wrapper around a failure | Expand **Outputs** for the real code |
| InvalidTemplate | An expression can't even be read | Fix the expression syntax before saving |
| ExpressionEvaluationFailed | An expression ran into data it didn't expect | Guard against empty values and wrong types |
| ContentConversionFailed | A value is the wrong type for the next action | Convert it explicitly |
| InvalidConnection / ConnectionAuthorizationFailed | The connection is broken, deleted or expired | Re-authenticate or pick a new connection |
| DirectApiAuthorizationRequired | A premium connector and no premium licence for the caller | Licence the person or flow that runs it |
| ActionTimedOut / OperationTimedOut | Waited too long | Set realistic timeouts and handle "has timed out" |
| WorkflowRunActionRepetitionQuotaExceeded | A loop had too many items | Filter before looping |
| FlowRunQuotaExceeded | Too many requests in the period | Use fewer actions per run, or more capacity |

## HTTP status codes

### 400 BadRequest

**What it means.** The service understood the call but rejected the data in it.

**Usually caused by:**
- a field of the wrong type, such as text where a number is expected;
- a required field missing from what was sent;
- a value too long for the column (a SharePoint single line of text holds 255 characters);
- characters the service doesn't accept in a file name or title.

**Confirm it.** Open the failed action's **Inputs** in run history. You'll see exactly what was sent, which is often different from what you thought you mapped.

**Fix.**
- Convert types explicitly with `int()`, `float()`, `string()` or `bool()`.
- Trim long text with `substring()`, and strip unwanted characters with `replace()`.

**Prevent it.** Clean and convert user input in one **Compose** step near the top of the flow, and map from that.

### 401 Unauthorized

**What it means.** The connection's credentials are no longer accepted.

**Usually caused by:**
- a password change or a reset of multifactor sign-in;
- a disabled account;
- an OAuth refresh token that expired after long inactivity (Microsoft cites about 90 days unused);
- an expired service principal secret;
- a Conditional Access policy blocking the sign-in.

**Confirm it.** Go to **Power Automate** → **Connections**. A broken connection shows a warning.

**Fix.** Select **Fix connection** and sign in again. For a service principal, create a new secret in Microsoft Entra ID and update the connection. If sign-in keeps failing, check the Entra ID sign-in logs for a Conditional Access block.

**Prevent it.** For flows the business depends on, use **service principal connections**. They don't break when someone changes their password or leaves.

### 403 Forbidden

**What it means.** The connection signs in fine, but the account isn't allowed to do this.

**Usually caused by:**
- the account lost access to the site, list, mailbox or table;
- a **data (DLP) policy** now blocks the connector in this environment;
- a tenant setting restricts the connector;
- the connector is premium and the caller has no premium licence.

**Confirm it.**
1. Check the account's access to the target, for example SharePoint site permissions or a Dataverse security role.
2. If several flows broke at the same moment and nobody changed them, suspect a data policy change.

**Fix.** Restore the permission, or ask your Power Platform admin which data policy changed and whether the connector can be reclassified.

**Prevent it.** Run important flows under an account whose access is managed on purpose, not under whoever built the flow.

### 404 NotFound

**What it means.** The thing the action points at isn't there any more.

**Usually caused by:**
- a renamed or deleted list, library, folder or channel;
- a hard-coded ID for a record someone else deleted.

**Confirm it.** Open the target in its own app. Does it still exist under that name?

**Fix.** Point the action at the new location. Replace hard-coded IDs with a lookup, for example **Get items** with a filter instead of **Get item** with a fixed ID.

**Prevent it.** Where a missing item is expected, add a branch set to **Configure run after** → **has failed** and handle it calmly instead of failing the whole run.

### 429 Too Many Requests

**What it means.** A connector is throttling you. Every connector has its own rate limit. For example, Microsoft documents 600 operations per minute for one SharePoint connection, shared across every flow that uses that connection. The message often says how long to wait: *"Rate limit is exceeded. Try again in 27 seconds."*

**Usually caused by:**
- an **Apply to each** loop calling the same connector hundreds of times;
- loop concurrency set high;
- many flows sharing one connection.

**Confirm it.** The failed action shows status 429. Look at how many times that action ran in the run.

**Fix.**
- Leave the default **retry policy** on. It already retries at growing intervals.
- Reduce the calls: filter at the source instead of inside the loop, and use **Select** or **Filter array** instead of a loop where you only reshape data.
- Lower the loop's concurrency, or add a short **Delay** inside it.

**Prevent it.** Design for the connector's documented limits, which are listed on each connector's reference page. A flow that is throttled continuously for **14 days** is turned off automatically.

### 500 Internal Server Error, and 502 Bad Gateway

**What it means.**
- **500:** the target service failed.
- **502:** the hop between Power Automate and the service failed. This includes an on-premises data gateway that is offline.

**Fix.**
- Usually temporary: let the retry policy work, and check the service's health page (Microsoft 365 Service health for Microsoft services).
- If 502 keeps happening with on-premises data, check that the gateway machine is running and online.

## Errors in expressions and data

### InvalidTemplate

**What it means.** An expression can't be parsed, so the flow won't save or run.

**Usually caused by:**
- unmatched brackets or quotes;
- a misspelled action name;
- the wrong number of arguments;
- invisible characters picked up when pasting from a web page.

**Fix.**
- Action names in expressions use underscores for spaces, and the case must match exactly.
- If an expression looks right but still fails, delete it and type it again by hand.

```text
outputs('Get_item')?['body/Title']
```

### ExpressionEvaluationFailed

**What it means.** The expression is valid, but the data at run time didn't fit it.

**Usually caused by:**
- reading a property of something empty (null);
- converting text that isn't a number;
- a date in an unexpected format;
- dividing by a value that happened to be zero.

**Fix.** Guard every value that might be missing:

```text
coalesce(outputs('Get_item')?['body/Title'], 'Untitled')
```

```text
if(empty(triggerBody()?['value']), 'default', triggerBody()?['value'])
```

### ContentConversionFailed

**What it means.** One action produced a value of the wrong type for the next one: text for a number, an array where one object is expected, or a file where text is expected.

**Fix.**
- Convert explicitly.
- Use `first()` when you need one item from an array.
- Pass dates through `formatDateTime()` to get a predictable format.

## Connection and licence errors

### InvalidConnection, ConnectionNotConfigured, ConnectionAuthorizationFailed

**What it means.** The action's connection is missing, deleted or holds expired credentials.

**Common after:**
- a flow is imported into another environment;
- a solution is deployed without mapping its **connection references**.

**Fix.**
1. Edit the flow and choose **Change connection** on the flagged action.
2. For solution flows, open the solution's **Connection References** and set each one.

### DirectApiAuthorizationRequired

**What it means.** The flow uses a premium connector, such as HTTP, SQL Server, Dataverse or a custom connector, and the person or flow running it isn't licensed for premium.

**The detail people miss:** for an instant flow, the licence of the **person who runs it** counts, not the owner's.

**Fix.** Assign Power Automate Premium to the users who run it. For a shared, high-volume flow, consider a **Process** licence for the flow itself.

## When the flow didn't run at all

There's no run in history, so there's no error code to read. Work through these in order:

1. **Is the flow on?** A flow can be off, or **suspended** after repeated failures or a data policy violation. Check the status on the details page.
2. **Did the trigger event really happen?** Event triggers poll on an interval, typically every few minutes, so create a fresh test item and wait.
3. **Is a trigger condition filtering it out?** Remove the condition temporarily and test. If it runs, the condition is the problem. Runs skipped by a condition show as a **trigger check skipped** under **All runs**.
4. **Is the trigger's connection healthy?** See 401 above.
5. **Was it turned off for inactivity?** A flow with no trigger activity for **90 days** might be turned off, unless its owner has a premium licence or the flow has capacity licensing. Owners are emailed 30 days before.

## Limits worth knowing

| Limit | Value |
| --- | --- |
| Longest a single run can last | 30 days (pending approvals time out after that) |
| Run history kept | 30 days |
| Flows failing continuously | Turned off after 14 days |
| Flows throttled continuously | Turned off after 14 days |
| Items an **Apply to each** can process | 5,000 on the Low performance profile, 100,000 on others |
| **Apply to each** concurrency | 1 by default; up to 50 |
| **Do until** iterations | 60 by default; up to 5,000 |
| Default retry policy | Low profile: up to 2 retries. Medium and High: up to 12 retries, at growing intervals |
| Requests in any 5 minutes | 100,000 |

**Daily request limits** depend on licences, and right now they're in a **transition period**. While it lasts, Microsoft applies the limits **per cloud flow**: for example 10,000 a day for Microsoft 365 (seeded) use, 200,000 for Premium and 500,000 for Process. After the transition, the **per-user** limits apply: 6,000, 40,000 and 250,000 respectively. Design for the per-user figures. Every action counts, including variables, compose steps, retries and pagination.

> [!WARNING]
> A loop over 1,000 items with five actions inside uses about 5,000 requests per run. On a Microsoft 365 licence after the transition, one run like that a day nearly uses up the person's whole daily limit.

## Make failures visible

Most flows that "silently stopped working" were failing for days before anyone noticed.

- **Alert on failure.** After the steps most likely to fail, add a branch set to **Configure run after** → **has failed** (and **has timed out**). Have it send an email or Teams message with the flow name and the error from the failed step.
- **Use scopes.** Wrap the main steps in a scope and handle failures in a second scope, as shown in [Try, catch and finally: error handling with scopes](/learn/try-catch-finally-scopes).
- **Check weekly.** For flows that matter, look at run history once a week for failed and cancelled runs, and for a sudden drop in the number of runs.

## Sources

- Microsoft Learn: [Cloud flow error code reference](https://learn.microsoft.com/power-automate/error-reference)
- Microsoft Learn: [Troubleshoot cloud flow errors](https://learn.microsoft.com/power-automate/troubleshoot-flow-errors)
- Microsoft Learn: [Fix connection failures in cloud flows](https://learn.microsoft.com/power-automate/fix-connection-failures)
- Microsoft Learn: [Limits of automated, scheduled, and instant flows](https://learn.microsoft.com/power-automate/limits-and-config)
- Microsoft Learn: [Requests limits and allocations](https://learn.microsoft.com/power-platform/admin/api-request-limits-allocations)
- Microsoft Learn: [Understand platform limits and avoid throttling](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/understand-limits)
- Microsoft Learn: [Power Automate licensing FAQ](https://learn.microsoft.com/power-platform/admin/power-automate-licensing/faqs)
