---
title: "Why didn't my flow trigger? A checklist that finds the cause"
slug: why-didnt-my-trigger-fire
type: TUTORIAL
technology: POWER_AUTOMATE
topic: triggers-and-design
excerpt: "Your Power Automate flow is on, the item was created, nothing ran. Ten checks in the order that finds the cause fastest: flow status, run history, trigger conditions, polling delays, connections, data policies, admin mode, licences and suspension rules."
searchPhrase: "power automate flow not triggering"
---
A Power Automate flow that isn't triggering gives you nothing to debug: no red action, no error, just an empty run history. Work through these checks in order; the first few catch most cases.

> [!ANSWER] Quick answer: check these first
> 1. [The flow is off or suspended](#1-is-the-flow-on): look at **Status** on its details page.
> 2. [A trigger condition filtered it out](#3-is-a-trigger-condition-filtering-it-out): run history shows **Trigger check skipped**.
> 3. [The connection needs signing in again](#5-is-the-connection-healthy): look for a warning under **Connections**.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## 1. Is the flow on?

Open the flow's details page and look at **Status**:

- **On:** go to check 2.
- **Off:** someone turned it off. Turn it on. If it switches itself off again, a data policy is the likely cause (check 6).
- **Suspended:** Power Automate stopped it, usually after repeated failures or a data policy violation. Find out why (checks 6 and 9) before turning it back on.

> [!TIP]
> Can't find the flow at all? Check the **environment** picker in the top-right corner. Flows live in one environment, and the default one isn't always where yours was built.

## 2. What does run history say?

Open the **28-day run history** and select **All runs**:

| You see | It means |
| --- | --- |
| No runs at all | The trigger never fired: carry on below |
| **Trigger check skipped** at the right time | The event arrived, but a **trigger condition** filtered it out (check 3) |
| Runs marked **Cancelled** | The trigger fired, but **concurrency control** rejected the run while another was going (check 8) |
| Runs that started but failed | It isn't the trigger. Read the failed action's error |

## 3. Is a trigger condition filtering it out?

Open the trigger → **Settings** → **Trigger conditions**. An empty box means the trigger fires on every event its title describes.

If there's a condition:
1. Remove it temporarily and test. If the flow runs now, the condition is wrong.
2. Check the field names it uses against the trigger's real output. One way is **Peek code** on the trigger; another is a run with the condition removed.
3. Watch for the usual mistakes: wrong case (`'Approved'` versus `'approved'`), a field that is empty for new items, and comparing a number to text.

```text
@equals(triggerOutputs()?['body/Status/Value'], 'Approved')
```

## 4. Did you wait long enough?

Most "When an item is created" and "When an email arrives" triggers **poll**: they check for changes every few minutes, typically 1–5 depending on the connector. Create a fresh test item and wait 5–10 minutes before deciding it didn't work.

For **scheduled** flows, check that:
- the start time is in the past, or the first run is in the future and it simply hasn't happened yet;
- the **time zone** in the trigger is the one you mean.

A flow set to 9:00 runs at 9:00 *in the trigger's time zone*.

## 5. Is the connection healthy?

Go to **Connections** and find the connection the trigger uses. A warning there means its sign-in is no longer valid. Common reasons:
- a password change;
- a new multifactor sign-in policy;
- the account was disabled;
- the token expired after about **90 days** unused.

Select **Fix connection** and sign in again.

Also check that the connection's account can still see the thing being watched: the site, list, folder or mailbox. For a shared mailbox, it needs permission on that mailbox.

## 6. Did a data policy block it?

If the flow combines connectors that a **data policy** (DLP) keeps apart, or uses a blocked connector, it's suspended and the trigger won't fire. Edit the flow and **Save** it: the **flow checker** reports policy violations. Only an admin can change the policy.

> [!WARNING]
> If several flows stopped at the same moment and nobody edited them, suspect a data policy change before anything else.

## 7. Is the environment in admin mode?

When an admin turns on **Administration mode** for an environment, all background processes stop, flows included. Ask your admin, or check the environment's details in the Power Platform admin center.

## 8. Is concurrency control rejecting runs?

**Concurrency control** is in the trigger's **Settings** and is off by default. If it's on, only that many runs can happen at once. Up to **10 extra runs**, plus that number, can queue; beyond that, extra events may be retried by the connector or lost. Leave it off unless you really need runs one at a time.

> [!WARNING]
> Once concurrency control is turned on, it can't be turned off without deleting and re-adding the trigger.

## 9. Was it turned off automatically?

Power Automate turns flows off in a few situations, and emails the owners when it does:

| Situation | After |
| --- | --- |
| The trigger or actions fail continuously | 14 days |
| The flow is throttled continuously | 14 days |
| No trigger activity at all | 90 days, unless the owner has a premium licence or the flow has capacity licensing. Owners are warned 30 days ahead |

## 10. Licences and premium triggers

If the trigger's connector is **premium** (it shows *PREMIUM* in the connector list), the flow's owner needs a premium licence. Check the **Plan** shown on the flow's details page.

## Still nothing? Re-register the trigger

If everything above checks out, the trigger's registration may be stuck. Try these in order:
1. Turn the flow off and on again.
2. Make a small change and save, which re-registers the trigger.
3. Remove the trigger and add it again.
4. Use a fresh connection.
5. Save a copy of the flow.

If the trigger card shows *"There's a problem with the flow's trigger"*, your network may be blocking Power Automate. Ask IT to check that Power Automate's IP addresses and domains are allowed.

## Sources

- Microsoft Learn: [Troubleshoot common issues with triggers](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot)
- Microsoft Learn: [Troubleshoot cloud flow errors: trigger issues](https://learn.microsoft.com/power-automate/troubleshoot-flow-errors#trigger-issues)
- Microsoft Learn: [Fix connection failures in cloud flows](https://learn.microsoft.com/power-automate/fix-connection-failures)
- Microsoft Learn: [Limits of automated, scheduled and instant flows: concurrency and retention](https://learn.microsoft.com/power-automate/limits-and-config)
- Microsoft Learn: [Optimize Power Automate triggers: concurrency control](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/optimize-power-automate-triggers)
- Microsoft Learn: [Impact of data policies on apps and flows](https://learn.microsoft.com/power-platform/admin/dlp-impact-policies-apps-flows)
