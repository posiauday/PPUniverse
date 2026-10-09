---
title: "502 Bad Gateway and other random failures in Power Automate: retry, wait or report"
slug: 502-bad-gateway-intermittent-failures
type: TUTORIAL
technology: POWER_AUTOMATE
topic: errors-and-limits
excerpt: "A flow that worked for months starts failing at random with 502, 500, 503 or 504. How to tell a temporary service problem from your own fault, set retries that actually help, make the flow survive the next outage, and report it with the evidence support needs."
searchPhrase: "502 bad gateway power automate"
---
Intermittent failures are the most frustrating kind: the same flow, the same data, sometimes green and sometimes red with **502 Bad Gateway** or **500 InternalServerError**. Usually the problem isn't in your flow at all. This page helps you prove that quickly, keep the flow working through it, and know when it *is* yours to fix.

> [!ANSWER] Quick answer
> 1. [Re-run one failed run](#is-it-you-or-them): if it succeeds unchanged, the failure was temporary.
> 2. [Leave the default retry policy on](#make-sure-retries-are-working-for-you): on the Medium and High profiles it retries up to 12 times over about an hour.
> 3. [If failures outlast the retries](#survive-the-outage-instead-of-just-failing), catch them and re-process later. [Report it](#when-to-report-it) if it goes on for more than a day.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

> [!SYMPTOMS] What are you seeing?
> - `500 · 502 · 503 · 504` [Fails at random, works on a re-run](#is-it-you-or-them): Usually a temporary problem on the service's side.
> - `502` [Keeps failing on on-premises data](#is-it-you-or-them): Often the on-premises data gateway is offline, overloaded or out of date.
> - `5xx` [Still failing after the retries](#survive-the-outage-instead-of-just-failing): Catch the failure and re-process the work later.
> - `5xx` [Failing for more than a day, no incident posted](#when-to-report-it): Report it, with the evidence support needs.

## What the codes mean

| Code | Plain meaning | Usually |
| --- | --- | --- |
| **500** Internal Server Error | The service you called failed while handling the request | On their side; temporary |
| **502** Bad Gateway | The connection between Power Automate and the service failed | Temporary, or an on-premises **gateway** problem |
| **503** / **504** | The service is unavailable or too slow to answer | Temporary, often under heavy load |
| **429** Too Many Requests | You're sending too much, too fast | **Yours**: see the throttling notes in [Cloud flow error codes](/guides/cloud-flow-error-codes) |
| **400** / **401** / **403** / **404** | Your request, sign-in, permission or target is wrong | **Yours**: retrying won't help |

The first rule: **retrying only helps 5xx errors and 429.** A 4xx error fails the same way every time until you change something.

## Work through it

### Is it you or them?

1. **Look at the pattern in run history.** Do failures cluster in a time window and then stop? That points to the service. Does the same item fail every time? That points to that item's data, so look at its inputs.
2. **Check service health.** For Microsoft services such as SharePoint, Outlook, Dataverse and Power Automate itself, look at **Service health** in the Microsoft 365 admin center (your admin can) for known incidents. For other services, check their status page.
3. **Check the gateway**, if the action uses on-premises data. Repeated 502s on on-premises SQL Server, file shares or SharePoint Server usually mean the **on-premises data gateway** is offline, overloaded or out of date. Check its status, restart the gateway service, and update it.
4. **Re-run one failed run** from run history. If it now succeeds unchanged, it was temporary.

> [!TIP]
> When several flows fail at the same moment with 5xx errors, it's almost always an incident. When only one flow fails, look at what *that* flow sends.

### Make sure retries are working for you

Every action already has a **retry policy**. By default, on the Medium and High performance profiles, an action retries up to **12 times** at growing intervals, the last about an hour after the first. On the Low profile it retries up to **2 times**. Most brief outages pass inside that window without you noticing.

Check an important action's **Settings → Retry policy**:
- **Default** (exponential) is right for nearly everything. Leave it.
- **None** turns retries off. Only choose it when a repeat would do harm, such as sending a payment twice.
- **Custom** lets you set the count (up to **90**) and the intervals (at least **5 seconds**, at most **1 day**).

> [!WARNING]
> Retries count toward your daily request limits, and a retried action that **creates** something, such as an item or an email, can create it twice if the first attempt actually succeeded before the error came back. For "create" actions, check whether the item exists before creating it.

### Survive the outage instead of just failing

If a failure that outlasts the retries shouldn't lose work:

1. **Catch the failure.** After the risky step, add a branch set to **Configure run after → has failed / has timed out**. The full pattern is in [Try, catch and finally](/guides/try-catch-finally-scopes).
2. **Record what didn't happen.** Write the item's ID and the error to a list or table, with a status such as "Retry".
3. **Re-process later.** A small scheduled flow can pick up the "Retry" rows each hour and try again.
4. **Tell a person** if something stays failed for, say, a day.

This turns a one-hour outage from "lost orders" into "orders a little late".

### When to report it

Report the problem, to Microsoft support through your admin or to the service's own vendor, when:
- failures continue for more than a day with no incident posted;
- a single action fails consistently with a 5xx error on valid input;
- you see the problem across environments or tenants.

**Include:**
- the **flow run URL** of a few failed runs, with their dates and times in UTC;
- the **action name** and the **full error output** from the failed action's Outputs;
- whether a manual re-run succeeds;
- whether it uses an on-premises gateway, and the gateway version.

## Sources

- Microsoft Learn: [Fix connection failures in cloud flows: error codes and gateway issues](https://learn.microsoft.com/power-automate/fix-connection-failures)
- Microsoft Learn: [Troubleshoot cloud flow errors](https://learn.microsoft.com/power-automate/troubleshoot-flow-errors)
- Microsoft Learn: [Limits of automated, scheduled and instant flows: retry policy](https://learn.microsoft.com/power-automate/limits-and-config#retry-policy)
- Microsoft Learn: [Employ robust error handling](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/error-handling)
- Microsoft Learn: [Troubleshoot the on-premises data gateway](https://learn.microsoft.com/data-integration/gateway/service-gateway-tshoot)
