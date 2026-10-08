# Component paste-tests (MVP-049)

How to test each library component in Power Apps Studio before publishing it. About 10 minutes each. Use your **developer environment**, never a production one.

## Every component

1. Create a blank canvas app (tablet is easiest).
2. **Settings → Updates:** check that **Modern controls and themes** and **Enhanced component properties** are on.
3. **Components** tab (next to Screens in the tree view) → **New component**. Select an empty part of Studio, so the new component isn't selected.
4. Copy the component's YAML (from `/admin/components` → the component → "Show the YAML to paste") and press **Ctrl+V**.
5. ✅ The component appears with the name shown below, and its **Properties** panel lists every property in its table.
   ❌ If there's an error, copy its text. Then right-click your empty "Component1" → **View code** → **Copy code** and send that too.
6. Insert it on **Screen1** (**Insert → Custom**) and rename the instance as shown below.
7. Work through its table. Then: **keyboard** (in preview, Tab to it and use Enter or Space), **resize** the instance, and **dark theme** if your app has one.
8. In `/admin/components`, record your **Studio version** (Settings → Support → Session details → "Studio version"). Then publish.

Tell the agent about anything that didn't work, with a screenshot if you can; it fixes the YAML, and the next release updates the draft (your test record is cleared, so test it again).

## Button: `lcsButton` → name it `MyButton`

The pilot checklist (`.nav-mock/components/pilot-test-checklist.md`) has the full table: Label, Appearance, IconName, IsBusy, ClickCount, OnClick, FormatLabel, IsValidLabel, ResetCount.

## Text field: `lcsTextField` → name it `txtEmail`

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Set `Label` to `"Work email"`, `Required` to `true` | The label reads "Work email *" |
| Input | Set `MaxLength` to `20` and type | The count shows "n/20" and stops at 20 |
| Input | Set `ErrorMessage` to `"Taken"` | "Taken" shows in red and the box turns red |
| Event | Set `OnChange` to `Notify(Value)`; type, then click away | A message with the text, once you leave the box |
| Output | Add a label: `txtEmail.Value & " / " & txtEmail.IsValid` | It updates as you type |
| InputFunction | Set `Validate` to `If(IsMatch(Text, Match.Email) \|\| IsBlank(Text), "", "Enter an email")`; type "abc" and leave | "Enter an email" shows |
| Action | A button with `txtEmail.Reset()` | The box goes back to `DefaultValue` and the error clears |
| Required | Clear the box and leave it (with `ErrorMessage` empty) | "This field is required." |

## Dialog: `lcsDialog` → name it `dlgDelete`

Set the instance's **Width** to `Parent.Width`, **Height** to `Parent.Height`, and keep it last in the tree view.

| Kind | Do this | Expect |
| --- | --- | --- |
| Action | A button with `dlgDelete.Open()` | The screen dims and the dialog shows |
| Event | Set `OnConfirm` to `Notify("Deleted")`; open it and select **Delete** | It closes, then "Deleted" |
| Event | Set `OnCancel` to `Notify("Kept")`; open it and select **Cancel** | It closes, then "Kept" |
| Output | A label: `dlgDelete.IsOpen & " / " & dlgDelete.Result` | "true / " while open; "false / Confirmed" or "false / Cancelled" after |
| Input | Set `CancelText` to `""` | One button only (an alert) |
| Action | `dlgDelete.Close()` from a timer or another button while open | It closes with no answer |
| Clicks | While it's open, click where a screen button is behind the dimmed area | Nothing behind it is clicked |

## Toast: `lcsToast` → name it `tstMain`

| Kind | Do this | Expect |
| --- | --- | --- |
| Action | A button with `tstMain.Show("Saved.", "Success")` | A green bar with ✓ |
| Action | Try `"Info"`, `"Warning"`, `"Error"` and `"Other"` | Blue, amber, red; "Other" shows as Info |
| Input | Set `ActionText` to `"Undo"` | An Undo button on the bar |
| Event | Set `OnAction` to `Notify("Undo")`; select **Undo** | The bar closes, then "Undo" |
| Event | Set `OnDismiss` to `Notify("Closed")`; select the ✕ | The bar closes, then "Closed" |
| InputFunction | Set `FormatMessage` to `Kind & ": " & Message` | "Success: Saved." |
| Output | A label: `tstMain.IsOpen & " / " & tstMain.CurrentKind` | Matches what's showing |
| Action | `tstMain.Hide()` | It closes, without OnDismiss |

## Tabs: `lcsTabs` → name it `tabsRequest`

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Set `Items` to `["Overview", "Details", "History"]` and `DefaultTab` to `"Details"` | Three tabs, Details selected |
| Input | Set `Look` to `"Filled"`, then `"Subtle"`, `"Transparent"` | The look changes |
| Output | A label: `tabsRequest.SelectedTab` | It follows your clicks |
| Event | Set `OnChange` to `Notify(Tab)` | A message with the new tab's name |
| Action | A button with `tabsRequest.SelectTab("History")` | History is selected |
| OutputFunction | In Screen1.OnVisible: `Set(gblTabs, tabsRequest.ItemsFromText("Open, Waiting, Done"))`, then set `Items` to `gblTabs` | Three tabs: Open, Waiting, Done |
| Keyboard | Tab to the tabs, then the arrow keys | The selection moves |

## Empty, loading and error states: `lcsStates` → name it `stsRequests`

| Kind | Do this | Expect |
| --- | --- | --- |
| Input | Set `State` to `"Empty"`, `"Loading"`, `"Error"`, then `""` | The circle, the spinner, the red "!", then nothing |
| Input | Leave `Title` and `Message` empty | The default text for each state |
| Input | Set `ActionText` to `"Try again"` with `State` `"Error"` | An outline button |
| Event | Set `OnAction` to `Notify(State)`; select the button | "Empty" or "Error" |
| Output | A label: `stsRequests.IsShowing` | true for the three states, false for `""` |
| OutputFunction | A label: `stsRequests.StateFor(false, true, 3)` | "Error" |
