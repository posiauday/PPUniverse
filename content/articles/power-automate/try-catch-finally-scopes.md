---
title: "Try, catch and finally: error handling with scopes"
slug: try-catch-finally-scopes
type: PATTERN
technology: POWER_AUTOMATE
topic: errors-and-limits
excerpt: "By default a failed action just stops the flow, and the owner may never hear about it. The try-catch-finally pattern with scopes makes every failure visible, logged and handled."
---
When an action in a cloud flow fails, the flow stops and the run is marked failed. The owner may or may not get an email: Microsoft sends per-run failure alerts only for some errors, and only if alerts are on for that flow. For anything that matters, the business finds out when someone asks, "why didn't I get my confirmation?"

The **try-catch-finally** pattern fixes this. It uses three **Scope** actions and the **Configure run after** setting, and it takes about ten minutes to add to an existing flow.

## The pattern

| Scope | What goes in it | Runs when |
| --- | --- | --- |
| **Try** | The flow's real work | Always |
| **Catch** | Find the error, log it, tell someone | **Try** has failed or timed out |
| **Finally** | Clean-up and the final status | After **Catch**, whatever happened |

A scope is a container: all the actions inside it run as one block, and the scope gets one overall status (**Succeeded**, **Failed**, **Skipped** or **TimedOut**). That single status is what makes the pattern work.

## Step 1: wrap the work in Try

1. Add a **Scope** action straight after the trigger and rename it **Try**.
2. Move the flow's actions into it. In the designer you can drag them in, or add new ones inside the scope.

Keep variables outside the scope, above **Try**. Power Automate only lets you initialise variables at the top level of a flow, not inside scopes, conditions or loops.

## Step 2: add Catch

1. Add a second **Scope** after **Try** and rename it **Catch**.
2. On **Catch**, select **Configure run after**.
3. Clear **is successful**, and select **has failed** and **has timed out**.

Now **Catch** is skipped when **Try** works, and runs when it doesn't.

### Find out what failed

Inside **Catch**, the `result()` function returns the outcome of every action inside a scope. Add a **Filter array** action:

- **From:**

```text
result('Try')
```

- **Condition:** filter to the failed actions.

```text
@equals(item()?['status'], 'Failed')
```

The output lists each failed action with its `name`, `status`, start and end times, and `outputs`. The name of the first failed action is:

```text
first(body('Filter_array'))?['name']
```

Where the error message sits inside `outputs` depends on the connector. Make the flow fail once on purpose, open the **Filter array** output in the run history, and write your **Compose** expression against what you see there.

> [!WARNING]
> `result()` returns only the **top-level** actions in the scope. A failure inside a **Condition**, **Switch** or loop within **Try** shows up as that container failing, not as the action inside it. Keep **Try** flat where you can, or give a complex block its own nested try-catch.

> [!NOTE]
> `result()` takes the scope's internal name, which uses underscores instead of spaces. If you rename the scope to **Try block**, the expression becomes `result('Try_block')`. Short names without spaces avoid the problem.

### Link to the failed run

A notification is far more useful when it links straight to the failed run. The `workflow()` function returns details of the current run. Microsoft's guidance builds the run URL from it: parse `workflow()` with **Parse JSON**, then compose:

```text
https://make.powerautomate.com/environments/@{body('Parse_JSON')?['tags']?['environmentName']}/flows/@{body('Parse_JSON')?['tags']?['logicAppName']}/runs/@{body('Parse_JSON')?['run']?['name']}
```

Check the URL format against a real run in your environment once. The run page's address in your browser shows the pattern to match.

### Tell someone, and log it

In **Catch**:

- **Notify an owner.** Send the error message and the run link to a shared mailbox or Teams channel, not to one person who may leave.
- **Log it.** Write a row to an error log table with the flow name, the time, the failed action and the message. A log lets you see patterns: the same connector failing every Monday is a design problem, not bad luck.

> [!WARNING]
> Be careful what you log. Error messages can contain the data the action was processing, including personal data. Log the action name and error code, and keep payloads out unless you need them and are allowed to store them.

## Step 3: add Finally

1. Add a third **Scope** after **Catch** and rename it **Finally**.
2. On **Finally**, select **Configure run after**, and select all four options: **is successful**, **has failed**, **is skipped** and **has timed out**.

**Finally** now always runs:

- after **Catch** runs (the work failed);
- or after **Catch** is skipped (the work succeeded).

Use it for anything that must happen either way, such as updating the item's status or releasing a lock.

## Step 4: make the run's final status honest

There's a catch in the pattern. Once **Catch** handles an error, the run finishes and is marked **Succeeded**. Your run history and every dashboard now say the flow is healthy when it isn't.

Fix this with a **Terminate** action at the end of **Catch**, with the status set to **Failed** and a short message. Handled failures then still count as failures in run history and in analytics.

> [!TIP]
> Put **Terminate** as the last step in **Catch**, not in **Finally**. **Terminate** ends the run immediately, so anything after it, including the **Finally** scope, doesn't run. If **Finally** has work that must happen on failure too, move that work into **Catch** before **Terminate**.

## Retries come before Catch

Many failures are temporary: a service is briefly busy, or a request is throttled. Those shouldn't reach **Catch** at all. Each action has a **Retry policy** in its settings, and Microsoft recommends an **exponential** policy, which waits longer between each attempt, for transient faults. Set it on actions that call external services, and let **Catch** deal with what's still failing after the retries.

## Checklist

- The flow's work sits inside a **Try** scope.
- **Catch** runs after **Try** has failed or has timed out, and finds the error with `result()`.
- Notifications go to a shared owner, with a link to the failed run.
- Errors are logged without sensitive payloads.
- **Catch** ends with **Terminate** set to **Failed**, so handled failures still show as failures.
- Actions that call external services have an exponential retry policy.

The steps follow Microsoft's documented behaviour for scopes, run-after settings and error handling in cloud flows. The logging advice and the placement of **Terminate** are our own recommendations.

## Sources

- [Employ robust error handling (Microsoft Learn)](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/error-handling)
- [Use scopes to organize actions in cloud flows (Microsoft Learn)](https://learn.microsoft.com/power-automate/scopes)
- [Organize your flows with scopes (Microsoft Learn)](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/create-scopes)
- [Understand flow failure notifications (Microsoft Learn)](https://learn.microsoft.com/power-automate/understand-flow-failure-notifications)
