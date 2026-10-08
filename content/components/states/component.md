---
title: "Empty, loading and error states"
slug: states
category: states
summary: "One panel for the three states every list needs: nothing yet, loading, and something went wrong. A helper picks the state from what your app knows, and the button tells you which state it was."
access: OPEN
version: 0.1.0
modernControls: yes
---
## When to use it

A gallery with no rows shows a blank screen, and a slow or failed load looks the same. **lcsStates** gives every list three clear states:

- **Empty**: nothing to show yet, with a button to add the first item;
- **Loading**: a spinner while data loads;
- **Error**: what went wrong, with a button to try again.

Its output function **StateFor** picks the state for you from three facts your app already knows.

## Use it

Name it `stsRequests` and put it over your gallery.

Pick the state:

```powerfx
// Screen.OnVisible
Set(locState, "Loading");
Set(locFailed, false);
IfError(ClearCollect(colRequests, Requests), Set(locFailed, true));
Set(locState, stsRequests.StateFor(false, locFailed, CountRows(colRequests)))

// stsRequests.State
locState
```

Hide the gallery while a state shows:

```powerfx
// galRequests.Visible
!stsRequests.IsShowing
```

Handle the button for both states:

```powerfx
// stsRequests.OnAction
If(State = "Error", Select(btnReload), NewForm(frmRequest); Navigate(scrEdit))
```

Change the text per state:

```powerfx
// stsRequests.ActionText
If(locState = "Error", "Try again", "New request")
```

## Accessibility

- The title and message are real text, so screen readers read them; while loading, the spinner's accessible label is the title.
- The error state uses a symbol and words as well as colour.
- Write the message as the next step ("Check your connection, then try again"), not a code.

## Known limits

- **StateFor** is an output function, so it only uses the three values you pass. That's how Power Apps function properties work.
- Keep the state in a variable, as above, rather than setting `State` to `stsRequests.StateFor(…)` directly: an input that reads its own instance's outputs can cause a circular reference warning.
- Put it in front of the gallery (later in the tree view) and the same size.

## Change log

- **0.1.0:** first version, for testing in Power Apps Studio.
