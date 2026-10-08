---
title: "Empty, loading and error states"
slug: states
category: states
summary: "One panel for the states every list needs: nothing yet, loading (a spinner or skeleton rows), and something went wrong. A helper picks the state, the button tells you which state it was, and it takes your brand colour, light or dark."
access: OPEN
version: 0.2.0
modernControls: yes
---
## When to use it

A gallery with no rows shows a blank screen, and a slow or failed load looks the same. **lcsStates** gives every list clear states:

- **Empty**: nothing to show yet, with a button to add the first item;
- **Loading**: a spinner while data loads, or **Skeleton**: grey rows in the shape of the list;
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

## Skeleton rows, brand colour and dark

Set `State` to `"Skeleton"` while a list loads to draw grey placeholder rows in the shape of a list, instead of a spinner. It feels faster because people see where the content will be. `SkeletonRows` sets how many (as many as fit), and `Title` the small "Loading…" line above them.

```powerfx
// stsRequests.State
If(locLoading, "Skeleton", stsRequests.StateFor(false, locFailed, CountRows(galRequests.AllItems)))
```

`AccentColor` colours the spinner and the Empty state's button; `Theme` set to `"Dark"` suits a dark screen.

## Known limits

- **StateFor** is an output function, so it only uses the three values you pass. That's how Power Apps function properties work.
- Keep the state in a variable, as above, rather than setting `State` to `stsRequests.StateFor(…)` directly: an input that reads its own instance's outputs can cause a circular reference warning.
- Put it in front of the gallery (later in the tree view) and the same size.
- The skeleton rows are still, not shimmering: Power Apps can't tell whether someone has asked their device for less motion, so the component doesn't move at all.

## Change log

- **0.2.0:** a `Skeleton` state with `SkeletonRows`; `AccentColor` and `Theme`.
- **0.1.0:** first version, for testing in Power Apps Studio.
