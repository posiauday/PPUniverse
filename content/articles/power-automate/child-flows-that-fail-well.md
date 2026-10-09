---
title: "Child flows that fail well: inputs, results, errors and connections"
slug: child-flows-that-fail-well
type: PATTERN
technology: POWER_AUTOMATE
topic: errors-and-limits
excerpt: "Child flow error handling that works: split a big flow without losing track of failures. Set up the child so it always reports back, let the parent decide what to do, avoid the 'child workflows only support embedded connections' error, and license it correctly."
searchPhrase: "child flow error handling"
---
A flow with a hundred actions is hard to read and harder to fix. **Child flows** let you split it into small flows that each do one job, such as "create the customer" or "file the document", and reuse them from many parent flows. The catch: when a child fails, the parent sees only a vague **ActionFailed**. This pattern makes the child report back clearly, so the parent can decide what to do.

> [!ANSWER] Quick answer
> 1. [Give the child its own connections](#step-1-give-the-child-its-own-connections) under **Run only users**, or the parent fails.
> 2. [Make the child always answer](#step-2-make-the-child-always-answer) with `ok`, `message` and `result`, on success and on failure.
> 3. [Let the parent check `ok`](#step-3-let-the-parent-decide) and decide what to do.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## The rules child flows follow

- **Both flows live in a solution.** Create the parent and its children **directly in the same solution**. Microsoft notes that importing an existing flow into the solution afterwards can give unexpected results.
- **The child starts with "Manually trigger a flow".** Its inputs, such as text, numbers or yes/no, become the fields the parent fills in.
- **The child returns results** with **Respond to a Power App or flow**, or with the premium **Response** action.
- **The parent calls it** with **Run a Child Flow**, under the built-in **Flows** connector, and waits for it to finish.
- **Moving environments is easy.** Export and import the solution, and the parent finds its child again without any URLs to update.

## Step 1: Give the child its own connections

Child flows can't borrow the parent's connections. If the child uses anything other than built-in actions or Dataverse:

1. Open the child flow's details page.
2. In **Run only users**, select **Edit**.
3. For each connection, choose **Use this connection (…)** instead of **Provided by run-only user**.
4. Select **Save**.

If you skip this, the parent fails with an error saying the flow *can't be used as a child workflow because child workflows only support embedded connections*.

## Step 2: Make the child always answer

The key idea: **the child should respond on the success path and on the failure path.** It always sends back the same small "report", and the parent reads it.

> [!DIAGRAM] How the child reports back
> The parent runs the child -> Try does the work -> Catch records any error -> Respond returns ok, message and result -> The parent checks ok

The report has three outputs:

| Output | Type | Example |
| --- | --- | --- |
| `ok` | Yes/no | `true` |
| `message` | Text | "Customer C-1042 created" or the error text |
| `result` | Text | The ID or value the parent needs, empty on failure |

Build the child like this:

1. **Initialize variables** at the top: `ok` (Boolean, `false`), `message` (String), `result` (String).
2. **Try** scope: the real work. Its last steps set `ok` to `true`, plus `result` and `message`.
3. **Catch** scope, set to **Configure run after → has failed / has timed out** on the Try scope:
   - use **Filter array** on `result('Try')` to find the action whose status is `Failed`;
   - set `message` to a readable version of that error.
4. **One Respond to a Power App or flow** action **after** both scopes, outside them. Set its **Configure run after** on the Catch scope to **is successful**, **has failed** and **is skipped**, so it runs on both paths. It returns the three variables.

Microsoft's guidance is to keep response actions **outside** scopes, which is why the response comes last instead of sitting inside Try and Catch. The full Try/Catch setup is in [Try, catch and finally](/guides/try-catch-finally-scopes).

> [!DO]
> Respond once, after the Try and Catch scopes, so the child answers on both paths.

> [!DONT]
> Put the response inside Try or Catch. Response actions belong outside scopes.

> [!TIP]
> Put a link to the child's own run in the failure message, so whoever reads the parent's log can jump straight to the detail. Microsoft's error-handling guidance shows how to build the run URL from the `workflow()` function.

## Step 3: Let the parent decide

After **Run a Child Flow**, add a **Condition** on the child's `ok` output:

- **Yes:** carry on with `result`.
- **No:** log `message`, notify someone, or skip this item. It's your choice, and it's visible.

Also catch the case where the child **couldn't answer at all**, for example because it was turned off or its connection broke. Add a step after **Run a Child Flow** that runs when that action **has failed** or **has timed out**, and treat it as a failure. In run history this shows as **ActionFailed** on the child flow action; open the action's **Outputs** for the real error.

## Retries: where they belong

- **Inside the child**, every action keeps its own **retry policy**, which retries temporary failures by default. Leave that on.
- **Don't add your own retry loop around the child call** unless the child is safe to run twice. If it *creates* something, a second run creates it twice. Check whether the item exists first.

> [!DO]
> Leave each action's own retry policy on, inside the child.

> [!DONT]
> Wrap the child call in a retry loop of your own when the child creates something.

## Calling a child inside a loop

If you see *"Nested flows are not supported in this context"* when you call a child flow inside **Apply to each**, Microsoft's fix is to move the call out of the loop: pass the **whole array** to the child as one input, and let the child loop over it.

## How long the parent waits

The parent waits for the child for the lifetime of a flow run: up to **one year** when the flows use only built-in connections and Dataverse, and **30 days** otherwise. A child that waits for an approval can therefore keep the parent waiting too. Design long waits deliberately.

## Licensing

- If the **child** uses premium connectors and is called by many parents, you can assign a **Process** licence to the child. The parents don't need one just because they call it.
- A Process licence on a **parent** doesn't cover its children automatically. Put parent and child in the same **flow group** to share the capacity.
- A parent that uses premium connectors itself still needs its owner to have a Premium licence, or its own Process capacity.

## Sources

- Microsoft Learn: [Create child flows](https://learn.microsoft.com/power-automate/create-child-flows)
- Microsoft Learn: [Employ robust error handling](https://learn.microsoft.com/power-automate/guidance/coding-guidelines/error-handling)
- Microsoft Learn: [Use scopes: known issues and limitations](https://learn.microsoft.com/power-automate/scopes#known-issues-and-limitations)
- Microsoft Learn: [Expression functions: result()](https://learn.microsoft.com/azure/logic-apps/expression-functions-reference#result)
- Microsoft Learn: [Cloud flow error code reference: ActionFailed](https://learn.microsoft.com/power-automate/error-reference#connector-and-api-errors)
- Microsoft Learn: [Troubleshoot cloud flow errors: common error messages](https://learn.microsoft.com/power-automate/troubleshoot-flow-errors#common-error-messages)
- Microsoft Learn: [Limits of automated, scheduled and instant flows: retry policy](https://learn.microsoft.com/power-automate/limits-and-config#retry-policy)
- Microsoft Learn: [Power Automate licensing FAQ: child flows and flow groups](https://learn.microsoft.com/power-platform/admin/power-automate-licensing/faqs#multiplexing)
