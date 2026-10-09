---
title: "Stepper"
slug: stepper
category: navigation-and-layout
summary: "The steps of a form or wizard, with progress, a check before each step that stops people skipping what's required, Back and Next, and a step to go to. Horizontal or vertical."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

Use **lcsStepper** for a form split into steps: a request, an onboarding, a checklist. A plain row of labels shows where you are, but it doesn't stop anyone moving on with a step half done. This component:

- **Shows the steps and progress:** finished steps get a ✓ in your colour, the current one a ring, and the line between them fills as you go. Horizontal, or vertical for a narrow screen or side panel.
- **Checks before moving on.** Write your own `CanLeaveStep(Step)` check: return false and Next stays on the step and says what's wrong ("Complete this step to continue."). `GoToStep()` stops at the first step that isn't complete, so no step is skipped.
- **Has Back and Next built in,** with your own labels ("Submit" on the last step), or uses your buttons through `Back()` and `Next()`.
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

## Accessibility

- Each step says its title, its place and its state ("Approver, Step 3 of 4, current step"). Finished steps are buttons you can select to go back; later steps can't be selected.
- Finished steps show a ✓ as well as the colour, and the current step a thicker ring and a bold title, so colour is never the only signal.
- The message when a step isn't complete is shown in text, beside the buttons.
- All the words are inputs, including what screen readers hear (`StepText`, `DoneText`, `CurrentText`), for your language.

## Known limits

- Horizontal steps share the component's width. Keep titles short, or use `Orientation` `"Vertical"` when there are more than five steps or the screen is narrow.
- Your content goes outside the component, in containers that show for each step.
- The actions (`GoToStep`, `Next`, `Back`) don't run `OnStepChange`, because your app called them and already knows. Only the user's own selections run it.
- `CanLeaveStep` runs for every step `GoToStep` passes, so keep it quick (no data calls in it).

## Change log

- **0.1.0:** first version: horizontal and vertical, the `CanLeaveStep` check, Back and Next with a blocked message, going back to an earlier step, `OnStepChange` and `OnFinish`, and the `GoToStep`, `Next`, `Back` and `Reset` actions.
