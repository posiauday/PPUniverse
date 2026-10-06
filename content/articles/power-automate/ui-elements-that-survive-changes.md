---
title: "UI elements that survive changes: robust selectors for desktop flows"
slug: ui-elements-that-survive-changes
type: PATTERN
technology: POWER_AUTOMATE
topic: desktop-flows
excerpt: "'Failed to get UI element' after an app update, a new window title or a different screen? Make selectors that keep working: find what changes, remove the dynamic parts, add fallback selectors, wait for the screen, and repair quickly when it does break."
---
A desktop flow finds buttons, fields and windows through **selectors**: a path of attributes such as name, class and automation ID, from the window down to the element. When any part of that path changes, the action fails with **"Failed to get UI element"** or **"Failed to get window"**. Usually the cause is a window title with a number in it, an app update, or a different screen size. This pattern makes selectors that bend instead of break.

> [!NOTE]
> Checked against Microsoft Learn on 6 October 2026.

## What makes selectors break

- **Dynamic values:** window titles like `Invoice 10423 – App`, IDs that change every launch, row numbers.
- **App updates** that rename or move controls.
- **The machine:** screen resolution, DPI scaling, window size (maximised or not), OS version.
- **The user:** an app can load differently depending on who signs in.
- **Timing:** the element isn't on screen *yet* when the action runs.

## Step 1: Find what changes

Microsoft's own check:
1. Capture the element.
2. Close and reopen the window, or reload the page.
3. Capture the **same** element again.
4. Compare the two selectors, in the selector builder's text view or in Notepad.

Whatever differs is dynamic, and that's what you'll remove or relax.

## Step 2: Keep only the stable parts

Open the UI element, select **Edit**, and change the selector:

| Instead of | Use |
| --- | --- |
| `Name` **Equal to** `Invoice 10423 – App` | `Name` **Ends with** `– App` (or **Starts with**, **Contains**) |
| An attribute that holds a number or ID that changes | Turn that attribute **off** |
| A level of the path that comes and goes (an extra pane, a banner) | Turn the whole **level off** |
| A changing value you know at run time | A **variable**: `%InvoiceNumber%`. In the visual editor, variables work only with **Equal to** |

**Prefer** stable attributes, such as automation IDs, control names and process names, over positions and generated IDs. Use **Inspect UI element** to explore the app's element tree and find them.

## Step 3: Add fallback selectors

One UI element can hold **several selectors**. When the first fails, Power Automate tries the next, in order. Add them with **Selector with recapture**, or right-click an existing one and select **Create a copy**, then edit the copy.

A good set is:
1. A **precise** selector: fast and exact.
2. A **relaxed** one, with dynamic parts removed.
3. One captured on the **unattended machine**, if it renders the app differently.

For stubborn apps, add an **image fallback** as a last resort. Microsoft documents a fallback mechanism for UI elements.

## Step 4: Wait for the screen, don't race it

Many "not found" errors are really "not there **yet**". Before interacting:
- desktop apps: **Wait for window content** (the element appears);
- web pages: **Wait for web page content**.

Add a **retry policy** in the action's error handling (**On error → Retry**) for flaky moments.

## Step 5: Make attended and unattended alike

Unattended runs open their own session, often at a different resolution. To keep selectors valid:
- start the app **in the same window mode** (maximised) in both;
- set the resolution for unattended runs to match the one you built with;
- **test the selector on the unattended machine**, and recapture there if needed.

## When it breaks anyway: repair fast

1. **Test the selector** in the selector builder to see which level fails.
2. **Repair:** select the broken selector, choose **Repair**, then press Ctrl and click the element. Power Automate proposes a new selector that combines the old one and the new capture. Review the highlighted changes and select **OK**. *Selectors that contain variables can't be repaired this way; edit them by hand.*
3. **Legacy apps:** if capture is unreliable, try recapturing in **MSAA** mode.
4. **Copilot repair at run time:** when a desktop flow is run from a cloud flow, Power Automate can use Copilot to find the element if the selector fails, carry on, and offer to save the repaired selector.

> [!TIP]
> Name your selectors (right-click → **Rename**), for example "precise", "relaxed" or "unattended VM". Six months later, you'll know which one to fix.

## Sources

- Microsoft Learn: [Build a custom selector](https://learn.microsoft.com/power-automate/desktop-flows/build-custom-selectors)
- Microsoft Learn: [Automate using UI elements](https://learn.microsoft.com/power-automate/desktop-flows/ui-elements)
- Microsoft Learn: [UI elements fallback mechanism](https://learn.microsoft.com/power-automate/desktop-flows/ui-elements-fallback-mechanism)
- Microsoft Learn: [Repair a selector](https://learn.microsoft.com/power-automate/desktop-flows/repair-selector)
- Microsoft Learn: ["Failed to get UI element" or "Failed to get window"](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/desktop-flows/ui-automation/ui-automation-action-fails-errors)
- Microsoft Learn: [Error when an action fails to get a UI element](https://learn.microsoft.com/troubleshoot/power-platform/power-automate/desktop-flows/ui-automation/failed-get-ui-element)
- Microsoft Learn: [Troubleshoot unattended execution failures: reliable selectors](https://learn.microsoft.com/power-automate/desktop-flows/how-to/troubleshoot-unattended-execution-failures#ensure-reliable-ui-element-selectors)
- Microsoft Learn: [FAQ for Repair with Copilot at runtime](https://learn.microsoft.com/power-automate/faqs-repair-copilot)
