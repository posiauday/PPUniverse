---
title: "Stepper"
slug: stepper
category: navigation-and-layout
summary: "The steps of a form or wizard, with progress, a check before each step that stops people skipping what's required, Back and Next, and a step to go to. Or a project's stages and an approval chain in the standard status colours. Horizontal or vertical."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsStepper** for a form split into steps: a request, an onboarding, a checklist. Or, with `Type`, to show where something is: a project's stage, an approval chain, a sales deal, an order. A plain row of labels shows where you are, but it doesn't stop anyone moving on with a step half done. This component:

- **Shows the steps and progress** on a clean card: finished steps get a ✓ in your colour, the current one a solid circle with a soft halo, and the lines between them fill as you go. Under a divider, "Step 2 of 4" with a progress bar. Horizontal, or vertical for a narrow screen or side panel. `Look` `"Premium"` gives a card with a soft shadow, rounder corners, thicker lines, the current title in your colour and a thicker bar.
- **Checks before moving on.** Write your own `CanLeaveStep(Step)` check: return false and Next stays on the step and says what's wrong ("Complete this step to continue."). `GoToStep()` stops at the first step that isn't complete, so no step is skipped.
- **Has Back and Next built in,** with your own labels ("Submit" on the last step), or uses your buttons through `Back()` and `Next()`.
- **Tracks a project or an approval** with `Type` `"Project"` or `"Approval"`, in the standard status colours, with a pill that says the status in words (see "Project stages, approvals and other trackers").
- **Lets people go back** by selecting an earlier step.
- Tells your app what happened: `OnStepChange(NewStep, OldStep)` and `OnFinish()`.
- Outputs the step, its title, whether it's the first or last, and the progress from 0 to 1.

## Use it

The examples call it `stpRequest` on your screen.

Your steps:

```powerfx
// stpRequest.Steps
Table(
    { Title: "Your details", Description: "Name and team" },
    { Title: "What you need", Description: "Items and dates" },
    { Title: "Approver", Description: "Who signs it off" },
    { Title: "Review", Description: "Check and submit" }
)
```

Show each step's content in its own container, below the stepper:

```powerfx
// conDetails.Visible
stpRequest.CurrentStep = 1

// conItems.Visible
stpRequest.CurrentStep = 2
```

Don't let people move on until a step is complete. `Step` is the step they want to leave:

```powerfx
// stpRequest.CanLeaveStep
Switch(
    Step,
    1, !IsBlank(txtName.Value) && !IsBlank(ddTeam.Selected),
    2, CountRows(colItems) > 0,
    3, !IsBlank(ppApprover.SelectedPeople),
    true
)
```

Submit on the last step:

```powerfx
// stpRequest.OnFinish
SubmitForm(frmRequest);
Navigate(DoneScreen)
```

Use your own buttons instead of the built-in ones:

```powerfx
// stpRequest.ShowButtons
false

// btnNext.OnSelect
If(stpRequest.IsLast, SubmitForm(frmRequest), stpRequest.Next())
```

Open a request at the step it was left on:

```powerfx
// stpRequest.DefaultStep
Coalesce(gblRequest.LastStep, 1)
```

## Project stages, approvals and other trackers

Set `Type` to show where something is rather than walk someone through a form. There's no official colour code for project phases; the colours follow the RAG status code most teams already report with, with blue for complete (BRAG):

| Type | Finished | Current | To come |
| --- | --- | --- | --- |
| `"Steps"` (default) | Your colour, with ✓ | Your colour | Grey |
| `"Project"` | Blue, with ✓ | From `Health`: `"Green"` on track, `"Amber"` at risk, `"Red"` off track | Grey |
| `"Approval"` | Green, with ✓ | Amber, waiting; red with ✕ when `Health` is `"Red"` (rejected) | Grey |

A pill beside the progress names the current stage and its status, so it changes at each stage: "Execution · At risk", "Waiting on Finance", "Rejected at Finance". Put your own words in `StatusText`, and read the words from the `Status` output. Set `DefaultStep` one past the last step to show every step finished ("Complete", or "Approved").

```powerfx
// stpProject.Type
"Project"

// stpProject.Steps
Table(
    { Title: "Initiation", Description: "Charter and sponsor" },
    { Title: "Planning", Description: "Scope, time, budget" },
    { Title: "Execution", Description: "Build and deliver" },
    { Title: "Monitoring", Description: "Track and control" },
    { Title: "Closure", Description: "Hand over, lessons" }
)

// stpProject.DefaultStep (the stage number in your data)
LookUp(Projects, ID = varProjectID).StageNumber

// stpProject.Health ("Green", "Amber" or "Red" in your data)
LookUp(Projects, ID = varProjectID).RAG

// stpProject.StepText
"Stage {n} of {total}"
```

To only show the stage, set `ShowButtons` and `AllowJumpBack` to false.

More uses, each a preset on this page:

- **An approval chain:** Submitted, Manager, Finance, Director, with `Type` `"Approval"` and the times in `Description`.
- **A sales pipeline:** Qualify, Develop, Propose, Close, with `Type` `"Project"` and the deal's health.
- **Order or delivery tracking:** Placed, Packed, Shipped, Out for delivery, Delivered, with your own words in `StatusText` ("Arriving today").
- **Hiring, onboarding or a service ticket** (New, In progress, Resolved, Closed): the same, with your stages.

## Accessibility

- Each step says its title, its place and its state ("Approver, Step 3 of 4, current step"). Finished steps are buttons you can select to go back; later steps can't be selected.
- Finished steps show a ✓ as well as the colour, and the current step a thicker ring and a bold title, so colour is never the only signal.
- The message when a step isn't complete is shown in text, beside the buttons.
- In `"Project"` and `"Approval"`, the status is in words on the pill and in what screen readers hear ("Execution, Stage 3 of 5, current step, At risk"), and a rejected step shows ✕. On amber, the number is dark so it stays readable.
- All the words are inputs, including what screen readers hear (`StepText`, `DoneText`, `CurrentText`), for your language.

## Known limits

- Horizontal steps share the component's width. Keep titles short, or use `Orientation` `"Vertical"` when there are more than five steps or the screen is narrow.
- Your content goes outside the component, in containers that show for each step.
- The actions (`GoToStep`, `Next`, `Back`) don't run `OnStepChange`, because your app called them and already knows. Only the user's own selections run it.
- `CanLeaveStep` runs for every step `GoToStep` passes, so keep it quick (no data calls in it).
- `Type` and `Health` take the exact words shown: `"Amber"`, not `"amber"`.
- The status colours are the standard ones and don't change; `AccentColor` still colours the focus ring and Next.

## Change log

- **0.1.0:** first version: horizontal and vertical, the `CanLeaveStep` check, Back and Next with a blocked message, going back to an earlier step, `OnStepChange` and `OnFinish`, and the `GoToStep`, `Next`, `Back` and `Reset` actions; `Type` `"Project"` and `"Approval"` with `Health`, `StatusText` and the `Status` output.
