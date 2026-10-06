---
title: "Dynamic content missing? Parse JSON, nested arrays and loops explained"
slug: dynamic-content-missing-parse-json
type: TUTORIAL
technology: POWER_AUTOMATE
topic: triggers-and-design
excerpt: "Why a field you know exists doesn't appear in the dynamic content picker, why Apply to each appears out of nowhere, and how to read any value from webhook or HTTP JSON with Parse JSON or a safe expression."
searchPhrase: "dynamic content missing parse json"
---
You know the value is there: you can see it in the run history. But it's missing from the dynamic content picker, or the picker shows "No dynamic content available", or picking it wraps your action in an **Apply to each** you didn't ask for. Here's what's going on, and how to get any value out with **Parse JSON** or an expression.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## Why a field doesn't appear

Work through these in order.

### 1. The picker is filtering by type

The picker only lists values that match the type of the box you're filling: text boxes get text values, number boxes get numbers. A number column won't appear for a text field, and vice versa.

**Fix:**
- **Search** for the field by name in the picker. Searching ignores the type filter.
- Or put the value in a **Compose** action first. **Compose** outputs can be used anywhere.

### 2. The trigger has "Split On" turned on

Triggers that can return several items at once, such as **When a new response is submitted** in Forms, can have **Split On** turned on. Then later steps may show **No dynamic content available**.

**Fix:** open the trigger's **Settings** and turn **Split On** off.

### 3. The list or table is chosen at run time

If the site, list or table in **Get items** or **List rows** comes from a variable or expression, the designer can't look up its columns while you edit, so the column fields never appear. This is common when one flow loops over several lists.

**Fix:**
- Use expressions to read the columns (below), or
- point the action at a fixed list while building, pick your fields, then switch back. The expressions the picker created keep working as long as every list has the same column internal names.

### 4. The value is inside an array

**Get items**, **List rows**, Forms file uploads and most webhook payloads return *arrays*. A field of one row only exists for one item at a time. That's why choosing it wraps your action in **Apply to each**: Power Automate is doing the same thing once for every item.

If you only want **one** item, don't loop. Take the first one with an expression:

```text
first(body('Get_items')?['value'])?['Title']
```

### 5. The content is plain text that hasn't been parsed

An **HTTP** action, a webhook trigger or a text column holding JSON returns *text*. Until it's parsed, its fields don't exist as dynamic content. Use **Parse JSON** (next section) or the `json()` expression.

## Parse JSON, step by step

1. **Run the flow once** so you have a real example. In run history, open the step that returned the JSON and **copy its output**, the body.
2. **Add Parse JSON.** For **Content**, choose the body of that step.
3. **Select "Generate from sample"** (or "Use sample payload to generate schema"), paste the output, and select **Done**.
4. Every field in the sample now appears as dynamic content in later steps.

### Fix the schema before you trust it

A generated schema only knows what was in *your one sample*. Two problems are common.

**Values that can be empty.** If a field was text in the sample but is empty (null) in a later run, the flow fails with *"Invalid type. Expected String but got Null."* Allow null for fields that can be empty:

```json
"middleName": {
  "type": ["string", "null"]
}
```

Or delete the `"type"` line for that field.

**Numbers.** A sample value of `10` becomes `"integer"`. If the real data can be `10.5`, change it to `"number"`. In JSON Schema, "number" allows decimals.

> [!TIP]
> Keep a copy of the payload in a **Compose** step at the top of the flow while you build it. When a run fails, you can see exactly what arrived.

## Skip Parse JSON: read values with expressions

For a value or two, an expression is quicker than a schema, and it doesn't break when the shape changes.

```text
body('HTTP')?['data']?['items']?[0]?['name']
```

- **Always use `?[...]`**, not `[...]`. With `?`, a missing level gives an empty value instead of failing the flow.
- **Give empty values a fallback:**

```text
coalesce(body('HTTP')?['data']?['customer']?['email'], 'unknown@example.com')
```

- **Parse only text.** `json()` turns a JSON *string* into an object. Don't wrap an action's output that's already an object in `json()`, because that errors.
- **Inside Apply to each,** read the current item with `items('Apply_to_each')?['fieldName']`.

## Nested arrays without nested loops

A payload like this has an array (lines) inside an object (order):

```json
{
  "order": {
    "id": "SO-1042",
    "lines": [
      { "sku": "A-1", "qty": 2 },
      { "sku": "B-7", "qty": 1 }
    ]
  }
}
```

- **Loop only the array you need.** In **Apply to each**, choose **lines**, not the whole body: `body('Parse_JSON')?['order']?['lines']`.
- **Reshape without looping.** Use **Select** to map each line to just the fields you need. A **Select** is one action; an **Apply to each** with three actions inside costs three actions per line.
- **Filter without looping.** Use **Filter array**, for example to keep lines where `qty` is greater than 0.

## Sources

- Microsoft Learn: [Dynamic content picker missing dynamic content from previous steps](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-creation/dynamic-content-picker-missing-dynamic-content-from-previous-steps)
- Microsoft Learn: [Expression cookbook for cloud flows: JSON and objects](https://learn.microsoft.com/power-automate/expression-cookbook#json-and-objects)
- Microsoft Learn: [Getting errors with null fields](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/flow-run-issues/getting-errors-null-fields)
- Microsoft Learn: [Troubleshoot cloud flow errors: common error messages](https://learn.microsoft.com/power-automate/troubleshoot-flow-errors#common-error-messages)
- Microsoft Learn: [Use a JSON schema to find a Forms upload](https://learn.microsoft.com/power-automate/forms/popular-scenarios#use-a-json-schema-to-find-the-uploaded-file)
- Microsoft Learn: [Business events and Power Automate: integer versus number in generated schemas](https://learn.microsoft.com/dynamics365/fin-ops-core/dev-itpro/business-events/how-to/how-to-flow)
